import { useState } from 'react';
import { Home } from 'lucide-react';
import { profileToResumeText } from '../lib/profile';

const CoachView = ({ profile, setCurrentView }) => {
  const [openSections, setOpenSections] = useState({
    review: true, ats: true, linkedin: true, outreach: true, strategy: true, linkedin_deep: false, internship: false
  });
  const [toast, setToast] = useState('');
  const [aiModel, setAiModel] = useState('claude');
  // inputs
  const [toneCompanies, setToneCompanies] = useState('');
  const [atsJD, setAtsJD] = useState('');
  const [roleAlignRole, setRoleAlignRole] = useState('');
  const [roleAlignType, setRoleAlignType] = useState('');
  const [linkedinRole, setLinkedinRole] = useState('');
  const [coverRole, setCoverRole] = useState('');
  const [coverCompany, setCoverCompany] = useState('');
  const [coverJD, setCoverJD] = useState('');
  const [coldCompany, setColdCompany] = useState('');
  const [coldRole, setColdRole] = useState('');
  const [followupContext, setFollowupContext] = useState('');
  const [followupName, setFollowupName] = useState('');
  const [blueprintRole, setBlueprintRole] = useState('');
  const [blueprintCity, setBlueprintCity] = useState('');
  const [interviewRole, setInterviewRole] = useState('');
  const [interviewCompany, setInterviewCompany] = useState('');
  // Internship Toolkit inputs
  const [intResumeRole, setIntResumeRole] = useState('');
  const [intLinkedinRole, setIntLinkedinRole] = useState('');
  const [intHuntRole, setIntHuntRole] = useState('');
  const [intHuntCity, setIntHuntCity] = useState('');
  const [intCoverRole, setIntCoverRole] = useState('');
  const [intCoverCompany, setIntCoverCompany] = useState('');
  const [intCoverJD, setIntCoverJD] = useState('');
  const [intDmRole, setIntDmRole] = useState('');
  const [intDmCompany, setIntDmCompany] = useState('');
  const [intInterviewRole, setIntInterviewRole] = useState('');
  const [intInterviewCompany, setIntInterviewCompany] = useState('');
  const [intTrackerRole, setIntTrackerRole] = useState('');

  const resumeText = profileToResumeText(profile);
  const allBullets = [
    ...(profile.workExperience || []).flatMap(j =>
      (j.bullets || []).filter(b => b.trim()).map(b => `[${j.title || 'Role'} @ ${j.company || ''}] ${b}`)
    ),
    ...(profile.researchExperience || []).flatMap(r =>
      (r.bullets || []).filter(b => b.trim()).map(b => `[${r.title || 'Research'} @ ${r.institution || ''}] ${b}`)
    ),
  ].join('\n');

  const launch = (prompt) => {
    if (aiModel === 'claude') {
      window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener');
      setToast("Opening Claude… if the prompt didn't auto-fill, press Ctrl+V / ⌘V to paste.");
    } else if (aiModel === 'chatgpt') {
      navigator.clipboard.writeText(prompt).catch(() => {});
      window.open('https://chatgpt.com/', '_blank', 'noopener');
      setToast('Prompt copied + ChatGPT opened → paste with Ctrl+V / ⌘V in the chat box.');
    } else {
      navigator.clipboard.writeText(prompt).catch(() => {});
      setToast('Prompt copied to clipboard — paste it in your AI tool of choice.');
    }
    setTimeout(() => setToast(''), 6000);
  };

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Static color maps — avoids dynamic template literals that Tailwind v4 can't scan
  const CARD_COLORS = {
    red:    { bg: 'bg-red-500/5',    hoverBg: 'hover:bg-red-500/10',    hoverBorder: 'hover:border-red-400/60',    title: 'group-hover:text-red-300',    badge: 'bg-red-500/20 text-red-300'    },
    blue:   { bg: 'bg-blue-500/5',   hoverBg: 'hover:bg-blue-500/10',   hoverBorder: 'hover:border-blue-400/60',   title: 'group-hover:text-blue-300',   badge: 'bg-blue-500/20 text-blue-300'   },
    green:  { bg: 'bg-green-500/5',  hoverBg: 'hover:bg-green-500/10',  hoverBorder: 'hover:border-green-400/60',  title: 'group-hover:text-green-300',  badge: 'bg-green-500/20 text-green-300'  },
    amber:  { bg: 'bg-amber-500/5',  hoverBg: 'hover:bg-amber-500/10',  hoverBorder: 'hover:border-amber-400/60',  title: 'group-hover:text-amber-300',  badge: 'bg-amber-500/20 text-amber-300'  },
    orange: { bg: 'bg-orange-500/5', hoverBg: 'hover:bg-orange-500/10', hoverBorder: 'hover:border-orange-400/60', title: 'group-hover:text-orange-300', badge: 'bg-orange-500/20 text-orange-300' },
    purple: { bg: 'bg-purple-500/5', hoverBg: 'hover:bg-purple-500/10', hoverBorder: 'hover:border-purple-400/60', title: 'group-hover:text-purple-300', badge: 'bg-purple-500/20 text-purple-300' },
    teal:   { bg: 'bg-teal-500/5',   hoverBg: 'hover:bg-teal-500/10',   hoverBorder: 'hover:border-teal-400/60',   title: 'group-hover:text-teal-300',   badge: 'bg-teal-500/20 text-teal-300'   },
    indigo: { bg: 'bg-indigo-500/5', hoverBg: 'hover:bg-indigo-500/10', hoverBorder: 'hover:border-indigo-400/60', title: 'group-hover:text-indigo-300', badge: 'bg-indigo-500/20 text-indigo-300' },
    violet: { bg: 'bg-violet-500/5', hoverBg: 'hover:bg-violet-500/10', hoverBorder: 'hover:border-violet-400/60', title: 'group-hover:text-violet-300', badge: 'bg-violet-500/20 text-violet-300' },
    rose:   { bg: 'bg-rose-500/5',   hoverBg: 'hover:bg-rose-500/10',   hoverBorder: 'hover:border-rose-400/60',   title: 'group-hover:text-rose-300',   badge: 'bg-rose-500/20 text-rose-300'   },
  };

  const launchLabel = aiModel === 'claude'
    ? 'Open in Claude →'
    : aiModel === 'chatgpt'
    ? 'Copy + Open ChatGPT →'
    : 'Copy Prompt →';

  const SectionHeader = ({ sectionKey, icon, title, count, color }) => {
    const c = CARD_COLORS[color] || CARD_COLORS.blue;
    return (
      <button
        onClick={() => toggle(sectionKey)}
        className={`w-full flex items-center justify-between p-4 rounded-lg border ny-border transition-all ${c.hoverBg} text-left`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold ny-text-1">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{count} prompts</span>
        </div>
        <span className="ny-text-3 text-sm">{openSections[sectionKey] ? '▲' : '▼'}</span>
      </button>
    );
  };

  const SimpleBtn = ({ onClick, emoji, title, subtitle, hoverColor }) => {
    const c = CARD_COLORS[hoverColor] || CARD_COLORS.blue;
    return (
      <button
        onClick={onClick}
        className={`group flex flex-col items-start gap-1 p-4 rounded-lg border ny-border ${c.hoverBorder} ${c.bg} ${c.hoverBg} transition-all text-left`}
      >
        <span className={`text-sm font-semibold ny-text-1 ${c.title} transition-colors`}>{emoji} {title}</span>
        <span className="text-xs ny-text-2">{subtitle}</span>
        <span className="text-xs mt-1 ny-text-3">{launchLabel}</span>
      </button>
    );
  };

  const InputCard = ({ emoji, title, subtitle, color, children, onLaunch, disabled }) => {
    const c = CARD_COLORS[color] || CARD_COLORS.blue;
    return (
      <div className={`p-4 rounded-lg border ny-border ${c.bg} space-y-2`}>
        <span className="text-sm font-semibold ny-text-1">{emoji} {title}</span>
        <p className="text-xs ny-text-2">{subtitle}</p>
        {children}
        <button
          onClick={onLaunch}
          disabled={disabled}
          className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed ny-subcard ny-text-2' : 'ny-btn-primary'}`}
        >
          {launchLabel}
        </button>
      </div>
    );
  };

  const inputCls = "w-full text-xs ny-input rounded-lg p-2 border ny-border";
  const textareaCls = "w-full text-xs ny-input rounded-lg p-2 resize-none border ny-border";

  return (
    <div className="min-h-screen ny-bg p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold ny-heading-gradient">AI Coach</h1>
            <p className="ny-text-2 text-xs sm:text-sm mt-1">
              {aiModel === 'claude' && 'One click → Claude opens with your resume pre-loaded'}
              {aiModel === 'chatgpt' && 'Prompt copies to clipboard + ChatGPT opens → just paste'}
              {aiModel === 'other' && 'Prompt copies to clipboard → paste it in any AI tool'}
            </p>
          </div>
          <button onClick={() => setCurrentView('dashboard')} className="shrink-0 px-3 sm:px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" />Dashboard
          </button>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-3 mb-5 p-3 ny-card rounded-lg border ny-border flex-wrap">
          <span className="text-sm ny-text-2 font-medium shrink-0">Open prompt in:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setAiModel('claude')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                aiModel === 'claude'
                  ? 'bg-orange-500/20 border-orange-400/60 text-orange-300'
                  : 'ny-border ny-text-2 hover:bg-white/5'
              }`}
            >
              ✦ Claude {aiModel === 'claude' && <span className="text-xs">✓</span>}
            </button>
            <button
              onClick={() => setAiModel('chatgpt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                aiModel === 'chatgpt'
                  ? 'bg-green-500/20 border-green-400/60 text-green-300'
                  : 'ny-border ny-text-2 hover:bg-white/5'
              }`}
            >
              ⬡ ChatGPT {aiModel === 'chatgpt' && <span className="text-xs">✓</span>}
            </button>
            <button
              onClick={() => setAiModel('other')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                aiModel === 'other'
                  ? 'bg-slate-500/20 border-slate-400/60 text-slate-300'
                  : 'ny-border ny-text-2 hover:bg-white/5'
              }`}
            >
              📋 Other {aiModel === 'other' && <span className="text-xs">✓</span>}
            </button>
          </div>
          {aiModel === 'chatgpt' && (
            <span className="text-xs ny-text-3 ml-auto hidden sm:block">Copies prompt + opens ChatGPT → paste with Ctrl+V</span>
          )}
          {aiModel === 'other' && (
            <span className="text-xs ny-text-3 ml-auto hidden sm:block">Prompt will be copied to your clipboard</span>
          )}
        </div>

        {toast && (
          <div className="mb-5 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm border border-green-500/30">
            ✅ {toast}
          </div>
        )}

        <div className="space-y-3">

          {/* ── 📄 Resume Review ─────────────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="review" icon="📄" title="Resume Review" count={4} color="red" />
            {openSections.review && (
              <div className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SimpleBtn
                    emoji="⚡" title="6-Second Filter" subtitle="Google recruiter lens — XYZ rewrite + 3 before/afters" hoverColor="red"
                    onClick={() => launch(
                      `Here is my resume:\n\n${resumeText}\n\n---\nAct as a senior recruiter at Google who screens resumes in under 6 seconds. Rewrite my resume to pass that filter:\n- Create a 2–3 sentence professional summary with clear positioning and impact\n- Rewrite all bullets using the XYZ formula: Accomplished X, measured by Y, by doing Z\n- Add metrics to every achievement (%, $, scale) — if I haven't given you numbers, ask me targeted questions\n- Replace weak verbs with strong action verbs\n- Cut all filler and enforce a 1-page format (2 pages if 10+ years experience)\n- Remove red flags (gaps, outdated tools, irrelevant content)\n\nOutput:\n1. Full rewritten resume\n2. Before vs after for the 3 weakest bullets\n3. Summary of key improvements`
                    )}
                  />
                  <SimpleBtn
                    emoji="📊" title="Bullet & Impact Rewriter" subtitle="McKinsey quantification + XYZ formula on every bullet" hoverColor="blue"
                    onClick={() => launch(
                      `Here are my resume bullet points:\n\n${allBullets || '[No bullets found — please add experience bullet points first]'}\n\n---\nAct as a resume strategist at McKinsey & Company. Turn every bullet into measurable impact:\n- Rewrite using the formula: Achieved X → Result Y → By doing Z\n- Add metrics: revenue, cost savings, growth %, time saved, scale\n- Quantify leadership, process creation, and improvements\n- Replace weak verbs with strong action verbs\n- Highlight promotions, ownership, and outcomes\n\nOutput:\n1. Before vs after for every bullet\n2. Fully quantified achievement statements\n3. Flag any bullets where you need more info from me to add real numbers`
                    )}
                  />
                  <SimpleBtn
                    emoji="✨" title="Final Polish" subtitle="Kill clichés, fix tense, replace generic language" hoverColor="green"
                    onClick={() => launch(
                      `Here is my resume:\n\n${resumeText}\n\n---\nDo a final polish review. Check for: (1) consistency in verb tense across bullet points, (2) clichés or overused phrases like "team player", "hardworking", "detail-oriented", "passionate", "results-driven" — flag every instance, (3) anything that sounds generic and could apply to any candidate. For each issue found, replace it with specific, powerful language that reflects my actual experience.`
                    )}
                  />
                </div>
                <InputCard
                  emoji="🎨" title="Tone Match" subtitle="Rewrite summary & skills to mirror target company voice" color="purple"
                  onLaunch={() => {
                    if (!toneCompanies.trim()) { alert('Enter at least one target company'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nBased on the tone, language, values, and culture of companies like ${toneCompanies}, rewrite my professional summary and skills section so it sounds like I genuinely belong in their world — not like a generic applicant. Mirror the language they use in job postings and their public communications.`);
                  }}
                  disabled={!toneCompanies.trim()}
                >
                  <input type="text" value={toneCompanies} onChange={e => setToneCompanies(e.target.value)} placeholder="e.g. Google, Stripe, McKinsey" className={inputCls} />
                </InputCard>
              </div>
            )}
          </div>

          {/* ── 🎯 ATS & Targeting ───────────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="ats" icon="🎯" title="ATS & Targeting" count={2} color="amber" />
            {openSections.ats && (
              <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputCard
                  emoji="🔍" title="ATS Deep Scan" subtitle="Workday/Greenhouse/Lever keyword analysis + ATS score estimate" color="amber"
                  onLaunch={() => {
                    if (!atsJD.trim()) { alert('Paste a job description first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nHere is the job description I'm applying for:\n\n${atsJD}\n\n---\nAct as an ATS expert who understands systems like Workday, Greenhouse, and Lever. Optimize my resume to pass automated screening:\n- Extract and integrate exact keywords from the JD\n- Align formatting for ATS readability (no tables, clean structure)\n- Improve keyword density without sounding unnatural\n- Match skills, titles, and phrasing to the target role\n- Ensure compatibility with parsing systems\n\nOutput:\n1. Optimized resume sections\n2. Keyword match breakdown (what you added and where)\n3. ATS score estimate (before vs after) with improvements`);
                  }}
                  disabled={!atsJD.trim()}
                >
                  <textarea value={atsJD} onChange={e => setAtsJD(e.target.value)} placeholder="Paste job description here…" rows={3} className={textareaCls} />
                </InputCard>
                <InputCard
                  emoji="🎪" title="Role Alignment" subtitle="Dual pass: ATS parsing + human recruiter rewrite for your target role" color="orange"
                  onLaunch={() => {
                    if (!roleAlignRole.trim()) { alert('Enter a target role first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nI'm targeting the role of ${roleAlignRole}${roleAlignType ? ` at a ${roleAlignType} company` : ''}.\n\nAct as both an ATS system and a human recruiter. Do a dual-pass rewrite:\n1. ATS pass: identify missing keywords for this role, restructure bullets for parsing, align titles and skills section\n2. Human pass: make the resume compelling to a real recruiter — strong narrative, clear career progression, standout achievements\n\nOutput the rewritten resume with notes on what changed in each pass and why.`);
                  }}
                  disabled={!roleAlignRole.trim()}
                >
                  <input type="text" value={roleAlignRole} onChange={e => setRoleAlignRole(e.target.value)} placeholder="Target role (e.g. Product Manager)" className={inputCls} />
                  <input type="text" value={roleAlignType} onChange={e => setRoleAlignType(e.target.value)} placeholder="Company type (e.g. Series B startup) — optional" className={`${inputCls} mt-1.5`} />
                </InputCard>
              </div>
            )}
          </div>

          {/* ── 🔗 LinkedIn & Brand ──────────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="linkedin" icon="🔗" title="LinkedIn & Brand" count={1} color="blue" />
            {openSections.linkedin && (
              <div className="p-4 pt-2">
                <InputCard
                  emoji="💼" title="LinkedIn Optimizer" subtitle="Rewrites headline, About, skills, and top 3 experiences for your target role" color="blue"
                  onLaunch={() => {
                    if (!linkedinRole.trim()) { alert('Enter a target role first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nI want to optimize my LinkedIn profile for the role of ${linkedinRole}.\n\nRewrite the following LinkedIn sections using my resume as source material:\n1. Headline — punchy, keyword-rich, under 220 characters\n2. About section — first-person, story-driven, 3–5 short paragraphs, ends with a clear call to action\n3. Top 3 experience descriptions — achievement-focused, not job-description style\n4. Skills section — ranked by relevance to ${linkedinRole}, top 10 to feature\n\nMake it sound human and confident, not like a robot wrote it.`);
                  }}
                  disabled={!linkedinRole.trim()}
                >
                  <input type="text" value={linkedinRole} onChange={e => setLinkedinRole(e.target.value)} placeholder="Target role (e.g. Growth Marketer)" className={inputCls} />
                </InputCard>
              </div>
            )}
          </div>

          {/* ── 📬 Outreach ──────────────────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="outreach" icon="📬" title="Outreach" count={3} color="green" />
            {openSections.outreach && (
              <div className="p-4 pt-2 space-y-3">
                <InputCard
                  emoji="📝" title="Cover Letter" subtitle="250–300 words, bold opener, cultural fit, 90-day contribution, marks customizable sections" color="green"
                  onLaunch={() => {
                    if (!coverRole.trim() || !coverCompany.trim()) { alert('Enter role and company name'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\n${coverJD ? `Here is the job description:\n\n${coverJD}\n\n---\n` : ''}Act as a recruitment director at Robert Half. Write a 250–300 word cover letter for the role of ${coverRole} at ${coverCompany} that gets interviews:\n- Strong opening tied to ${coverCompany}'s context (no generic intro)\n- Show research (product, strategy, or recent move by the company)\n- Match 3 key skills from my resume to the job requirements\n- Include one quantified achievement\n- Demonstrate cultural fit naturally\n- Suggest a relevant contribution in the first 90 days\n- Close confidently with a clear next step\n\nOutput:\n1. Ready-to-send cover letter\n2. Mark in brackets any sections I should customize per application`);
                  }}
                  disabled={!coverRole.trim() || !coverCompany.trim()}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="text" value={coverRole} onChange={e => setCoverRole(e.target.value)} placeholder="Role (e.g. UX Designer)" className={inputCls} />
                    <input type="text" value={coverCompany} onChange={e => setCoverCompany(e.target.value)} placeholder="Company name" className={inputCls} />
                  </div>
                  <textarea value={coverJD} onChange={e => setCoverJD(e.target.value)} placeholder="Job description (optional but recommended)…" rows={2} className={`${textareaCls} mt-1.5`} />
                </InputCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputCard
                    emoji="💬" title="Cold DM" subtitle="LinkedIn message to hiring manager, under 75 words" color="teal"
                    onLaunch={() => {
                      if (!coldCompany.trim() || !coldRole.trim()) { alert('Enter company and role'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nWrite a cold LinkedIn DM I can send to a hiring manager at ${coldCompany} for the role of ${coldRole}.\n\nRules:\n- Under 75 words total\n- No "I hope this message finds you well" or generic openers\n- Lead with a specific insight about ${coldCompany} or the role\n- Connect one concrete achievement from my background to their likely pain point\n- End with one low-friction ask (not "Can we have a 30-min call?")\n- Sound like a person, not a template`);
                    }}
                    disabled={!coldCompany.trim() || !coldRole.trim()}
                  >
                    <input type="text" value={coldCompany} onChange={e => setColdCompany(e.target.value)} placeholder="Company name" className={inputCls} />
                    <input type="text" value={coldRole} onChange={e => setColdRole(e.target.value)} placeholder="Role (e.g. Marketing Lead)" className={`${inputCls} mt-1.5`} />
                  </InputCard>

                  <InputCard
                    emoji="📨" title="Follow-Up Email" subtitle="Warm professional follow-up after interview or application" color="indigo"
                    onLaunch={() => {
                      if (!followupContext.trim()) { alert('Describe the context first'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nContext: ${followupContext}${followupName ? `\nRecipient: ${followupName}` : ''}\n\nWrite a follow-up email that is:\n- Warm but professional — not desperate or overly formal\n- References something specific from our interaction\n- Reinforces one key reason I'm the right fit\n- Under 120 words\n- Ends with a clear but soft next step\n\nDon't use "I wanted to follow up" or "Just checking in" as an opener.`);
                    }}
                    disabled={!followupContext.trim()}
                  >
                    <input type="text" value={followupContext} onChange={e => setFollowupContext(e.target.value)} placeholder="Context (e.g. interviewed at Razorpay last Tuesday)" className={inputCls} />
                    <input type="text" value={followupName} onChange={e => setFollowupName(e.target.value)} placeholder="Recipient name — optional" className={`${inputCls} mt-1.5`} />
                  </InputCard>
                </div>
              </div>
            )}
          </div>

          {/* ── 🗓️ Strategy & Prep ───────────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="strategy" icon="🗓️" title="Strategy & Prep" count={2} color="violet" />
            {openSections.strategy && (
              <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputCard
                  emoji="🗺️" title="7-Day Blueprint" subtitle="Day-by-day job hunt execution plan for your role + city" color="violet"
                  onLaunch={() => {
                    if (!blueprintRole.trim()) { alert('Enter a target role first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nI'm looking for a ${blueprintRole} role${blueprintCity ? ` in ${blueprintCity}` : ''}.\n\nBuild me a detailed 7-day job hunt execution plan. For each day include:\n- Specific tasks (not vague goals)\n- Exact platforms or tools to use\n- Scripts or templates where relevant\n- Metrics to hit (e.g. "apply to 5 roles", "send 3 cold DMs")\n\nBase the strategy on my actual background from the resume above. Make it realistic and actionable, not motivational fluff.`);
                  }}
                  disabled={!blueprintRole.trim()}
                >
                  <input type="text" value={blueprintRole} onChange={e => setBlueprintRole(e.target.value)} placeholder="Target role (e.g. Data Analyst)" className={inputCls} />
                  <input type="text" value={blueprintCity} onChange={e => setBlueprintCity(e.target.value)} placeholder="City / Remote — optional" className={`${inputCls} mt-1.5`} />
                </InputCard>

                <InputCard
                  emoji="🎤" title="Interview Domination" subtitle="10 questions + STAR frameworks + red flags for your role" color="rose"
                  onLaunch={() => {
                    if (!interviewRole.trim()) { alert('Enter a target role first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nI have an interview for ${interviewRole}${interviewCompany ? ` at ${interviewCompany}` : ''}.\n\nGive me:\n1. 10 most likely interview questions for this role (mix of behavioural, technical, and situational)\n2. For each question: a STAR-format answer framework using specific details from my resume\n3. 3 red flags an interviewer might notice from my background — and how to pre-empt or reframe them\n4. 2 smart questions I should ask the interviewer\n\nBe direct. Don't give me generic advice — anchor everything to my actual experience.`);
                  }}
                  disabled={!interviewRole.trim()}
                >
                  <input type="text" value={interviewRole} onChange={e => setInterviewRole(e.target.value)} placeholder="Role (e.g. Software Engineer)" className={inputCls} />
                  <input type="text" value={interviewCompany} onChange={e => setInterviewCompany(e.target.value)} placeholder="Company name — optional" className={`${inputCls} mt-1.5`} />
                </InputCard>
              </div>
            )}
          </div>

          {/* ── 🧲 LinkedIn Deep Audit ──────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="linkedin_deep" icon="🧲" title="LinkedIn Deep Audit" count={5} color="violet" />
            {openSections.linkedin_deep && (
              <div className="p-4 pt-2 space-y-3">
                <p className="text-xs ny-text-3 px-1">Claude will ask for your LinkedIn details conversationally — paste your headline, summary, or bio when prompted.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SimpleBtn
                    emoji="🔎" title="Audit Your Personal Brand" subtitle="Gap analysis between how you present vs how the market perceives you" hoverColor="violet"
                    onClick={() => launch(
                      `<role>Act as a personal brand strategist who has built and diagnosed hundreds of online profiles across LinkedIn, X, Instagram, and YouTube — and can instantly identify the gap between how someone presents themselves and how the market actually perceives them — so every profile, bio, and post is built around the identity that gets hired, followed, and paid instead of the polished one that gets ignored.</role>\n\n<task>Step into the market's first impression of me and show me exactly what a recruiter, investor, or potential client sees when they land on my profile — so I know the real gap between who I am and how I'm currently coming across before I change a single word.</task>\n\n<steps>\n1. Ask for my current LinkedIn URL or bio, my target audience, and the one outcome I want my profile to drive before starting\n2. Map my current brand perception — what my profile says I am, what it implies I do, and what a stranger concludes about me in 8 seconds\n3. Identify the gap between the impression I want to make and the impression I'm actually making — this gap is always where the lost opportunities live\n4. Map every element of my profile that is working against me — the vague headline, the generic summary, the missing social proof, the wrong tone\n5. Predict the exact first impression my dream client or recruiter forms right now, and what they do next — click away, reach out, or keep reading\n6. Deliver the complete brand audit, the specific elements to fix immediately, and the one positioning shift that changes everything\n</steps>\n\n<rules>\n- Brand perception must be mapped from the market's perspective — never from what I think I'm communicating\n- Gap between intended and actual impression must be named explicitly — this is always where the lost opportunities live\n- Every problem element must be named specifically — not "your summary is weak" but "your summary opens with your job title which tells me nothing about your value"\n- Every fix must be specific enough to implement before the next person lands on my profile\n- Test: if my dream client read my profile right now would they feel compelled to reach out or keep scrolling\n</rules>\n\n<output>Current Brand Perception Map → Intended vs Actual Impression Gap → Profile Elements Working Against Me → First Impression Prediction → Specific Fixes to Implement Today</output>`
                    )}
                  />
                  <SimpleBtn
                    emoji="✍️" title="Write Your Magnetic Headline" subtitle="3 variations: authority-led, outcome-led, curiosity-led — all under 220 chars" hoverColor="indigo"
                    onClick={() => launch(
                      `<role>Act as a positioning specialist who has written hundreds of LinkedIn headlines for executives, founders, and operators — and knows that the headline is the only thing standing between a stranger scrolling past and a stranger clicking through — so every word earns its place by communicating value, not just title.</role>\n\n<task>Step into a recruiter or ideal client's scroll and show me exactly what headline would make them stop and click my profile — so my first 10 words do more work than most people's entire summary.</task>\n\n<steps>\n1. Ask for my current headline, my target audience, and the one outcome I want my profile to drive before starting\n2. Map what my current headline communicates — the implied level, the implied value, the implied audience, the implied ask\n3. Identify the gap between what my headline says and what it should say — most headlines describe the past, the best ones promise the future\n4. Map every element of a magnetic headline — the hook that stops the scroll, the value that earns the click, the specificity that builds trust, the outcome that creates desire\n5. Generate three headline variations — one authority-led, one outcome-led, one curiosity-led — each optimized for my specific target audience\n6. Deliver the complete headline map, the three variations with explanations, and the one I should use first\n</steps>\n\n<rules>\n- Headline must be written from the target audience's perspective — never from what sounds impressive to me\n- Job title alone is never a headline — it describes what I do, not why someone should care\n- Every variation must be specific enough that only I could have written it — no generic "helping businesses grow" filler\n- Every variation must fit within LinkedIn's 220-character headline limit\n- Test: if my target audience read this headline in a search result would they click my profile or keep scrolling\n</rules>\n\n<output>Current Headline Perception Map → Title vs Value Gap → Three Headline Variations → Explanation for Each → Recommended First Test</output>`
                    )}
                  />
                  <SimpleBtn
                    emoji="📖" title="Rewrite Summary as a Story" subtitle="Gary Vee voice framework — hook, origin, proof, value, CTA" hoverColor="rose"
                    onClick={() => launch(
                      `<role>Act as a narrative brand writer who has rewritten hundreds of LinkedIn summaries for founders, executives, and operators — and knows that the summary is the only place on a professional profile where a human being is allowed to exist — so every word builds trust, communicates value, and makes the reader feel like they already know and like the person before they've spoken a single word.</role>\n\n<task>Step into my ideal client or recruiter's reading experience and show me exactly what summary would make them feel like they've found exactly the right person — so my About section closes the gap between a profile visit and an actual conversation.</task>\n\n<steps>\n1. Ask for my current summary, my target audience, my biggest professional win, and the one thing I want readers to do after reading before starting\n2. Map what my current summary communicates — the tone, the implied personality, the implied confidence level, the implied ask\n3. Identify the gap between the summary I wrote and the summary my audience needs to read — most summaries are resumes, the best ones are origin stories\n4. Map the structure of a magnetic summary — the opening hook that earns the read, the origin story that builds trust, the proof that removes doubt, the specific value that creates desire, the clear call to action\n5. Rewrite my summary in Gary Vee's voice framework — direct, self-aware, proof-heavy, outcome-focused, human-first, zero corporate language\n6. Deliver the complete summary rewrite, the structural breakdown of every section, and the specific call to action to close with\n</steps>\n\n<rules>\n- Summary must open with a hook, never a job title or "I am a…"\n- Origin story must be specific and true — no manufactured vulnerability, no humble-brag disguised as a story\n- Proof must be specific — numbers, names, outcomes — never "extensive experience" or "proven track record"\n- Call to action must be one specific ask — never three options, never vague "let's connect"\n- Test: if a stranger read this summary would they feel like they already know me and want to reach out\n</rules>\n\n<output>Current Summary Perception Map → Resume vs Story Gap → Magnetic Summary Structure → Full Summary Rewrite → Structural Breakdown → Specific Call to Action</output>`
                    )}
                  />
                  <SimpleBtn
                    emoji="📅" title="Build Your Content Strategy" subtitle="3 content pillars + 10 post ideas with hooks for your niche" hoverColor="teal"
                    onClick={() => launch(
                      `<role>Act as a personal brand content strategist who has built content systems for founders, operators, and executives across LinkedIn, X, and Instagram — and knows that posting without a content strategy is the fastest way to build an audience that never buys, hires, or refers — so every post, every topic, and every format is chosen because it compounds trust with the exact person who needs to see it.</role>\n\n<task>Step into my target audience's LinkedIn feed and show me exactly what content would make them follow me, save my posts, and eventually reach out — so every piece of content I publish builds the brand instead of filling the void.</task>\n\n<steps>\n1. Ask for my niche, my target audience, my biggest area of expertise, and my current posting frequency before starting\n2. Map my current content perception — what my existing posts say about me, what they imply about my expertise, what a stranger concludes about my value after reading three posts\n3. Identify the gap between the content I post and the content that builds trust with my specific audience — most people post what they find interesting, the best ones post what their audience needs to believe\n4. Map the three content pillars that should anchor every post — the expertise pillar that proves I know my craft, the story pillar that proves I am human, the opinion pillar that proves I have a point of view\n5. Generate 10 specific post ideas across the three pillars — real topics, real angles, real hooks — optimized for my niche and audience\n6. Deliver the complete content strategy, the three pillars with descriptions, the 10 post ideas with hooks, and the posting cadence I can sustain\n</steps>\n\n<rules>\n- Content pillars must be specific to my niche — never generic "share value, tell stories, give opinions"\n- Post ideas must include the specific hook — not just the topic but the opening line that earns the read\n- Posting cadence must be sustainable for 12 months — impressive for 6 weeks then silent is worse than consistent forever\n- Every post idea must serve the target audience first — if it only makes me look good it belongs in a diary\n- Test: if my target audience read 10 of my posts in a row would they trust me enough to reach out\n</rules>\n\n<output>Current Content Perception Map → Posting vs Trust-Building Gap → Three Content Pillars → 10 Post Ideas With Hooks → Sustainable Posting Cadence</output>`
                    )}
                  />
                  <SimpleBtn
                    emoji="⚙️" title="Convert Profile to Inbound Machine" subtitle="Full conversion audit — banner to featured section to experience descriptions" hoverColor="amber"
                    onClick={() => launch(
                      `<role>Act as a conversion strategist who has turned hundreds of passive LinkedIn profiles into active inbound pipelines — and knows that a profile is not a resume, it is a landing page — so every element from the banner to the featured section to the experience descriptions is designed to move a visitor from stranger to conversation without a single cold outreach.</role>\n\n<task>Step into my ideal client or recruiter's decision-making process and show me exactly what profile changes would move them from landing on my page to reaching out to me — so my profile does the selling while I sleep.</task>\n\n<steps>\n1. Ask for my current profile URL or description, my target audience, and the last time someone reached out to me cold through LinkedIn before starting\n2. Map my current profile conversion path — what a visitor sees first, what builds trust, what creates desire, what drives action, and where they drop off\n3. Identify the gap between a profile that gets views and a profile that gets inbound — most profiles are passive, the best ones are active funnels\n4. Map every conversion element I am currently missing — the banner that communicates value, the featured section that proves expertise, the experience descriptions that sell outcomes not duties, the skills and recommendations that remove doubt\n5. Build the complete conversion funnel for my profile — the hook that stops the scroll, the proof that builds trust, the value that creates desire, the CTA that drives action\n6. Deliver the complete conversion audit, the specific changes to every profile section, and the one addition that would generate the most inbound in the next 30 days\n</steps>\n\n<rules>\n- Every profile element must serve the conversion goal — if it doesn't move a visitor toward reaching out it belongs somewhere else\n- Experience descriptions must lead with outcomes not duties — "grew revenue 40%" not "responsible for sales"\n- Featured section must be the three best proofs of value I own — not random posts, not LinkedIn articles nobody read\n- Call to action must appear in at least three places — headline, summary close, and featured section\n- Test: if my dream client landed on my profile right now with no prior knowledge of me would they reach out within 48 hours\n</rules>\n\n<output>Current Conversion Path Map → Views vs Inbound Gap → Missing Conversion Elements → Complete Profile Funnel → Specific Section Changes → Highest-Impact 30-Day Addition</output>`
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── 🎓 Internship Toolkit ──────────────────────────── */}
          <div className="ny-card rounded-lg border ny-border overflow-hidden">
            <SectionHeader sectionKey="internship" icon="🎓" title="Internship Toolkit" count={7} color="teal" />
            {openSections.internship && (
              <div className="p-4 pt-2 space-y-3">
                <p className="text-xs ny-text-3 px-1">Internship-specific versions of the core prompts — framed for students and early-career candidates (projects and coursework over thin work history). Your saved resume is auto-attached.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputCard
                    emoji="🎯" title="Internship Resume (ATS + 6s)" subtitle="Beats ATS filters and a 6-second human scan — projects and metrics first" color="red"
                    onLaunch={() => {
                      if (!intResumeRole.trim()) { alert('Enter a target internship role first'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nAct as a senior recruiter hiring interns for the role of ${intResumeRole}. Rewrite my resume to pass ATS keyword filters AND impress a human in under 6 seconds. I am a student / early-career candidate, so:\n- Lead with relevant projects, coursework, certifications and technical skills — do not pad thin work history\n- Convert every weak responsibility into a measurable achievement (scale, %, users, grades, rankings) — if I have not given you numbers, ask me targeted questions\n- Use strong action verbs; cut filler and any soft skill with no evidence\n- Keep it to one page, clean and ATS-parseable (no tables or columns)\n- Mirror the keywords a ${intResumeRole} internship JD would contain\n\nOutput:\n1. Full rewritten one-page resume\n2. Before vs after for my 3 weakest bullets\n3. The exact keywords you added and where`);
                    }}
                    disabled={!intResumeRole.trim()}
                  >
                    <input type="text" value={intResumeRole} onChange={e => setIntResumeRole(e.target.value)} placeholder="Target internship role (e.g. Data Science Intern)" className={inputCls} />
                  </InputCard>

                  <InputCard
                    emoji="💼" title="Internship LinkedIn" subtitle="Headline, About, skills and experiences tuned for recruiter search" color="blue"
                    onLaunch={() => {
                      if (!intLinkedinRole.trim()) { alert('Enter a target internship role first'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nI am a student applying for a ${intLinkedinRole} internship. Rewrite my LinkedIn profile so it gets found and gets replies:\n1. Headline — keyword-rich, under 220 characters, signals the internship I want\n2. About — first person, 3-4 short paragraphs, leads with projects and what I am building toward, ends with a clear ask\n3. Featured skills — top 10 ranked for a ${intLinkedinRole} role\n4. Top experiences / projects — achievement-focused bullets, not duties\n\nMake it discoverable in recruiter searches, credible to hiring managers, and impressive to startup founders. Weave in industry keywords naturally — no buzzword stuffing.`);
                    }}
                    disabled={!intLinkedinRole.trim()}
                  >
                    <input type="text" value={intLinkedinRole} onChange={e => setIntLinkedinRole(e.target.value)} placeholder="Target internship role (e.g. Frontend Intern)" className={inputCls} />
                  </InputCard>
                </div>

                <InputCard
                  emoji="🗺️" title="7-Day Internship Hunt Blueprint" subtitle="Platforms, hidden openings, search keywords, daily targets, networking" color="violet"
                  onLaunch={() => {
                    if (!intHuntRole.trim()) { alert('Enter a target internship role first'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nI want a ${intHuntRole} internship${intHuntCity ? ` in ${intHuntCity}` : ''}. Build a realistic 7-day action plan, day by day, that includes:\n- The best internship platforms to use (name real ones and what to search on each)\n- Hidden / unposted internship opportunities and exactly how to surface them\n- The precise search keywords and boolean strings to use\n- Daily outreach targets (cold DMs / emails) and number of applications per day\n- A networking strategy (who to contact and what to say)\n\nAnchor everything to my actual background above. No motivational filler — give me tasks I can execute today, optimized for landing interview calls fast.`);
                  }}
                  disabled={!intHuntRole.trim()}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="text" value={intHuntRole} onChange={e => setIntHuntRole(e.target.value)} placeholder="Internship role (e.g. ML Intern)" className={inputCls} />
                    <input type="text" value={intHuntCity} onChange={e => setIntHuntCity(e.target.value)} placeholder="City / Remote — optional" className={inputCls} />
                  </div>
                </InputCard>

                <InputCard
                  emoji="📝" title="Internship Cover Letter" subtitle="Personalized to the role and description, projects and motivation forward" color="green"
                  onLaunch={() => {
                    if (!intCoverRole.trim() || !intCoverCompany.trim()) { alert('Enter role and company name'); return; }
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\n${intCoverJD ? `Here is the internship description:\n\n${intCoverJD}\n\n---\n` : ''}Act as a recruiter hiring for a ${intCoverRole} internship at ${intCoverCompany}. Write a personalized, concise cover letter (250-300 words) using my resume${intCoverJD ? ' and the internship description above' : ''}:\n- Open with genuine, specific interest in ${intCoverCompany} (not a generic intro)\n- Lead with my most relevant projects and skills, since I am early-career\n- Include one quantified achievement\n- Show motivation and what I want to learn and contribute\n- Stay professional and human; close with a clear next step\n\nMark in [brackets] anything I should customize per application.`);
                  }}
                  disabled={!intCoverRole.trim() || !intCoverCompany.trim()}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="text" value={intCoverRole} onChange={e => setIntCoverRole(e.target.value)} placeholder="Internship role" className={inputCls} />
                    <input type="text" value={intCoverCompany} onChange={e => setIntCoverCompany(e.target.value)} placeholder="Company name" className={inputCls} />
                  </div>
                  <textarea value={intCoverJD} onChange={e => setIntCoverJD(e.target.value)} placeholder="Internship description (optional but recommended)…" rows={2} className={`${textareaCls} mt-1.5`} />
                </InputCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputCard
                    emoji="💬" title="Cold DM That Gets Replies" subtitle="To a recruiter, founder or hiring manager — under 120 words" color="teal"
                    onLaunch={() => {
                      if (!intDmCompany.trim() || !intDmRole.trim()) { alert('Enter company and role'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nWrite a LinkedIn message to a recruiter, founder, or hiring manager at ${intDmCompany} for a ${intDmRole} internship.\n\nRules:\n- Under 120 words, personalized and professional\n- No "I hope this message finds you well" or generic openers\n- Lead with specific interest in ${intDmCompany}\n- Mention one relevant skill and one concrete project from my background\n- End with a clear but respectful call to action\n- Sound like a real person, not a template`);
                    }}
                    disabled={!intDmCompany.trim() || !intDmRole.trim()}
                  >
                    <input type="text" value={intDmCompany} onChange={e => setIntDmCompany(e.target.value)} placeholder="Company name" className={inputCls} />
                    <input type="text" value={intDmRole} onChange={e => setIntDmRole(e.target.value)} placeholder="Internship role" className={`${inputCls} mt-1.5`} />
                  </InputCard>

                  <InputCard
                    emoji="🎤" title="Interview Questions Predictor" subtitle="20 likely questions + answer frameworks + what they want to hear" color="rose"
                    onLaunch={() => {
                      if (!intInterviewRole.trim() || !intInterviewCompany.trim()) { alert('Enter role and company'); return; }
                      launch(`Here is my resume:\n\n${resumeText}\n\n---\nI am applying for a ${intInterviewRole} internship at ${intInterviewCompany}. Predict the 20 most likely interview questions based on this role and company (mix of behavioural, technical and situational).\n\nFor each question give me:\n1. A strong answer framework (STAR where it fits), anchored to my actual resume\n2. The key points the interviewer actually wants to hear\n\nBe specific to ${intInterviewCompany} where you can — not generic advice.`);
                    }}
                    disabled={!intInterviewRole.trim() || !intInterviewCompany.trim()}
                  >
                    <input type="text" value={intInterviewRole} onChange={e => setIntInterviewRole(e.target.value)} placeholder="Internship role" className={inputCls} />
                    <input type="text" value={intInterviewCompany} onChange={e => setIntInterviewCompany(e.target.value)} placeholder="Company name" className={`${inputCls} mt-1.5`} />
                  </InputCard>
                </div>

                <InputCard
                  emoji="📋" title="Application Tracker & Strategy" subtitle="Status tracker, follow-up schedule, networking log, prep checklist, weekly dashboard" color="amber"
                  onLaunch={() => {
                    launch(`Here is my resume:\n\n${resumeText}\n\n---\nDesign a complete internship application tracking system I can rebuild in Google Sheets or Notion${intTrackerRole ? ` for ${intTrackerRole} internships` : ''}. Give me the exact structure for each part:\n1. Application status tracker — list every column header (company, role, link, date applied, status, contact, next action, notes) and the status values to use\n2. Follow-up schedule — the rule for when to follow up after applying and after interviews\n3. Networking tracker — columns to log contacts, touchpoints and outcomes\n4. Interview preparation checklist — the repeatable steps before each interview\n5. Weekly progress dashboard — the metrics to track (applications, responses, interviews, conversion %) and simple formulas where useful\n\nInclude one filled-in example row per table. Optimize the whole system to maximize interview conversion and keep me organized.`);
                  }}
                >
                  <input type="text" value={intTrackerRole} onChange={e => setIntTrackerRole(e.target.value)} placeholder="Internship focus (e.g. Product) — optional" className={inputCls} />
                </InputCard>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoachView;
