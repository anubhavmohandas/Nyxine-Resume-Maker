import { useState } from 'react';
import { Upload, Home, FileText, Check, X, Sparkles } from 'lucide-react';
import {
  MAX_FILE_SIZE,
  extractTextFromFile,
  extractContactFields,
  buildResumeParsePrompt,
  safeParseResumeJSON,
} from '../lib/resumeExtract';

// No-key resume upload: extract text client-side, regex-fill contact fields,
// then hand the heavy structuring to the user's own Claude/ChatGPT and let
// them paste the JSON back to populate the wizard.
const UploadView = ({ setProfile, setCurrentView, setCurrentStep }) => {
  const [stage, setStage] = useState('pick'); // 'pick' | 'review'
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [autoFilled, setAutoFilled] = useState([]);
  const [aiTarget, setAiTarget] = useState('claude');
  const [jsonPaste, setJsonPaste] = useState('');
  const [toast, setToast] = useState('');

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 5000); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');

    if (file.size > MAX_FILE_SIZE) {
      setErr(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 10MB.`);
      return;
    }
    if (!/\.(pdf|docx?)$/i.test(file.name)) {
      setErr('Please upload a PDF or DOCX file.');
      return;
    }

    setBusy(true);
    try {
      const extracted = await extractTextFromFile(file);
      if (!extracted || extracted.length < 50) {
        throw new Error('Could not read text — the file may be image-based (scanned) or empty.');
      }
      setText(extracted);
      setFileName(file.name);

      const contact = extractContactFields(extracted);
      if (Object.keys(contact).length) {
        setProfile((prev) => ({ ...prev, personal: { ...prev.personal, ...contact } }));
        setAutoFilled(Object.keys(contact));
      }
      setStage('review');
    } catch (ex) {
      setErr(ex.message || 'Failed to read the file.');
    } finally {
      setBusy(false);
    }
  };

  const launchParse = () => {
    const prompt = buildResumeParsePrompt(text);
    if (aiTarget === 'claude') {
      window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener');
      flash("Opening Claude. If the prompt didn't auto-fill, paste it with Ctrl/⌘+V.");
    } else if (aiTarget === 'chatgpt') {
      navigator.clipboard.writeText(prompt).catch(() => {});
      window.open('https://chatgpt.com/', '_blank', 'noopener');
      flash('Prompt copied + ChatGPT opened — paste with Ctrl/⌘+V.');
    } else {
      navigator.clipboard.writeText(prompt).catch(() => {});
      flash('Prompt copied to clipboard — paste it into any AI tool.');
    }
  };

  const applyJSON = () => {
    const { ok, data, error } = safeParseResumeJSON(jsonPaste);
    if (!ok) { setErr(error); return; }
    setProfile((prev) => ({
      ...prev,
      personal: { ...prev.personal, ...data.personal },
      workExperience: data.workExperience.length ? data.workExperience : prev.workExperience,
      education: data.education.length ? data.education : prev.education,
      projects: data.projects.length ? data.projects : prev.projects,
      skills: { ...prev.skills, ...data.skills },
      additional: { ...prev.additional, ...data.additional },
    }));
    setCurrentView('wizard');
    setCurrentStep(0);
  };

  const inputCls = 'w-full text-sm ny-input rounded-lg p-3 border ny-border';

  return (
    <div className="min-h-screen ny-bg p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold ny-heading-gradient">Upload Resume</h1>
            <p className="ny-text-2 text-xs sm:text-sm mt-1">
              Reads your file on-device. No account or API key needed — the AI step uses your own Claude/ChatGPT.
            </p>
          </div>
          <button onClick={() => setCurrentView('landing')} className="shrink-0 px-3 sm:px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" />Home
          </button>
        </div>

        {err && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/15 text-red-300 text-sm border border-red-500/30 flex items-start gap-2">
            <X className="w-4 h-4 mt-0.5 shrink-0" /><span>{err}</span>
          </div>
        )}
        {toast && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-green-500/15 text-green-300 text-sm border border-green-500/30">
            ✅ {toast}
          </div>
        )}

        {stage === 'pick' && (
          <label className={`flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed ny-border cursor-pointer hover:bg-white/5 transition-colors ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
            <Upload className="w-10 h-10 ny-text-3" />
            <span className="ny-text-1 font-semibold">{busy ? 'Reading file…' : 'Choose a PDF or DOCX'}</span>
            <span className="ny-text-3 text-xs">Max 10MB · processed locally in your browser</span>
            <input type="file" accept=".pdf,.docx,.doc" onChange={onFile} className="hidden" disabled={busy} />
          </label>
        )}

        {stage === 'review' && (
          <div className="space-y-4">
            <div className="ny-card rounded-lg border ny-border p-4">
              <div className="flex items-center gap-2 text-sm ny-text-1 font-medium">
                <FileText className="w-4 h-4" />{fileName}
                <span className="ny-text-3 font-normal">· {text.length.toLocaleString()} characters read</span>
              </div>
              {autoFilled.length > 0 && (
                <p className="text-xs text-green-300 mt-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />Auto-filled from text: {autoFilled.join(', ')}
                </p>
              )}
            </div>

            <div className="ny-card rounded-lg border ny-border p-4 space-y-3">
              <div>
                <span className="text-sm font-semibold ny-text-1 flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Structure the rest with your own AI</span>
                <p className="text-xs ny-text-2 mt-1">Send the resume to your AI, ask it for JSON, then paste the result back below. No key required.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['claude', 'chatgpt', 'other'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setAiTarget(t)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${aiTarget === t ? 'bg-purple-500/20 border-purple-400/60 text-purple-300' : 'ny-border ny-text-2 hover:bg-white/5'}`}
                  >
                    {t === 'claude' ? '✦ Claude' : t === 'chatgpt' ? '⬡ ChatGPT' : '📋 Copy only'}
                  </button>
                ))}
              </div>
              <button onClick={launchParse} className="w-full py-2 rounded-lg text-sm font-medium ny-btn-primary">
                {aiTarget === 'claude' ? 'Open in Claude →' : aiTarget === 'chatgpt' ? 'Copy + Open ChatGPT →' : 'Copy parse prompt →'}
              </button>
            </div>

            <div className="ny-card rounded-lg border ny-border p-4 space-y-3">
              <span className="text-sm font-semibold ny-text-1">Paste the JSON back here</span>
              <textarea
                value={jsonPaste}
                onChange={(e) => setJsonPaste(e.target.value)}
                placeholder='{ "personal": { ... }, "workExperience": [ ... ], ... }'
                rows={8}
                className={`${inputCls} resize-none font-mono`}
              />
              <div className="flex gap-2">
                <button onClick={applyJSON} disabled={!jsonPaste.trim()} className={`flex-1 py-2 rounded-lg text-sm font-medium ${jsonPaste.trim() ? 'ny-btn-primary' : 'opacity-40 cursor-not-allowed ny-subcard ny-text-2'}`}>
                  Apply to form →
                </button>
                <button onClick={() => { setStage('pick'); setText(''); setJsonPaste(''); setErr(''); setAutoFilled([]); }} className="px-4 py-2 rounded-lg text-sm ny-btn-secondary">
                  Start over
                </button>
              </div>
              <button onClick={() => { setCurrentView('wizard'); setCurrentStep(0); }} className="text-xs ny-text-3 hover:ny-text-1 underline">
                Skip — just take the auto-filled fields and edit manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadView;
