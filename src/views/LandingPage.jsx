import { AlertCircle, Check, X, Upload, FileText, Sparkles, Target } from 'lucide-react';
import ModeToggle from '../components/ModeToggle';

// Entry screen — "what do you want to do?" workflow cards, not a form.
const LandingPage = ({ showStorageWarning, setShowStorageWarning, setCurrentView, setCurrentStep, profile, savedResumes, theme, mode, toggleMode, importData }) => {
  const hasProfile = profile.personal.fullName || (savedResumes && savedResumes.length > 0);

  const actions = [
    { icon: <FileText className="w-6 h-6" />, title: 'Build New Resume', desc: 'Start your master profile from scratch.', onClick: () => { setCurrentView('wizard'); setCurrentStep(0); } },
    { icon: <Upload className="w-6 h-6" />, title: 'Import Existing', desc: 'Upload a PDF or DOCX to auto-fill.', onClick: () => setCurrentView('upload') },
    { icon: <Target className="w-6 h-6" />, title: 'Generate Targeted', desc: 'Match your profile to a job description.', onClick: () => setCurrentView('generate') },
    { icon: <Sparkles className="w-6 h-6" />, title: 'AI Coach', desc: 'Sharpen an existing resume with 24 prompts.', onClick: () => setCurrentView('coach') },
  ];

  return (
    <div className="min-h-screen ny-bg flex items-center justify-center p-3 sm:p-6">
      <div className="max-w-4xl w-full">
        {showStorageWarning && (
          <div className="mb-4 sm:mb-6 ny-card border ny-border rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 ny-accent flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold ny-accent mb-2">Your Data Stays Private</h3>
                <div className="space-y-2 ny-text-2 text-sm">
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 ny-success-text" />Stored locally in your browser</p>
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 ny-success-text" />Nothing sent to external servers</p>
                  <p className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" />Clearing browser cache deletes data</p>
                  <p className="ny-accent mt-3">💡 Export regularly to back up your work</p>
                </div>
              </div>
              <button onClick={() => setShowStorageWarning(false)} className="ny-text-2 hover:ny-text-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="ny-card rounded-2xl shadow-2xl p-5 sm:p-8 border ny-border">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className={`text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 ${theme === 'dark' ? 'ny-title-dark' : 'ny-title-light'}`} style={{ letterSpacing: '0.08em' }}>NYXINE</h1>
            <p className="text-lg sm:text-xl ny-text-2">Build your profile once. Generate tailored resumes forever.</p>

            <div className="mt-5 flex flex-col items-center gap-2">
              <ModeToggle mode={mode} toggleMode={toggleMode} />
              <p className="text-xs ny-text-3 mt-1">
                {mode === 'industry'
                  ? 'Professional career track — work experience, skills, projects'
                  : 'Research & academia track — publications, ORCID, thesis, presentations'}
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold ny-text-3 tracking-wide uppercase mb-3">What do you want to do?</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {actions.map((a) => (
              <button
                key={a.title}
                onClick={a.onClick}
                className="ny-subcard rounded-xl p-5 border ny-border-strong text-left transition-all hover:border-purple-500/60 hover:-translate-y-0.5"
              >
                <div className="ny-accent mb-3">{a.icon}</div>
                <h3 className="text-lg font-semibold ny-text-1 mb-1">{a.title}</h3>
                <p className="ny-text-2 text-sm">{a.desc}</p>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t ny-divider flex flex-col sm:flex-row items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-sm ny-text-2 hover:ny-text-1 cursor-pointer transition-colors group">
              <Upload className="w-4 h-4 group-hover:ny-accent transition-colors" />
              <span>Import backup (.json)</span>
              <input type="file" accept=".json,.nyxine" onChange={importData} className="hidden" />
            </label>
            {hasProfile && (
              <>
                <span className="ny-text-3 hidden sm:block">·</span>
                <button onClick={() => setCurrentView('dashboard')} className="ny-accent hover:opacity-80 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />Go to my Workspace
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6 ny-text-3 text-sm">
          <p>Open Source • Privacy First • Local-First</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
