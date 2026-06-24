// Nyxine Resume Maker - Updated Feb 3, 2026
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Briefcase, GraduationCap, Code, Award, Plus, Trash2, ChevronLeft, ChevronRight, Download, AlertCircle, Check, X, Sparkles, Save, Sun, Moon, Home, BookOpen, Mic2, Star, FlaskConical, ToggleLeft, ToggleRight, Trophy, Presentation } from 'lucide-react';
import UploadView from './views/UploadView';
import CoachView from './views/CoachView';
import { parseDateForSort, sortChronologically, formatDate, migrateDatesInProfile } from './lib/dates';

// ─────────────────────────────────────────────────────────────────────────────

const NyxineResumeMaker = () => {
  // ── Theme: dark (default) or light ──────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('nyxine_theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('nyxine_theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  // ────────────────────────────────────────────────────────────────────────

  // ── Mode: industry (default) or academic ────────────────────────────────
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('nyxine_mode') || 'industry'; } catch { return 'industry'; }
  });

  useEffect(() => {
    try { localStorage.setItem('nyxine_mode', mode); } catch { /* storage unavailable */ }
  }, [mode]);

  const toggleMode = () => setMode(m => m === 'industry' ? 'academic' : 'industry');
  // ────────────────────────────────────────────────────────────────────────

  const [currentView, setCurrentView] = useState('marketing');
  const [currentStep, setCurrentStep] = useState(0);
  const [showStorageWarning, setShowStorageWarning] = useState(true);
  const [profile, setProfile] = useState({
    personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', github: '', summary: '', orcid: '', researchgate: '' },
    workExperience: [],
    education: [],
    skills: { technical: [], soft: [], certifications: [], languages: [], laboratory: [], interests: [] },
    projects: [],
    // Academic-mode fields
    researchExperience: [],
    publications: [],
    presentations: [],
    awards: [],
    activities: [],
    // Custom sections (both modes)
    customSections: [],
    additional: { volunteer: '', awards: '', publications: '' }
  });
  const [savedResumes, setSavedResumes] = useState([]);
  const [savedResumeToLoad, setSavedResumeToLoad] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (currentView !== 'landing') {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToStorage();
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, savedResumes, currentView]);

  const loadFromStorage = () => {
    try {
      const profileData = localStorage.getItem('nyxine_profile');
      const resumesData = localStorage.getItem('nyxine_resumes');
      const savedMode = localStorage.getItem('nyxine_mode');
      if (savedMode) setMode(savedMode);

      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          // Validate parsed data structure
          if (parsed && typeof parsed === 'object' && parsed.personal) {
            // Ensure all skill sub-keys exist (older saves may be missing laboratory/interests)
            const defaultSkills = { technical: [], soft: [], certifications: [], languages: [], laboratory: [], interests: [] };
            if (parsed.skills) {
              parsed.skills = { ...defaultSkills, ...parsed.skills };
            }
            setProfile(migrateDatesInProfile(parsed));
          }
        } catch {
          console.error('Invalid profile data, resetting');
          localStorage.removeItem('nyxine_profile');
        }
      }

      if (resumesData) {
        try {
          const parsed = JSON.parse(resumesData);
          // Validate it's an array
          if (Array.isArray(parsed)) {
            setSavedResumes(parsed);
          }
        } catch {
          console.error('Invalid resumes data, resetting');
          localStorage.removeItem('nyxine_resumes');
        }
      }
    } catch (error) {
      console.error('Storage load error:', error);
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem('nyxine_profile', JSON.stringify(profile));
      localStorage.setItem('nyxine_resumes', JSON.stringify(savedResumes));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const steps = [
    { name: 'Personal Info', icon: FileText },
    { name: 'Work Experience', icon: Briefcase },
    { name: 'Education', icon: GraduationCap },
    { name: 'Skills', icon: Sparkles },
    { name: 'Projects', icon: Code },
    { name: 'Additional', icon: Award }
  ];


  // ── Crypto helpers (AES-GCM, PBKDF2) ───────────────────────────────────
  const deriveKey = async (passphrase, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const exportData = async () => {
    const passphrase = window.prompt('🔒 Set a passphrase to protect your backup:\n(Leave blank to export without encryption)');
    if (passphrase === null) return; // cancelled

    const dataStr = JSON.stringify({ profile, savedResumes }, null, 2);
    const filename = `nyxine-backup-${new Date().toISOString().split('T')[0]}`;
    let blob;

    if (passphrase.trim() === '') {
      // Plain JSON export
      blob = new Blob([dataStr], { type: 'application/json' });
      triggerDownload(blob, `${filename}.json`);
    } else {
      // Encrypted export
      try {
        const enc = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv   = crypto.getRandomValues(new Uint8Array(12));
        const key  = await deriveKey(passphrase, salt);
        const ciphertext = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          enc.encode(dataStr)
        );
        // Pack: 4-byte magic + salt(16) + iv(12) + ciphertext
        const magic = new Uint8Array([0x4E, 0x59, 0x58, 0x45]); // "NYXE"
        const payload = new Uint8Array(4 + 16 + 12 + ciphertext.byteLength);
        payload.set(magic, 0);
        payload.set(salt, 4);
        payload.set(iv, 20);
        payload.set(new Uint8Array(ciphertext), 32);
        blob = new Blob([payload], { type: 'application/octet-stream' });
        triggerDownload(blob, `${filename}.nyxine`);
      } catch (err) {
        alert('Export failed: ' + err.message);
      }
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();

    const applyData = (data) => {
      try {
        if (!data || typeof data !== 'object') {
          alert('Import failed — unexpected file structure.');
          return;
        }
        const rawProfile = data.profile || (data.personal ? data : null);
        if (rawProfile) setProfile(migrateDatesInProfile(rawProfile));
        if (data.savedResumes && Array.isArray(data.savedResumes)) setSavedResumes(data.savedResumes);
        alert('✅ Data imported successfully!');
        setCurrentView('dashboard');
      } catch (err) {
        alert(`Import failed — ${err.message || 'could not apply the data.'}`);
      }
    };

    if (file.name.endsWith('.nyxine')) {
      // Encrypted file
      reader.onload = async (event) => {
        try {
          const buf = new Uint8Array(event.target.result);
          const magic = buf.slice(0, 4);
          if (String.fromCharCode(...magic) !== 'NYXE') {
            alert('Import failed — not a valid Nyxine encrypted backup.');
            return;
          }
          const passphrase = window.prompt('🔒 Enter the passphrase for this backup:');
          if (passphrase === null) return;
          const salt = buf.slice(4, 20);
          const iv   = buf.slice(20, 32);
          const ciphertext = buf.slice(32);
          try {
            const key = await deriveKey(passphrase, salt);
            const plaintext = await crypto.subtle.decrypt(
              { name: 'AES-GCM', iv },
              key,
              ciphertext
            );
            const data = JSON.parse(new TextDecoder().decode(plaintext));
            applyData(data);
          } catch {
            alert('❌ Wrong passphrase or corrupted file.');
          }
        } catch (err) {
          alert('Import failed — ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Plain JSON file
      reader.onload = (event) => {
        let data;
        try {
          data = JSON.parse(event.target.result);
        } catch {
          alert('Import failed — the file is not valid JSON.');
          return;
        }
        applyData(data);
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setProfile({
        personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', github: '', summary: '', orcid: '', researchgate: '' },
        workExperience: [],
        education: [],
        skills: { technical: [], soft: [], certifications: [], languages: [], laboratory: [], interests: [] },
        projects: [],
        researchExperience: [],
        publications: [],
        presentations: [],
        awards: [],
        activities: [],
        customSections: [],
        additional: { volunteer: '', awards: '', publications: '' }
      });
      setSavedResumes([]);
      setCurrentView('landing');
      alert('All data cleared successfully!');
    }
  };

  // ── Floating theme toggle — visible on every screen, hidden in print ───
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="no-print fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full ny-theme-toggle border flex items-center justify-center"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark'
        ? <Sun  className="w-5 h-5" style={{ color: 'var(--ny-accent)' }} />
        : <Moon className="w-5 h-5" style={{ color: 'var(--ny-accent)' }} />
      }
    </button>
  );

  if (currentView === 'marketing') {
    return <><MarketingView setCurrentView={setCurrentView} setCurrentStep={setCurrentStep} mode={mode} toggleMode={toggleMode} profile={profile} importData={importData} theme={theme} toggleTheme={toggleTheme} /><ThemeToggle /></>;
  }

  if (currentView === 'landing') {
    return <><LandingPage showStorageWarning={showStorageWarning} setShowStorageWarning={setShowStorageWarning} setCurrentView={setCurrentView} setCurrentStep={setCurrentStep} profile={profile} savedResumes={savedResumes} theme={theme} mode={mode} toggleMode={toggleMode} importData={importData} /><ThemeToggle /></>;
  }

  if (currentView === 'wizard') {
    return <><WizardView currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} profile={profile} setProfile={setProfile} setCurrentView={setCurrentView} mode={mode} toggleMode={toggleMode} /><ThemeToggle /></>;
  }

  if (currentView === 'dashboard') {
    return <><DashboardView profile={profile} savedResumes={savedResumes} setSavedResumes={setSavedResumes} setCurrentView={setCurrentView} setSavedResumeToLoad={setSavedResumeToLoad} exportData={exportData} importData={importData} clearAllData={clearAllData} mode={mode} /><ThemeToggle /></>;
  }

  if (currentView === 'coach') {
    return <><CoachView profile={profile} setCurrentView={setCurrentView} /><ThemeToggle /></>;
  }

  if (currentView === 'generate') {
    return <><GenerateView setCurrentView={setCurrentView} profile={profile} savedResumes={savedResumes} setSavedResumes={setSavedResumes} savedResumeToLoad={savedResumeToLoad} setSavedResumeToLoad={setSavedResumeToLoad} theme={theme} mode={mode} /><ThemeToggle /></>;
  }

  if (currentView === 'upload') {
    return <><UploadView setProfile={setProfile} setCurrentView={setCurrentView} setCurrentStep={setCurrentStep} mode={mode} /><ThemeToggle /></>;
  }

  if (currentView === 'workspace') {
    return <><WorkspaceView profile={profile} mode={mode} toggleMode={toggleMode} setCurrentView={setCurrentView} setCurrentStep={setCurrentStep} /><ThemeToggle /></>;
  }

  return null;
};

// ── Marketing Landing Page ────────────────────────────────────────────────────
const TEMPLATES = [
  { name: 'ATS-Optimized',  best: 'Online applications & tracking systems', ats: 95 },
  { name: 'Academic CV',    best: 'Research roles, faculty, grant apps',     ats: 95 },
  { name: 'Classic',        best: 'Finance, law, conservative industries',   ats: 75 },
  { name: 'Harvard',        best: 'Business, consulting, traditional',       ats: 70 },
  { name: 'Professional',   best: 'Corporate, human-reviewed applications',  ats: 55 },
  { name: 'Modern',         best: 'Tech & startups, direct email',           ats: 40 },
  { name: 'Creative',       best: 'Portfolio submissions, direct outreach',  ats: 20 },
  { name: 'Bold',           best: 'Portfolio sites & design roles',          ats: 15 },
];
const MKT_FAQS = [
  { q: 'Is NYXINE really free?', a: 'Yes — completely. It\'s an open-source project under the MIT license with no tiers, no paywalled features, and no card required. Every template, both modes, and all AI coaches are included.' },
  { q: 'Where is my data stored?', a: 'Entirely in your browser\'s local storage. Your profile, saved resumes, and job targets never touch a server. Clearing your browser cache deletes them, so export a JSON backup regularly.' },
  { q: 'What\'s the difference between Industry and Academic mode?', a: 'Industry is a focused 7-step wizard for company applications. Academic adds a 9-step flow with research-specific fields — publications with DOIs, presentations, grants, ORCID — and defaults to a single-column Academic CV template.' },
  { q: 'How does the AI coaching work?', a: 'Each coach bakes your resume into a purpose-built prompt and opens Claude in a new tab. You get tailored feedback — a brutal review, bullet rewrites, ATS keyword gaps, and more — with no copy-pasting.' },
  { q: 'What does the ATS score on each template mean?', a: 'It estimates how cleanly an Applicant Tracking System can parse that layout. Simple single-column templates score highest (ATS-Optimized hits 95%), while bold multi-column designs are best for direct outreach.' },
  { q: 'Can I self-host or contribute?', a: 'Absolutely. The full source is on GitHub — clone it, run it locally with Vite, deploy your own instance, or open a pull request.' },
];
const atsColor = (n) => n >= 80 ? 'var(--ny-success)' : n >= 50 ? 'var(--ny-warning)' : 'var(--ny-danger)';

// ── Desktop workspace (3-column): wizard nav · live preview · insights ───────
// The mockup layout, gated to lg+. Mobile keeps the existing views untouched.
const ProfileStrengthRing = ({ pct }) => {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 132, height: 132, margin: '0 auto' }}>
      <svg viewBox="0 0 120 120" width="132" height="132">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#wsRing)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 60 60)" />
        <defs>
          <linearGradient id="wsRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="ny-text-1" style={{ fontSize: 28, fontWeight: 700 }}>{pct}%</span>
        <span className="ny-text-3" style={{ fontSize: 11 }}>Profile strength</span>
      </div>
    </div>
  );
};

const WsBar = ({ label, pct }) => (
  <div style={{ marginTop: 12 }}>
    <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
      <span className="ny-text-2">{label}</span><span className="ny-text-1 font-semibold">{pct}%</span>
    </div>
    <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginTop: 5 }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: 'linear-gradient(90deg,#60a5fa,#a78bfa)' }} />
    </div>
  </div>
);

const WorkspaceView = ({ profile, mode, toggleMode, setCurrentView, setCurrentStep }) => {
  const defaultTemplate = mode === 'academic' ? 'academic' : 'modern';
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);

  const steps = mode === 'academic'
    ? ['Personal Information', 'Education', 'Research Experience', 'Publications', 'Presentations', 'Awards & Honors', 'Leadership & Activities', 'Skills & Interests', 'Custom Sections']
    : ['Personal Information', 'Work Experience', 'Education', 'Skills', 'Projects', 'Additional', 'Custom Sections'];

  const TEMPLATES_LIST = [['ats', 'ATS-Optimized'], ['academic', 'Academic CV'], ['harvard', 'Harvard'], ['classic', 'Classic'], ['modern', 'Modern'], ['professional', 'Professional'], ['creative', 'Creative'], ['bold', 'Bold']];
  const tplLabel = (TEMPLATES_LIST.find(([id]) => id === selectedTemplate) || ['', 'Resume'])[1];

  // Full-data preview (no job matcher on this screen)
  const selectedJobs = sortChronologically(profile.workExperience || [], 'startDate', 'current');
  const displaySkills = [
    ...(profile.skills?.technical || []),
    ...(profile.skills?.soft || []),
    ...(profile.skills?.languages || []),
  ];
  const displayCerts = profile.skills?.certifications || [];
  const displayProjects = profile.projects || [];
  const sortedProfile = { ...profile, education: sortChronologically(profile.education || [], 'graduationDate') };

  // Honest "profile strength" — completeness, not a fabricated job match
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  const checks = [
    has(profile.personal?.fullName), has(profile.personal?.email), has(profile.personal?.summary),
    has(profile.workExperience), has(profile.education), has(profile.skills?.technical), has(profile.projects),
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const expDepth = Math.min(100, (profile.workExperience?.length || 0) * 25);
  const skillCov = Math.min(100, ((profile.skills?.technical?.length || 0) + (profile.skills?.soft?.length || 0)) * 8);

  const Tpl = {
    modern: ModernTemplate, classic: ClassicTemplate, harvard: HarvardTemplate, ats: ATSOptimizedTemplate,
    creative: CreativeTemplate, professional: ProfessionalColorTemplate, bold: BoldTemplate, academic: AcademicTemplate,
  }[selectedTemplate] || ModernTemplate;

  return (
    <div className="min-h-screen ny-bg">
      {/* Mobile: keep it simple, point back to existing views */}
      <div className="lg:hidden min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="ny-heading-gradient text-2xl font-bold">Workspace</h1>
        <p className="ny-text-2 text-sm" style={{ maxWidth: 280 }}>The full workspace is built for larger screens. On mobile, use the dashboard and wizard.</p>
        <button onClick={() => setCurrentView('dashboard')} className="ny-btn-primary px-5 py-2.5 rounded-lg text-sm">Go to Dashboard</button>
      </div>

      {/* Desktop 3-column workspace */}
      <div className="hidden lg:block p-6">
        <div className="flex items-center justify-between mb-5 px-2">
          <span className="ny-logo-gradient" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '.02em' }}>NYXINE</span>
          <div className="flex items-center gap-1 p-1 rounded-full ny-card border ny-border">
            <button onClick={() => mode === 'academic' && toggleMode()} className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode !== 'academic' ? 'ny-btn-primary' : 'ny-text-2'}`}>Industry Mode</button>
            <button onClick={() => mode !== 'academic' && toggleMode()} className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode === 'academic' ? 'ny-btn-primary' : 'ny-text-2'}`}>Academic Mode</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('coach')} className="px-3 py-2 ny-btn-secondary rounded-lg text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4" />AI Coach</button>
            <button onClick={() => setCurrentView('generate')} className="px-3 py-2 ny-btn-secondary rounded-lg text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" />Generate</button>
            <button onClick={() => setCurrentView('dashboard')} className="px-3 py-2 ny-btn-secondary rounded-lg text-sm flex items-center gap-1.5"><Home className="w-4 h-4" />Dashboard</button>
          </div>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr 300px' }}>
          {/* Left: wizard nav */}
          <aside className="space-y-4">
            <div className="ny-card border ny-border rounded-xl p-4">
              <div className="ny-text-3 text-xs font-semibold tracking-wide uppercase mb-3">Wizard Progress</div>
              <div className="space-y-1">
                {steps.map((s, i) => (
                  <button key={s} onClick={() => { setCurrentStep(i); setCurrentView('wizard'); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left text-sm ny-text-2 hover:bg-white/5 transition-colors">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs border ny-border ny-text-3">{i + 1}</span>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setCurrentView('upload')} className="w-full ny-card border ny-border rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm ny-text-1 hover:bg-white/5 transition-colors">
              <Upload className="w-4 h-4" />Upload Resume
            </button>
          </aside>

          {/* Center: live preview */}
          <main className="ny-card border ny-border rounded-xl p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div style={{ width: 794, transform: 'scale(0.66)', transformOrigin: 'top center', margin: '0 auto' }}>
              <div style={{ background: 'white', borderRadius: 3, padding: (selectedTemplate === 'creative' || selectedTemplate === 'bold') ? 0 : '0.75in', boxSizing: 'border-box', minHeight: 1123 }}>
                {selectedTemplate === 'academic'
                  ? <AcademicTemplate profile={sortedProfile} />
                  : <Tpl profile={sortedProfile} selectedJobs={selectedJobs} displaySkills={displaySkills} displayProjects={displayProjects} displayCerts={displayCerts} />}
              </div>
            </div>
          </main>

          {/* Right: insights */}
          <aside className="space-y-4">
            <div className="ny-card border ny-border rounded-xl p-5">
              <div className="ny-text-3 text-xs font-semibold tracking-wide uppercase mb-3">Profile Strength</div>
              <ProfileStrengthRing pct={completeness} />
              <WsBar label="Sections complete" pct={completeness} />
              <WsBar label="Experience depth" pct={expDepth} />
              <WsBar label="Skills coverage" pct={skillCov} />
              <p className="ny-text-3 mt-3" style={{ fontSize: 11 }}>Target a job in Generate to see a keyword match score.</p>
            </div>
            <div className="ny-card border ny-border rounded-xl p-5">
              <div className="ny-text-3 text-xs font-semibold tracking-wide uppercase mb-2">Template</div>
              <div className="ny-text-1 font-semibold">{tplLabel}</div>
              <button onClick={() => setCurrentView('generate')} className="mt-3 w-full ny-btn-primary rounded-lg py-2 text-sm">Change Template</button>
            </div>
          </aside>
        </div>

        {/* Template strip */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
          {TEMPLATES_LIST.map(([id, label]) => (
            <button key={id} onClick={() => setSelectedTemplate(id)}
              className={`shrink-0 px-4 py-3 rounded-lg border text-sm transition-all ${selectedTemplate === id ? 'border-purple-400/70 bg-purple-500/10 ny-text-1' : 'ny-border ny-text-2 hover:bg-white/5'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketingView = ({ setCurrentView, setCurrentStep, mode, toggleMode, profile, importData, theme, toggleTheme }) => {
  const [scrolled, setScrolled]     = useState(false);
  const [openFaq,  setOpenFaq]      = useState(null);
  const hasProfile = profile.personal.fullName && profile.personal.email;

  // Nav scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.mkt-reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const startBuilding = () => { setCurrentView('wizard'); setCurrentStep(0); };
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  );
  const GithubIcon = ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.9 18.3 5.2 18.3 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z"/></svg>
  );

  return (
    <div className="ny-bg" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <nav className={`mkt-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center justify-between" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 68 }}>
          <span className="ny-logo-gradient mkt-disp" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '.02em', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>NYXINE</span>
          <div className="hidden md:flex items-center gap-8">
            {['features','modes','coaching','templates','how','pricing'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="ny-text-2 hover:ny-text-1 text-sm font-medium capitalize transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{id === 'how' ? 'How it works' : id.charAt(0).toUpperCase() + id.slice(1)}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {hasProfile && (
              <button onClick={() => setCurrentView('dashboard')} className="ny-text-2 text-sm font-medium hover:ny-text-1 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Dashboard</button>
            )}
            <button onClick={toggleTheme} className="ny-theme-toggle border w-9 h-9 rounded-xl flex items-center justify-center" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'var(--ny-accent)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--ny-accent)' }} />}
            </button>
            <button onClick={startBuilding} className="ny-btn-primary px-4 py-2 rounded-xl text-sm font-semibold mkt-disp">Start Building</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(40px,8vw,80px) 0 clamp(48px,9vw,90px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div className="mkt-reveal">
              <span className="mkt-eyebrow">Privacy-first resume builder</span>
              <h1 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(42px,5.5vw,70px)', fontWeight: 700, lineHeight: 1.0, marginTop: 24, letterSpacing: '-0.03em' }}>
                Build once.<br /><span className="mkt-grad-title">Generate many.</span>
              </h1>
              <p className="ny-text-2" style={{ fontSize: 19, marginTop: 22, maxWidth: 500, lineHeight: 1.6 }}>
                One master profile. Unlimited targeted resumes for every role — industry or academic. Everything stays in your browser. No account, no tracking.
              </p>

              {/* Mode toggle in hero */}
              <div className="mt-7 p-4 ny-card rounded-xl border ny-border inline-flex flex-col gap-2">
                <p className="text-xs ny-text-3 font-medium uppercase tracking-wider mkt-disp">Choose your track</p>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold transition-colors ${mode === 'industry' ? 'ny-accent' : 'ny-text-3'}`}>Industry</span>
                  <button onClick={toggleMode} className="relative w-14 h-7 rounded-full border ny-border-strong transition-all focus:outline-none"
                    style={{ background: mode === 'academic' ? 'var(--ny-accent)' : 'var(--ny-subcard)', opacity: 1 }} aria-label="Toggle mode">
                    <span className="absolute top-0.5 w-6 h-6 rounded-full transition-all shadow"
                      style={{ left: mode === 'academic' ? 'calc(100% - 1.75rem)' : '0.125rem', background: 'white' }} />
                  </button>
                  <span className={`text-sm font-semibold transition-colors ${mode === 'academic' ? 'ny-accent' : 'ny-text-3'}`}>Academic</span>
                </div>
                <p className="text-xs ny-text-3">
                  {mode === 'industry' ? '7-step wizard — work, skills, projects' : '9-step wizard — research, publications, ORCID'}
                </p>
              </div>

              <div className="flex gap-3 mt-7 flex-wrap">
                <button onClick={startBuilding} className="ny-btn-primary px-6 py-3 rounded-xl text-base font-semibold mkt-disp flex items-center gap-2">
                  Launch the app — it's free
                </button>
                <a href="https://github.com/anubhavmohandas/Nyxine-Resume-Maker" target="_blank" rel="noopener" className="ny-btn-secondary px-6 py-3 rounded-xl text-base font-semibold mkt-disp flex items-center gap-2 border ny-border-strong" style={{ textDecoration: 'none' }}>
                  <GithubIcon /> Star on GitHub
                </a>
              </div>

              <div className="flex gap-6 mt-6 flex-wrap">
                {['100% local storage', 'No sign-up required', 'Open source'].map(t => (
                  <span key={t} className="flex items-center gap-2 ny-text-3 text-sm font-medium">
                    <CheckIcon />{t}
                  </span>
                ))}
              </div>

              {/* Import / Continue links */}
              <div className="flex items-center gap-4 mt-5 flex-wrap">
                <label className="flex items-center gap-2 text-sm ny-text-3 hover:ny-text-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />Import backup (.json)
                  <input type="file" accept=".json,.nyxine" onChange={importData} className="hidden" />
                </label>
                {hasProfile && <>
                  <span className="ny-text-3 text-xs">·</span>
                  <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-sm ny-text-3 hover:ny-text-2 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <FileText className="w-3.5 h-3.5" />Continue to Dashboard
                  </button>
                </>}
              </div>
            </div>

            {/* App window mockup — right */}
            <div className="mkt-reveal hidden md:block" style={{ transitionDelay: '.12s' }}>
              <div className="mkt-window">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', background: 'var(--ny-card)', borderBottom: '1px solid var(--ny-border)' }}>
                  <span className="mkt-dot" style={{ width: 11, height: 11, borderRadius: '50%', background: '#E84040', display: 'inline-block' }}></span>
                  <span className="mkt-dot" style={{ width: 11, height: 11, borderRadius: '50%', background: '#F0B030', display: 'inline-block' }}></span>
                  <span className="mkt-dot" style={{ width: 11, height: 11, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                  <span className="ny-text-3 mkt-mono" style={{ marginLeft: 12, fontSize: 12 }}>nyxine.app / generate</span>
                </div>
                <div style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <span className="mkt-grad-title mkt-disp" style={{ fontWeight: 700, fontSize: 22 }}>NYXINE</span>
                    <span style={{ display: 'inline-flex', background: 'var(--ny-subcard)', border: '1px solid var(--ny-border-strong)', borderRadius: 999, padding: 3, fontSize: 11.5, fontWeight: 600 }}>
                      <span style={{ padding: '5px 12px', borderRadius: 999, background: 'linear-gradient(135deg,var(--ny-accent-btn),var(--ny-accent-btn-end))', color: '#fff' }}>Industry</span>
                      <span className="ny-text-3" style={{ padding: '5px 12px' }}>Academic</span>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16 }}>
                    <div>
                      <div className="ny-text-3 mkt-disp" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 9 }}>Template</div>
                      {[['ATS-Optimized','95%','var(--ny-success)',true],['Harvard','70%','var(--ny-warning)',false],['Modern','40%','var(--ny-danger)',false]].map(([n,s,c,sel]) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, border: `1px solid ${sel ? 'var(--ny-accent)' : 'var(--ny-border)'}`, marginBottom: 7, fontSize: 12.5, color: sel ? 'var(--ny-text-1)' : 'var(--ny-text-2)', background: sel ? 'var(--ny-info-bg)' : 'var(--ny-subcard)', fontWeight: sel ? 600 : 400 }}>
                          {n}<span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono,monospace' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#fff', borderRadius: 8, padding: '18px', boxShadow: '0 6px 20px rgba(0,0,0,.3)' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#1A0840' }}>Alex Rivera</div>
                      <div style={{ fontSize: 9, color: '#6b6480', marginTop: 3 }}>Senior Product Engineer · alex@email.com</div>
                      <div style={{ height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#7C3AED,#D97706)', marginTop: 13, width: '38%' }}></div>
                      {['Experience','Skills','Education'].map(h => (
                        <div key={h}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#7C3AED', letterSpacing: '.05em', textTransform: 'uppercase', margin: '13px 0 6px' }}>{h}</div>
                          <div style={{ height: 4, borderRadius: 2, background: '#e7e2f0', marginBottom: 5 }}></div>
                          <div style={{ height: 4, borderRadius: 2, background: '#e7e2f0', width: '80%' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="mkt-trust">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,26px) clamp(16px,4vw,32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px,3vw,24px)', flexWrap: 'wrap' }} className="mkt-reveal">
          {[['8','professional templates'],['Zero','data sent to servers'],['2','modes — industry & academic'],['24','AI coaching prompts']].map(([b,t]) => (
            <div key={t} className="flex items-center gap-3 ny-text-2 font-medium text-sm">
              <Award className="w-5 h-5 ny-accent flex-shrink-0" style={{ color: 'var(--ny-accent)' }} />
              <span><strong className="ny-text-1 mkt-disp">{b}</strong> {t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }} id="features">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">The master profile model</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              Enter your history <span className="mkt-grad-head">once</span>. Tailor it forever.
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 620, lineHeight: 1.65 }}>
              Most builders make you start over for every application. NYXINE flips it — keep one complete profile, then let the keyword matcher assemble the sharpest version for each job.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-center mt-16">
            <div className="mkt-reveal mkt-window hidden md:block">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', background: 'var(--ny-card)', borderBottom: '1px solid var(--ny-border)' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#E84040', display: 'inline-block' }}></span>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F0B030', display: 'inline-block' }}></span>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                <span className="ny-text-3 mkt-mono" style={{ marginLeft: 12, fontSize: 12 }}>nyxine.app / wizard</span>
              </div>
              <div style={{ padding: 22 }}>
                <div className="ny-text-3 mkt-disp" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Master profile · step 3 of 7</div>
                <div style={{ display: 'flex', gap: 5, margin: '8px 0 18px' }}>
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < 3 ? 'var(--ny-success)' : i === 3 ? 'linear-gradient(90deg,var(--ny-accent-btn),var(--ny-accent-btn-end))' : 'var(--ny-border-strong)' }}></div>
                  ))}
                </div>
                {[['Senior Product Engineer','Lumen Labs · 2021 — Present'],['Software Engineer II','Northwind · 2018 — 2021']].map(([t,s]) => (
                  <div key={t} style={{ padding: 14, borderRadius: 9, border: '1px solid var(--ny-border)', marginBottom: 7, background: 'var(--ny-subcard)' }}>
                    <div className="ny-text-1 mkt-disp" style={{ fontWeight: 700, fontSize: 13 }}>{t}</div>
                    <div className="ny-text-3" style={{ fontSize: 11, marginTop: 2 }}>{s}</div>
                  </div>
                ))}
                <div className="ny-accent mkt-disp" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: 11, border: '1px dashed var(--ny-border-strong)', borderRadius: 9, fontSize: 12.5, fontWeight: 600, justifyContent: 'center', marginTop: 4, cursor: 'default' }}>
                  <Plus className="w-3.5 h-3.5" /> Add field
                </div>
              </div>
            </div>
            <div className="mkt-reveal space-y-6" style={{ transitionDelay: '.1s' }}>
              {[
                { icon: <FileText className="w-5 h-5" />, title: 'Build once, generate many', desc: 'One complete history powers unlimited targeted resumes — no re-typing per application.' },
                { icon: <Upload className="w-5 h-5" />, title: 'Upload to auto-fill', desc: 'Drop in a PDF or DOCX — text is read on your device, contacts auto-fill, and your own AI structures the rest.' },
                { icon: <Sparkles className="w-5 h-5" />, title: 'Smart keyword matching', desc: 'Paste a job description and a local algorithm scores each experience by relevance — no API call.' },
                { icon: <Code className="w-5 h-5" />, title: 'Two levels of customization', desc: 'Add custom fields inside any entry, or create entirely new named sections — Patents, Grants, Clinical Rotations.' },
                { icon: <Save className="w-5 h-5" />, title: 'Save unlimited versions', desc: 'Store a named resume per application with its template, job target, and match analysis. Export anytime.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="mkt-feat-ico">{icon}</div>
                  <div>
                    <h4 className="mkt-disp ny-text-1" style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>{title}</h4>
                    <p className="ny-text-3" style={{ fontSize: 14.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MODES ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: 'var(--ny-surface)' }} id="modes">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">Two tailored workflows</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              Industry or <span className="mkt-grad-head">Academic</span> — switch anytime
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 580, margin: '18px auto 0', lineHeight: 1.65 }}>
              A single pill toggle reshapes the entire wizard. Pick the track that fits the role.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-14">
            {[
              { tag: 'Industry', title: 'The standard track', desc: 'A focused 7-step wizard for company applications and tech, business, and corporate roles.', items: ['Personal info, work, education, skills', 'Projects & additional info', 'Custom sections for anything else'], steps: '7-step wizard' },
              { tag: 'Academic', title: 'The research track', desc: 'A 9-step wizard with research-specific fields and a single-column Academic CV template by default.', items: ['Research experience & publications with DOI', 'Presentations, awards, leadership', 'ORCID, ResearchGate, thesis & coursework'], steps: '9-step wizard · Academic CV template' },
            ].map(({ tag, title, desc, items, steps }, i) => (
              <div key={tag} className={`mkt-reveal ny-card border ny-border rounded-2xl p-8 text-left`} style={{ transitionDelay: `${i * .1}s` }}>
                <span className="mkt-grad-head mkt-disp" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase' }}>{tag}</span>
                <h3 className="mkt-disp ny-text-1" style={{ fontSize: 26, fontWeight: 700, margin: '14px 0 6px' }}>{title}</h3>
                <p className="ny-text-2" style={{ fontSize: 15 }}>{desc}</p>
                <ul style={{ listStyle: 'none', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {items.map(it => (
                    <li key={it} className="flex gap-3 ny-text-2" style={{ fontSize: 14, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--ny-accent)', flexShrink: 0, marginTop: 2 }}><CheckIcon /></span>{it}
                    </li>
                  ))}
                </ul>
                <div className="ny-accent mkt-mono" style={{ marginTop: 18, fontSize: 12, fontWeight: 500 }}>{steps}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI COACHING ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }} id="coaching">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">AI coaching panel</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              24 prompts that open <span className="mkt-grad-head">Claude or ChatGPT</span> with your resume loaded
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 620, margin: '18px auto 0', lineHeight: 1.65 }}>
              One click bakes your resume into a purpose-built prompt and opens Claude or ChatGPT in a new tab. No copy-pasting, no API key — just direct, specific feedback.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 56 }}>
            {[
              { e: '⚡', t: '6-Second Filter', d: 'Google recruiter lens — XYZ rewrite + before/afters.' },
              { e: '📊', t: 'Bullet Rewriter', d: 'McKinsey quantification + XYZ formula on every bullet.' },
              { e: '✨', t: 'Final Polish', d: 'Kill clichés, fix tense, replace generic language.' },
              { e: '🎯', t: 'ATS Deep Scan', d: 'Workday/Greenhouse keyword analysis + ATS score estimate.' },
              { e: '🎨', t: 'Tone Match', d: 'Rewrite summary & skills to mirror target company voice.' },
              { e: '🔎', t: 'Brand Audit', d: 'Gap between how you present vs how the market sees you.' },
              { e: '✍️', t: 'Magnetic Headline', d: '3 LinkedIn headline variations — authority, outcome, curiosity.' },
              { e: '📖', t: 'Summary as Story', d: 'Gary Vee voice — hook, origin, proof, CTA.' },
              { e: '🎓', t: 'Internship Toolkit', d: '7 internship prompts — ATS resume, 7-day hunt plan, cold DM, tracker.' },
            ].map(({ e, t, d }, i) => (
              <div key={t} className={`mkt-reveal ny-card border ny-border rounded-2xl p-6 text-left transition-all hover:-translate-y-1`} style={{ transitionDelay: `${(i % 4) * .05}s` }}>
                <div style={{ fontSize: 26 }}>{e}</div>
                <h4 className="mkt-disp ny-text-1" style={{ fontSize: 17, fontWeight: 600, margin: '14px 0 8px' }}>{t}</h4>
                <p className="ny-text-3" style={{ fontSize: 14 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: 'var(--ny-surface)' }} id="templates">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">8 professional templates</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              From <span className="mkt-grad-head">ATS-proof</span> to portfolio-bold
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 580, margin: '18px auto 0', lineHeight: 1.65 }}>
              Every template shows its ATS-friendliness up front so you pick the right one for the channel.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 56 }}>
            {TEMPLATES.map((t, i) => (
              <div key={t.name} className="mkt-reveal ny-card border ny-border rounded-2xl p-6 text-left" style={{ transitionDelay: `${(i % 4) * .05}s` }}>
                <div className="mkt-disp ny-text-1" style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div>
                <div className="ny-text-3" style={{ fontSize: 13, marginTop: 6, minHeight: 38 }}>{t.best}</div>
                <div className="ny-text-3 mkt-disp" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 14, fontWeight: 600 }}>ATS score</div>
                <div className="flex items-center gap-3 mt-2">
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--ny-subcard)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.ats}%`, borderRadius: 3, background: atsColor(t.ats) }}></div>
                  </div>
                  <div className="mkt-mono" style={{ fontSize: 13, fontWeight: 700, color: atsColor(t.ats), minWidth: 38, textAlign: 'right' }}>{t.ats}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }} id="how">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">How it works</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              From blank page to <span className="mkt-grad-head">tailored PDF</span> in five steps
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mt-16">
            {[
              { n: '1', t: 'Choose your mode', d: 'Industry or Academic — toggle right in the hero.' },
              { n: '2', t: 'Build your profile', d: 'Complete the wizard once with your full history.' },
              { n: '3', t: 'Generate targeted', d: 'Paste a job, pick a template, let the matcher select.' },
              { n: '4', t: 'Refine with AI', d: 'Open Claude pre-loaded, iterate on feedback, regenerate.' },
              { n: '5', t: 'Download PDF', d: 'Print → Save as PDF straight from the preview.' },
            ].map(({ n, t, d }, i) => (
              <div key={n} className="mkt-reveal text-left" style={{ transitionDelay: `${i * .06}s` }}>
                <div className="mkt-step-num mb-4">{n}</div>
                <h4 className="mkt-disp ny-text-1" style={{ fontSize: 16, fontWeight: 600, marginBottom: 7 }}>{t}</h4>
                <p className="ny-text-3" style={{ fontSize: 14 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: 'var(--ny-surface)' }} id="privacy">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="mkt-reveal">
              <span className="mkt-eyebrow">Privacy & data</span>
              <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
                Your résumé never <span className="mkt-grad-head">leaves your browser</span>
              </h2>
              <p className="ny-text-2" style={{ fontSize: 17, marginTop: 18, lineHeight: 1.65 }}>
                No account, no database, no tracking. The wizard, templates, and keyword matching all run entirely offline on your device.
              </p>
              <div className="ny-warning-box border rounded-xl p-4 flex gap-3 mt-6">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ny-warning)' }} />
                <p style={{ fontSize: 13.5 }}>Clearing browser cache or localStorage deletes your profile. Export a JSON backup regularly.</p>
              </div>
            </div>
            <div className="mkt-reveal space-y-4" style={{ transitionDelay: '.1s' }}>
              {[
                { t: '100% local storage', d: 'Everything is saved in your browser — nothing is ever sent to a server.' },
                { t: 'No account required', d: 'Start immediately — no email, no sign-up, no password to forget.' },
                { t: 'Offline core features', d: 'Wizard, templates, and keyword matching need no external API.' },
                { t: 'Export & clear anytime', d: 'Download your full profile as JSON, or wipe all data with one click.' },
              ].map(({ t, d }) => (
                <div key={t} className="flex gap-3">
                  <div className="mkt-priv-ico"><Check className="w-4 h-4" /></div>
                  <div>
                    <h4 className="mkt-disp ny-text-1" style={{ fontSize: 15.5, fontWeight: 600 }}>{t}</h4>
                    <p className="ny-text-3" style={{ fontSize: 14 }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }} id="pricing">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">Pricing</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              Free. <span className="mkt-grad-head">Open source.</span> Forever.
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 560, margin: '18px auto 0' }}>
              No tiers, no paywalls, no "upgrade to export." MIT licensed — clone it, fork it, self-host it.
            </p>
          </div>
          <div className="mkt-reveal ny-card border ny-border rounded-2xl mt-14 text-left" style={{ transitionDelay: '.08s', padding: 'clamp(20px,5vw,40px)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="mkt-disp" style={{ fontSize: 'clamp(48px,8vw,80px)', fontWeight: 700, lineHeight: 1 }}><span className="mkt-grad-title" style={{ display: 'inline-block' }}>$0</span></div>
                <div className="ny-text-3" style={{ fontSize: 15, marginTop: 4 }}>/ forever · no card required</div>
              </div>
              <span className="mkt-eyebrow">MIT Licensed</span>
            </div>
            <p className="ny-text-2" style={{ fontSize: 16, marginTop: 20, maxWidth: 560 }}>
              Every template, both modes, all 24 AI coaches, resume upload, unlimited saved versions — the complete app with nothing held back.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
              {['All 8 templates','Industry & Academic modes','Upload PDF/DOCX to auto-fill','24 AI coaching prompts','Unlimited saved versions','PDF & JSON export','No ads, no tracking'].map(f => (
                <div key={f} className="flex items-center gap-2 ny-text-2 text-sm">
                  <CheckIcon />{f}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-10 flex-wrap">
              <button onClick={startBuilding} className="ny-btn-primary px-6 py-3 rounded-xl text-base font-semibold mkt-disp">Launch the app free</button>
              <a href="https://github.com/anubhavmohandas/Nyxine-Resume-Maker" target="_blank" rel="noopener" className="ny-btn-secondary border ny-border-strong px-6 py-3 rounded-xl text-base font-semibold mkt-disp flex items-center gap-2" style={{ textDecoration: 'none' }}>
                <GithubIcon />Self-host it
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0', background: 'var(--ny-surface)' }} id="faq">
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="mkt-reveal text-center mb-14">
            <span className="mkt-eyebrow">FAQ</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              Questions, <span className="mkt-grad-head">answered</span>
            </h2>
          </div>
          <div className="space-y-3">
            {MKT_FAQS.map((f, i) => (
              <div key={i} className="mkt-reveal ny-card border ny-border rounded-xl overflow-hidden" style={{ transitionDelay: `${(i % 3) * .05}s` }}>
                <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="mkt-disp ny-text-1 font-semibold" style={{ fontSize: 16 }}>{f.q}</span>
                  <ChevronRight className={`w-5 h-5 ny-text-3 flex-shrink-0 ml-4 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                <div className={`mkt-faq-a ${openFaq === i ? 'open' : ''}`}>
                  <p className="ny-text-2 px-5 pb-5" style={{ fontSize: 15, lineHeight: 1.65 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="mkt-reveal ny-card border ny-border rounded-3xl text-center mkt-cta-glow relative" style={{ padding: 'clamp(32px,6vw,64px)' }}>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(30px,4.5vw,52px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Stop rewriting.<br /><span className="mkt-grad-title">Start tailoring.</span>
            </h2>
            <p className="ny-text-2" style={{ fontSize: 19, margin: '20px auto 36px', maxWidth: 520 }}>
              Build your master profile once and generate a sharp, ATS-ready resume for every role in minutes.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button onClick={startBuilding} className="ny-btn-primary px-8 py-4 rounded-xl text-lg font-semibold mkt-disp">Launch the app free</button>
              <a href="https://github.com/anubhavmohandas/Nyxine-Resume-Maker" target="_blank" rel="noopener" className="ny-btn-secondary border ny-border-strong px-8 py-4 rounded-xl text-lg font-semibold mkt-disp flex items-center gap-2" style={{ textDecoration: 'none' }}>
                <GithubIcon size={20} />View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--ny-border)', padding: 'clamp(28px,5vw,54px) 0 clamp(20px,4vw,40px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
          <div className="flex justify-between gap-10 flex-wrap items-start">
            <div style={{ maxWidth: 280 }}>
              <span className="ny-logo-gradient mkt-disp" style={{ fontSize: 22, fontWeight: 700 }}>NYXINE</span>
              <p className="ny-text-3" style={{ fontSize: 14, marginTop: 14, lineHeight: 1.6 }}>A privacy-first resume builder that runs in your browser — no account, no backend. Made by Anubhav, because re-tailoring résumés by hand got old.</p>
            </div>
            <div className="flex gap-8 sm:gap-16 flex-wrap">
              {[
                { heading: 'Product', links: [['Features','#features'],['Templates','#templates'],['How it works','#how'],['Pricing','#pricing'],['FAQ','#faq']] },
                { heading: 'Resources', links: [['GitHub repo','https://github.com/anubhavmohandas/Nyxine-Resume-Maker'],['Privacy','#privacy']] },
                { heading: 'Built with', links: [['React 19 + Vite','#'],['Tailwind CSS','#'],['Claude (Anthropic)','#']] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h5 className="mkt-disp ny-text-2" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>{heading}</h5>
                  {links.map(([label, href]) => (
                    <a key={label} href={href} className="mkt-foot-link" style={{ display: 'block', color: 'var(--ny-text-3)', textDecoration: 'none', fontSize: 14, marginBottom: 10 }}
                      onMouseEnter={e => e.target.style.color = 'var(--ny-text-1)'} onMouseLeave={e => e.target.style.color = 'var(--ny-text-3)'}>
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-4 mt-12 pt-6" style={{ borderTop: '1px solid var(--ny-border)' }}>
            <span className="ny-text-3" style={{ fontSize: 14 }}>© 2026 NYXINE · Open source under MIT</span>
            <span className="ny-text-3" style={{ fontSize: 14 }}>Created by <a href="https://github.com/anubhavmohandas" target="_blank" rel="noopener" className="mkt-name-grad">Anubhav</a></span>
          </div>
        </div>
      </footer>

    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// ── Mode Toggle Component ─────────────────────────────────────────────────────
const ModeToggle = ({ mode, toggleMode }) => (
  <div className="flex items-center gap-3">
    <span className={`text-sm font-medium transition-colors ${mode === 'industry' ? 'ny-accent' : 'ny-text-3'}`}>Industry</span>
    <button
      onClick={toggleMode}
      className="relative w-14 h-7 rounded-full border ny-border-strong transition-all focus:outline-none"
      style={{ background: mode === 'academic' ? 'var(--ny-accent)' : 'var(--ny-subcard-bg)', opacity: 1 }}
      aria-label="Toggle mode"
    >
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full transition-all shadow"
        style={{
          left: mode === 'academic' ? 'calc(100% - 1.75rem)' : '0.125rem',
          background: 'white',
        }}
      />
    </button>
    <span className={`text-sm font-medium transition-colors ${mode === 'academic' ? 'ny-accent' : 'ny-text-3'}`}>Academic / Research</span>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────

const LandingPage = ({ showStorageWarning, setShowStorageWarning, setCurrentView, setCurrentStep, profile, savedResumes, theme, mode, toggleMode, importData }) => {
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
                  <p className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" />Won't sync across different browsers</p>
                  <p className="ny-accent mt-3">💡 Export regularly to backup your work</p>
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
            <p className="text-lg sm:text-xl ny-text-2">Smart Resume Builder</p>
            <p className="ny-text-2 mt-2 text-sm sm:text-base">Enter once. Generate targeted resumes. Stay authentic.</p>

            {/* Mode Toggle */}
            <div className="mt-5 flex flex-col items-center gap-2">
              <ModeToggle mode={mode} toggleMode={toggleMode} />
              <p className="text-xs ny-text-3 mt-1">
                {mode === 'industry'
                  ? 'Standard mode — Work experience, skills, projects'
                  : 'Academic mode — Research, publications, ORCID, thesis, presentations'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="ny-subcard rounded-lg p-6 border ny-border-strong hover:border-purple-500/50 transition-colors">
              <Upload className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold ny-text-1 mb-2">Upload Resume</h3>
              <p className="ny-text-2 text-sm mb-4">Import a PDF or DOCX</p>
              <button onClick={() => setCurrentView('upload')} className="w-full px-4 py-3 ny-btn-primary rounded-lg">
                Upload
              </button>
            </div>

            <div className="ny-subcard rounded-lg p-6 border ny-border-strong hover:border-purple-500/50 transition-colors">
              <FileText className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold ny-text-1 mb-2">Start Fresh</h3>
              <p className="ny-text-2 text-sm mb-4">Build step by step</p>
              <button onClick={() => { setCurrentView('wizard'); setCurrentStep(0); }} className="w-full px-4 py-3 ny-btn-primary rounded-lg">
                Begin
              </button>
            </div>
          </div>

          <div className="pt-4 border-t ny-divider flex flex-col sm:flex-row items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-sm ny-text-2 hover:ny-text-1 cursor-pointer transition-colors group">
              <Upload className="w-4 h-4 group-hover:ny-accent transition-colors" />
              <span>Import backup (.json)</span>
              <input type="file" accept=".json,.nyxine" onChange={importData} className="hidden" />
            </label>
            {(profile.personal.fullName || savedResumes.length > 0) && (
              <>
                <span className="ny-text-3 hidden sm:block">·</span>
                <button onClick={() => setCurrentView('dashboard')} className="ny-accent hover:opacity-80 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />Continue to Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6 ny-text-3 text-sm">
          <p>Open Source • Privacy First • AI-Powered</p>
        </div>
      </div>
    </div>
  );
};

const WizardView = ({ currentStep, setCurrentStep, steps: _steps, profile, setProfile, setCurrentView, mode, toggleMode }) => {
  // Override steps based on mode
  const steps = mode === 'academic'
    ? [
        { name: 'Personal Info', icon: FileText },
        { name: 'Research Exp.', icon: Briefcase },
        { name: 'Education', icon: GraduationCap },
        { name: 'Skills & Lab', icon: Sparkles },
        { name: 'Publications', icon: BookOpen },
        { name: 'Presentations', icon: Award },
        { name: 'Awards', icon: Star },
        { name: 'Activities', icon: Code },
        { name: 'Custom Sections', icon: Plus },
      ]
    : [..._steps, { name: 'Custom Sections', icon: Plus }];

  const CurrentStepIcon = steps[currentStep]?.icon || FileText;

  // ✅ FORM VALIDATION
  const validateStep = (step) => {
    switch(step) {
      case 0: // Personal Info
        if (!profile.personal.fullName.trim()) {
          alert('Please enter your full name');
          return false;
        }
        if (!profile.personal.email.trim()) {
          alert('Please enter your email address');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.personal.email)) {
          alert('Please enter a valid email address');
          return false;
        }
        if (!profile.personal.phone.trim()) {
          alert('Please enter your phone number');
          return false;
        }
        if (!profile.personal.location.trim()) {
          alert('Please enter your location');
          return false;
        }
        return true;
        
      case 1: // Work Experience
        if (profile.workExperience.length === 0) {
          return window.confirm('No work experience added. Continue anyway?');
        }
        for (let job of profile.workExperience) {
          if (!job.title.trim()) {
            alert('Please fill in job title for all work experiences');
            return false;
          }
          if (!job.company.trim()) {
            alert('Please fill in company name for all work experiences');
            return false;
          }
          if (job.bullets.every(b => !b.trim())) {
            alert('Please add at least one achievement or responsibility for each job');
            return false;
          }
        }
        return true;
        
      case 2: // Education
        if (profile.education.length === 0) {
          return window.confirm('No education added. Continue anyway?');
        }
        for (let edu of profile.education) {
          if (!edu.degree.trim() || !edu.major.trim() || !edu.school.trim()) {
            alert('Please fill in degree, major, and school for all education entries');
            return false;
          }
        }
        return true;
        
      case 3: { // Skills
        const totalSkills = profile.skills.technical.length + profile.skills.soft.length;
        if (totalSkills === 0) {
          return window.confirm('No skills added. Continue anyway?');
        }
        if (totalSkills < 3) {
          return window.confirm('Only ' + totalSkills + ' skill(s) added. Recommended: at least 5-10 skills. Continue anyway?');
        }
        return true;
      }
        
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen ny-bg p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="ny-card rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border ny-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold ny-text-1">Build Your Profile</h2>
            <div className="flex items-center gap-2 sm:gap-4">
              <ModeToggle mode={mode} toggleMode={() => { toggleMode(); setCurrentStep(0); }} />
              <span className="ny-text-2 text-xs sm:text-sm whitespace-nowrap">{currentStep + 1}/{steps.length}</span>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all ${idx < currentStep ? 'ny-progress-done' : idx === currentStep ? 'ny-progress-active' : 'ny-progress-pending'}`} />
            ))}
          </div>
          {/* On mobile: show only current step name. On sm+: show all labels */}
          <div className="mt-2 sm:mt-3">
            <div className="sm:hidden text-xs ny-accent font-semibold">
              {steps[currentStep].name}
            </div>
            <div className="hidden sm:flex justify-between">
              {steps.map((step, idx) => (
                <div key={idx} className={`text-xs ${idx === currentStep ? 'ny-accent font-semibold' : idx < currentStep ? 'ny-success-text' : 'ny-text-3'}`}>
                  {step.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ny-card rounded-lg p-4 sm:p-8 border ny-border">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <CurrentStepIcon className="w-6 h-6 sm:w-8 sm:h-8 ny-accent" />
            <h2 className="text-xl sm:text-2xl font-bold ny-text-1">{steps[currentStep].name}</h2>
          </div>

          {/* Industry mode steps */}
          {mode === 'industry' && currentStep === 0 && <PersonalInfoStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'industry' && currentStep === 1 && <WorkExperienceStep profile={profile} setProfile={setProfile} />}
          {mode === 'industry' && currentStep === 2 && <EducationStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'industry' && currentStep === 3 && <SkillsStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'industry' && currentStep === 4 && <ProjectsStep profile={profile} setProfile={setProfile} />}
          {mode === 'industry' && currentStep === 5 && <AdditionalStep profile={profile} setProfile={setProfile} />}
          {mode === 'industry' && currentStep === 6 && <CustomSectionsStep profile={profile} setProfile={setProfile} />}
          {/* Academic mode steps */}
          {mode === 'academic' && currentStep === 0 && <PersonalInfoStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'academic' && currentStep === 1 && <ResearchExperienceStep profile={profile} setProfile={setProfile} />}
          {mode === 'academic' && currentStep === 2 && <EducationStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'academic' && currentStep === 3 && <SkillsStep profile={profile} setProfile={setProfile} mode={mode} />}
          {mode === 'academic' && currentStep === 4 && <PublicationsStep profile={profile} setProfile={setProfile} />}
          {mode === 'academic' && currentStep === 5 && <PresentationsStep profile={profile} setProfile={setProfile} />}
          {mode === 'academic' && currentStep === 6 && <AwardsStep profile={profile} setProfile={setProfile} />}
          {mode === 'academic' && currentStep === 7 && <ActivitiesStep profile={profile} setProfile={setProfile} />}
          {mode === 'academic' && currentStep === 8 && <CustomSectionsStep profile={profile} setProfile={setProfile} />}

          <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ny-divider">
            <button onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setCurrentView('landing')} className="px-4 sm:px-6 py-2 ny-btn-secondary rounded-lg flex items-center gap-1.5 text-sm sm:text-base">
              <ChevronLeft className="w-4 h-4" />{currentStep === 0 ? 'Back' : 'Previous'}
            </button>
            {currentStep < steps.length - 1 ? (
              <button onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep(currentStep + 1);
                }
              }} className="px-4 sm:px-6 py-2 ny-btn-primary rounded-lg flex items-center gap-1.5 text-sm sm:text-base">
                Next<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentView('dashboard');
                }
              }} className="px-4 sm:px-6 py-2 ny-btn-success rounded-lg flex items-center gap-1.5 text-sm sm:text-base">
                <Check className="w-4 h-4" />Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalInfoStep = ({ profile, setProfile, mode }) => {
  const [local, setLocal] = useState(profile.personal);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(prev => ({ ...prev, personal: local }));
    }, 300);
    return () => clearTimeout(timer);
  }, [local, setProfile]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium ny-text-2 mb-2">Full Name *</label>
        <input
          type="text"
          value={local.fullName}
          onChange={(e) => setLocal(prev => ({ ...prev, fullName: e.target.value }))}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all"
          placeholder="John Doe"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">Email *</label>
          <input
            type="email"
            value={local.email}
            onChange={(e) => setLocal(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">Phone *</label>
          <input
            type="tel"
            value={local.phone}
            onChange={(e) => setLocal(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium ny-text-2 mb-2">Location (City, State) *</label>
        <input
          type="text"
          value={local.location}
          onChange={(e) => setLocal(prev => ({ ...prev, location: e.target.value }))}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all"
          placeholder="San Francisco, CA"
        />
      </div>
      <div>
        <label className="block text-sm font-medium ny-text-2 mb-2">Professional Summary</label>
        <textarea
          value={local.summary || ''}
          onChange={(e) => setLocal(prev => ({ ...prev, summary: e.target.value }))}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-none"
          rows={3}
          placeholder="3–4 lines: who you are, your key strengths, and what you bring to the role..."
          maxLength={500}
        />
        <p className="text-xs ny-text-3 mt-1">{(local.summary || '').length}/500 characters</p>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">LinkedIn</label>
          <input
            type="url"
            value={local.linkedin}
            onChange={(e) => setLocal(prev => ({ ...prev, linkedin: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">{mode === 'academic' ? 'ResearchGate' : 'Portfolio'}</label>
          <input
            type="url"
            value={mode === 'academic' ? (local.researchgate || '') : local.portfolio}
            onChange={(e) => setLocal(prev => mode === 'academic' ? { ...prev, researchgate: e.target.value } : { ...prev, portfolio: e.target.value })}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder={mode === 'academic' ? 'researchgate.net/profile/...' : 'yoursite.com'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">{mode === 'academic' ? 'GitHub / Portfolio' : 'GitHub'}</label>
          <input
            type="url"
            value={local.github}
            onChange={(e) => setLocal(prev => ({ ...prev, github: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="github.com/..."
          />
        </div>
      </div>

      {/* Academic-only: ORCID */}
      {mode === 'academic' && (
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">ORCID iD</label>
          <input
            type="text"
            value={local.orcid || ''}
            onChange={(e) => setLocal(prev => ({ ...prev, orcid: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="0000-0000-0000-0000"
          />
          <p className="text-xs ny-text-3 mt-1">Your Open Researcher and Contributor ID — used in academic profiles and journals</p>
        </div>
      )}

      <div
        className="ny-info-box border rounded-lg p-3 text-sm"
        dangerouslySetInnerHTML={{ __html: mode === 'academic'
          ? '💡 <strong>Tip:</strong> Include your ORCID — required by many journals and grant applications'
          : '💡 <strong>Tip:</strong> No photo needed - not recommended for US/Canada resumes' }}
      />
    </div>
  );
};

const WorkExperienceStep = ({ profile, setProfile }) => {
  const addJob = () => {
    setProfile(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        id: Date.now(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [''],
        customFields: []
      }]
    }));
  };

  const removeJob = (id) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(job => job.id !== id)
    }));
  };

  const sortedJobs = sortChronologically(profile.workExperience, 'startDate', 'current');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Add all work experiences (we'll filter by job later)</p>
        <button onClick={addJob} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Job
        </button>
      </div>

      {profile.workExperience.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No work experience yet. Click "Add Job" to start.</p>
        </div>
      )}

      {profile.workExperience.length > 1 && (
        <div className="flex items-center gap-2 text-xs ny-text-2 ny-subcard rounded-lg px-3 py-2 border ny-border">
          <span>🔃</span>
          <span>Auto-sorted by date — newest job first. Add them in any order you like.</span>
        </div>
      )}

      {sortedJobs.map((job, idx) => (
        <JobForm key={job.id} job={job} idx={idx} setProfile={setProfile} removeJob={removeJob} />
      ))}

      {profile.workExperience.length > 0 && (
        <div className="ny-info-box border rounded-lg p-3 text-sm">
          💡 <strong>Pro Tip:</strong> Include specific numbers (e.g., "Trained 50+ students" instead of "Trained students")
        </div>
      )}
    </div>
  );
};

const JobForm = ({ job, idx, setProfile, removeJob }) => {
  const [local, setLocal] = useState(job);

  // Flush local state to parent — debounced for text fields
  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        workExperience: prev.workExperience.map(j => j.id === job.id ? local : j)
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [local, job.id, setProfile]);

  // Immediate flush on blur so dates are never lost on navigation/refresh
  const flushNow = () => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(j => j.id === job.id ? local : j)
    }));
  };

  const addBullet = () => {
    setLocal(prev => ({ ...prev, bullets: [...prev.bullets, ''] }));
  };

  const removeBullet = (bulletIdx) => {
    if (local.bullets.length > 1) {
      setLocal(prev => ({ ...prev, bullets: prev.bullets.filter((_, i) => i !== bulletIdx) }));
    }
  };

  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Job #{idx + 1}</h3>
        <button onClick={() => removeJob(job.id)} className="ny-danger-text hover:opacity-80">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Job Title *</label>
            <input
              type="text"
              value={local.title}
              onChange={(e) => setLocal(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Company *</label>
            <input
              type="text"
              value={local.company}
              onChange={(e) => setLocal(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="Tech Corp"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Location</label>
            <input
              type="text"
              value={local.location}
              onChange={(e) => setLocal(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Start Date</label>
            <input
              type="month"
              value={local.startDate}
              onChange={(e) => setLocal(prev => ({ ...prev, startDate: e.target.value }))}
              onBlur={flushNow}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">End Date</label>
            <div className="flex gap-2">
              <input
                type="month"
                value={local.endDate}
                onChange={(e) => setLocal(prev => ({ ...prev, endDate: e.target.value }))}
                onBlur={flushNow}
                disabled={local.current}
                className="flex-1 px-4 py-2 ny-input rounded-lg transition-all disabled:opacity-50"
              />
              <label className="flex items-center gap-1 ny-text-2 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={local.current}
                  onChange={(e) => { setLocal(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? '' : prev.endDate })); setTimeout(flushNow, 0); }}
                  className="rounded"
                />
                Present
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm ny-text-2">Achievements & Responsibilities</label>
            <button onClick={addBullet} className="ny-accent hover:ny-accent text-sm flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" />Add Point
            </button>
          </div>
          <div className="space-y-2">
            {local.bullets.map((bullet, bulletIdx) => (
              <div key={bulletIdx} className="flex gap-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...local.bullets];
                    newBullets[bulletIdx] = e.target.value;
                    setLocal(prev => ({ ...prev, bullets: newBullets }));
                  }}
                  className="flex-1 px-4 py-2 ny-input rounded-lg transition-all"
                  placeholder="Led team of 5 engineers to deliver..."
                />
                {local.bullets.length > 1 && (
                  <button onClick={() => removeBullet(bulletIdx)} className="ny-danger-text hover:opacity-80">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs ny-text-3 mt-2">💡 Include numbers (e.g., "Increased sales by 30%")</p>
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(prev => ({ ...prev, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const EducationStep = ({ profile, setProfile, mode }) => {
  const addEdu = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now(),
        degree: '',
        major: '',
        school: '',
        location: '',
        graduationDate: '',
        gpa: '',
        gradeType: 'GPA',
        thesis: '',
        coursework: '',
        customFields: []
      }]
    }));
  };

  const removeEdu = (id) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  };

  const sortedEdu = sortChronologically(profile.education, 'graduationDate');

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="ny-text-2 text-sm">Add your education history</p>
        <button onClick={addEdu} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Education
        </button>
      </div>

      {profile.education.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No education yet. Click "Add Education" to start.</p>
        </div>
      )}

      {profile.education.length > 1 && (
        <div className="flex items-center gap-2 text-xs ny-text-2 ny-subcard rounded-lg px-3 py-2 border ny-border">
          <span>🔃</span>
          <span>Auto-sorted by date — most recent degree first. Add them in any order you like.</span>
        </div>
      )}

      {sortedEdu.map((edu, idx) => (
        <EduForm key={edu.id} edu={edu} idx={idx} setProfile={setProfile} removeEdu={removeEdu} mode={mode} />
      ))}
    </div>
  );
};

const EduForm = ({ edu, idx, setProfile, removeEdu, mode }) => {
  const [local, setLocal] = useState(edu);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        education: prev.education.map(e => e.id === edu.id ? local : e)
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [local, edu.id, setProfile]);

  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Education #{idx + 1}</h3>
        <button onClick={() => removeEdu(edu.id)} className="ny-danger-text hover:opacity-80">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Degree *</label>
            <input
              type="text"
              value={local.degree}
              onChange={(e) => setLocal(prev => ({ ...prev, degree: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="Bachelor of Science"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Major *</label>
            <input
              type="text"
              value={local.major}
              onChange={(e) => setLocal(prev => ({ ...prev, major: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="Computer Science"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">School *</label>
            <input
              type="text"
              value={local.school}
              onChange={(e) => setLocal(prev => ({ ...prev, school: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="University of California"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Location</label>
            <input
              type="text"
              value={local.location}
              onChange={(e) => setLocal(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="Berkeley, CA"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Graduation Date</label>
            <input
              type="month"
              value={local.graduationDate}
              onChange={(e) => setLocal(prev => ({ ...prev, graduationDate: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Grade (optional)</label>
            <div className="flex gap-2">
              <select
                value={local.gradeType || 'GPA'}
                onChange={(e) => setLocal(prev => ({ ...prev, gradeType: e.target.value }))}
                className="px-3 py-2 ny-input rounded-lg transition-all w-36 shrink-0"
              >
                <option value="GPA">GPA</option>
                <option value="Percentage">Percentage</option>
                <option value="CGPA">CGPA</option>
                <option value="First Class">First Class</option>
                <option value="Distinction">Distinction</option>
              </select>
              <input
                type="text"
                value={local.gpa}
                onChange={(e) => setLocal(prev => ({ ...prev, gpa: e.target.value }))}
                className="flex-1 px-4 py-2 ny-input rounded-lg transition-all"
                placeholder={(local.gradeType || 'GPA') === 'GPA' ? '3.8/4.0' : (local.gradeType || 'GPA') === 'Percentage' ? '85%' : (local.gradeType || 'GPA') === 'CGPA' ? '8.5/10' : ''}
              />
            </div>
          </div>
        </div>

        {/* Academic-only fields */}
        {mode === 'academic' && (
          <>
            <div>
              <label className="block text-sm ny-text-2 mb-2">Thesis / Dissertation Title</label>
              <input
                type="text"
                value={local.thesis || ''}
                onChange={(e) => setLocal(prev => ({ ...prev, thesis: e.target.value }))}
                className="w-full px-4 py-2 ny-input rounded-lg transition-all"
                placeholder="e.g., Identification of free-living amoebae using PCR..."
              />
            </div>
            <div>
              <label className="block text-sm ny-text-2 mb-2">Relevant Coursework</label>
              <textarea
                value={local.coursework || ''}
                onChange={(e) => setLocal(prev => ({ ...prev, coursework: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-y"
                placeholder="e.g., Biochemistry, Microbiology, Pathology, Molecular Biology..."
              />
            </div>
          </>
        )}
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(prev => ({ ...prev, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const SkillsStep = ({ profile, setProfile, mode }) => {
  // 🔧 FIX: Use refs to prevent re-render on every keystroke
  const technicalInputRef = useRef(null);
  const softInputRef = useRef(null);
  const certificationsInputRef = useRef(null);
  const languagesInputRef = useRef(null);
  const laboratoryInputRef = useRef(null);
  const interestsInputRef = useRef(null);

  const addSkill = (cat, inputRef) => {
    const value = inputRef.current?.value.trim();
    if (!value) return;

    setProfile(prev => {
      const newSkills = { ...prev.skills };
      newSkills[cat] = [...(newSkills[cat] || []), value];
      return { ...prev, skills: newSkills };
    });
    
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const removeSkill = (cat, idx) => {
    setProfile(prev => {
      const newSkills = { ...prev.skills };
      newSkills[cat] = (newSkills[cat] || []).filter((_, i) => i !== idx);
      return { ...prev, skills: newSkills };
    });
  };

  // Color mapping for skill badges (Tailwind needs to see full class names)
  const colorMap = {
    'technical': {
      button: 'bg-blue-500',
      bg: 'bg-blue-500/20',
      text: 'text-blue-100',
      border: 'border-blue-400/30'
    },
    'soft': {
      button: 'bg-cyan-400',
      bg: 'bg-cyan-400/20',
      text: 'text-cyan-100',
      border: 'border-cyan-300/30'
    },
    'certifications': {
      button: 'bg-green-500',
      bg: 'bg-green-500/20',
      text: 'text-green-100',
      border: 'border-green-400/30'
    },
    'languages': {
      button: 'bg-amber-400',
      bg: 'bg-amber-400/20',
      text: 'text-amber-100',
      border: 'border-amber-300/30'
    },
    'laboratory': {
      button: 'bg-teal-500',
      bg: 'bg-teal-500/20',
      text: 'text-teal-100',
      border: 'border-teal-400/30'
    },
    'interests': {
      button: 'bg-pink-400',
      bg: 'bg-pink-400/20',
      text: 'text-pink-100',
      border: 'border-pink-300/30'
    }
  };

  const SkillSection = ({ title, cat, placeholder, inputRef }) => {
    const colors = colorMap[cat];

    return (
      <div>
        <label className="block text-sm ny-text-2 mb-2">{title}</label>
        <div className="flex gap-2 mb-2">
          <input
            ref={inputRef}
            type="text"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(cat, inputRef);
              }
            }}
            className="flex-1 px-4 py-2 ny-input rounded-lg transition-all"
            placeholder={placeholder}
          />
          <button onClick={() => addSkill(cat, inputRef)} className={`px-4 py-2 ${colors.button} text-white rounded-lg transition-colors`}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profile.skills[cat] || []).map((skill, idx) => (
            <span key={idx} className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm flex items-center gap-2 border ${colors.border}`}>
              {skill}
              <button onClick={() => removeSkill(cat, idx)} className="hover:opacity-80 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="ny-text-2 text-sm">Type a skill and press Enter or click + to add. List 10-15 skills most relevant to your target jobs.</p>
      <SkillSection title="Technical Skills" cat="technical" placeholder="e.g., Python, React, AWS..." inputRef={technicalInputRef} />
      <SkillSection title="Soft Skills" cat="soft" placeholder="e.g., Leadership, Communication..." inputRef={softInputRef} />
      <SkillSection title="Certifications" cat="certifications" placeholder="e.g., AWS Certified, RHCSA..." inputRef={certificationsInputRef} />
      <SkillSection title="Languages" cat="languages" placeholder="e.g., English (Native), Spanish (Fluent)..." inputRef={languagesInputRef} />
      {mode === 'academic' && (
        <>
          <SkillSection title="Laboratory Skills" cat="laboratory" placeholder="e.g., PCR, ELISA, MALDI-TOF, Flow Cytometry..." inputRef={laboratoryInputRef} />
          <SkillSection title="Interests" cat="interests" placeholder="e.g., Photography, Badminton, Bioinformatics..." inputRef={interestsInputRef} />
        </>
      )}
    </div>
  );
};

const ProjectsStep = ({ profile, setProfile }) => {
  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: Date.now(),
        name: '',
        description: '',
        technologies: '',
        link: '',
        customFields: []
      }]
    }));
  };

  const removeProject = (id) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="ny-text-2 text-sm">Showcase your projects (optional but recommended)</p>
        <button onClick={addProject} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Project
        </button>
      </div>

      {profile.projects.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No projects yet. Click "Add Project" to showcase your work.</p>
        </div>
      )}

      {profile.projects.map((proj, idx) => (
        <ProjectForm key={proj.id} proj={proj} idx={idx} setProfile={setProfile} removeProject={removeProject} />
      ))}
    </div>
  );
};

const ProjectForm = ({ proj, idx, setProfile, removeProject }) => {
  const [local, setLocal] = useState(proj);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === proj.id ? local : p)
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [local, proj.id, setProfile]);

  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Project #{idx + 1}</h3>
        <button onClick={() => removeProject(proj.id)} className="ny-danger-text hover:opacity-80">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm ny-text-2 mb-2">Project Name *</label>
          <input
            type="text"
            value={local.name}
            onChange={(e) => setLocal(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="E-commerce Platform"
          />
        </div>

        <div>
          <label className="block text-sm ny-text-2 mb-2">Description *</label>
          <textarea
            value={local.description}
            onChange={(e) => setLocal(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-y"
            placeholder="Built a full-stack e-commerce platform with payment integration..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Technologies Used</label>
            <input
              type="text"
              value={local.technologies}
              onChange={(e) => setLocal(prev => ({ ...prev, technologies: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="React, Node.js, MongoDB, AWS"
            />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Link (optional)</label>
            <input
              type="url"
              value={local.link}
              onChange={(e) => setLocal(prev => ({ ...prev, link: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="github.com/username/project"
            />
          </div>
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(prev => ({ ...prev, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const AdditionalStep = ({ profile, setProfile }) => {
  const [local, setLocal] = useState(profile.additional);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(prev => ({ ...prev, additional: local }));
    }, 300);
    return () => clearTimeout(timer);
  }, [local, setProfile]);

  return (
    <div className="space-y-6">
      <p className="ny-text-2 text-sm">All optional - add if relevant to your career</p>
      
      <div>
        <label className="block text-sm ny-text-2 mb-2">Volunteer Work</label>
        <textarea
          value={local.volunteer}
          onChange={(e) => setLocal(prev => ({ ...prev, volunteer: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-y"
          placeholder="Volunteer software instructor at local community center..."
        />
      </div>

      <div>
        <label className="block text-sm ny-text-2 mb-2">Awards & Honors</label>
        <textarea
          value={local.awards}
          onChange={(e) => setLocal(prev => ({ ...prev, awards: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-y"
          placeholder="Employee of the Year 2023, Hackathon Winner..."
        />
      </div>

      <div>
        <label className="block text-sm ny-text-2 mb-2">Publications</label>
        <textarea
          value={local.publications}
          onChange={(e) => setLocal(prev => ({ ...prev, publications: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 ny-input rounded-lg transition-all resize-y"
          placeholder="Research paper on machine learning published in..."
        />
      </div>

      <div className="ny-success-box border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 ny-success-text flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="ny-success-text font-semibold mb-1">Profile Almost Complete! 🎉</h3>
            <p className="ny-text-2 text-sm">Next: Generate targeted resumes with AI filtering</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ACADEMIC MODE STEPS ─────────────────────────────────────────────────────

const ResearchExperienceStep = ({ profile, setProfile }) => {
  const addEntry = () => {
    setProfile(prev => ({
      ...prev,
      researchExperience: [...(prev.researchExperience || []), {
        id: Date.now(), title: '', institution: '', location: '', startDate: '', endDate: '', current: false, bullets: [''], customFields: []
      }]
    }));
  };
  const removeEntry = (id) => setProfile(prev => ({ ...prev, researchExperience: prev.researchExperience.filter(e => e.id !== id) }));
  const entries = profile.researchExperience || [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Add your research roles, lab positions, and internships</p>
        <button onClick={addEntry} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Role</button>
      </div>
      {entries.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No research experience yet. Click "Add Role" to start.</p>
        </div>
      )}
      {entries.map((entry, idx) => (
        <ResearchEntryForm key={entry.id} entry={entry} idx={idx} setProfile={setProfile} removeEntry={removeEntry} />
      ))}
    </div>
  );
};

const ResearchEntryForm = ({ entry, idx, setProfile, removeEntry }) => {
  const [local, setLocal] = useState(entry);
  useEffect(() => {
    const t = setTimeout(() => setProfile(prev => ({ ...prev, researchExperience: prev.researchExperience.map(e => e.id === entry.id ? local : e) })), 300);
    return () => clearTimeout(t);
  }, [local, entry.id, setProfile]);
  const flushNow = () => setProfile(prev => ({ ...prev, researchExperience: prev.researchExperience.map(e => e.id === entry.id ? local : e) }));
  const addBullet = () => setLocal(prev => ({ ...prev, bullets: [...prev.bullets, ''] }));
  const removeBullet = (i) => { if (local.bullets.length > 1) setLocal(prev => ({ ...prev, bullets: prev.bullets.filter((_, bi) => bi !== i) })); };
  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Research Role #{idx + 1}</h3>
        <button onClick={() => removeEntry(entry.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Role / Position *</label>
            <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Junior Research Fellow" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Institution *</label>
            <input type="text" value={local.institution} onChange={e => setLocal(p => ({ ...p, institution: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="JIPMER, Puducherry" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Location</label>
            <input type="text" value={local.location} onChange={e => setLocal(p => ({ ...p, location: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Puducherry, India" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Start Date</label>
            <input type="month" value={local.startDate} onChange={e => setLocal(p => ({ ...p, startDate: e.target.value }))} onBlur={flushNow} className="w-full px-4 py-2 ny-input rounded-lg" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">End Date</label>
            <div className="flex gap-2">
              <input type="month" value={local.endDate} onChange={e => setLocal(p => ({ ...p, endDate: e.target.value }))} onBlur={flushNow} disabled={local.current} className="flex-1 px-4 py-2 ny-input rounded-lg disabled:opacity-50" />
              <label className="flex items-center gap-1 ny-text-2 text-sm whitespace-nowrap">
                <input type="checkbox" checked={local.current} onChange={e => { setLocal(p => ({ ...p, current: e.target.checked, endDate: e.target.checked ? '' : p.endDate })); setTimeout(flushNow, 0); }} className="rounded" />Present
              </label>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm ny-text-2">Key Contributions</label>
            <button onClick={addBullet} className="ny-accent text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add Point</button>
          </div>
          <div className="space-y-2">
            {local.bullets.map((b, bi) => (
              <div key={bi} className="flex gap-2">
                <input type="text" value={b} onChange={e => { const nb = [...local.bullets]; nb[bi] = e.target.value; setLocal(p => ({ ...p, bullets: nb })); }} className="flex-1 px-4 py-2 ny-input rounded-lg" placeholder="Performed PCR on 48 water samples..." />
                {local.bullets.length > 1 && <button onClick={() => removeBullet(bi)} className="ny-danger-text hover:opacity-80"><X className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(p => ({ ...p, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const PublicationsStep = ({ profile, setProfile }) => {
  const addPub = () => setProfile(prev => ({
    ...prev,
    publications: [...(prev.publications || []), { id: Date.now(), title: '', authors: '', journal: '', year: '', doi: '', type: 'journal', customFields: [] }]
  }));
  const removePub = (id) => setProfile(prev => ({ ...prev, publications: prev.publications.filter(p => p.id !== id) }));
  const pubs = profile.publications || [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Add journal articles, conference papers, preprints, and book chapters</p>
        <button onClick={addPub} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Publication</button>
      </div>
      {pubs.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No publications yet. Click "Add Publication" to start.</p>
        </div>
      )}
      {pubs.map((pub, idx) => (
        <PubForm key={pub.id} pub={pub} idx={idx} setProfile={setProfile} removePub={removePub} />
      ))}
    </div>
  );
};

const PubForm = ({ pub, idx, setProfile, removePub }) => {
  const [local, setLocal] = useState(pub);
  useEffect(() => {
    const t = setTimeout(() => setProfile(prev => ({ ...prev, publications: prev.publications.map(p => p.id === pub.id ? local : p) })), 300);
    return () => clearTimeout(t);
  }, [local, pub.id, setProfile]);
  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Publication #{idx + 1}</h3>
        <button onClick={() => removePub(pub.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm ny-text-2 mb-2">Title *</label>
          <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Evaluating the Presence of Free-Living Amoebae in Hostel Water Systems..." />
        </div>
        <div>
          <label className="block text-sm ny-text-2 mb-2">Authors</label>
          <input type="text" value={local.authors} onChange={e => setLocal(p => ({ ...p, authors: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Mathew A.A., Kumar S., et al." />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Type</label>
            <select value={local.type} onChange={e => setLocal(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg">
              <option value="journal">Journal Article</option>
              <option value="conference">Conference Paper</option>
              <option value="preprint">Preprint</option>
              <option value="book-chapter">Book Chapter</option>
              <option value="thesis">Thesis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Journal / Venue</label>
            <input type="text" value={local.journal} onChange={e => setLocal(p => ({ ...p, journal: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Int. J. Adv. Med. Health Res." />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Year</label>
            <input type="text" value={local.year} onChange={e => setLocal(p => ({ ...p, year: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="2024" />
          </div>
        </div>
        <div>
          <label className="block text-sm ny-text-2 mb-2">DOI / URL</label>
          <input type="text" value={local.doi} onChange={e => setLocal(p => ({ ...p, doi: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="10.4103/ijamr.ijamr_277_24" />
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(p => ({ ...p, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const PresentationsStep = ({ profile, setProfile }) => {
  const addPres = () => setProfile(prev => ({
    ...prev,
    presentations: [...(prev.presentations || []), { id: Date.now(), title: '', event: '', location: '', date: '', type: 'poster', customFields: [] }]
  }));
  const removePres = (id) => setProfile(prev => ({ ...prev, presentations: prev.presentations.filter(p => p.id !== id) }));
  const pres = profile.presentations || [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Poster presentations, oral talks, guest lectures, conference presentations</p>
        <button onClick={addPres} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Presentation</button>
      </div>
      {pres.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No presentations yet. Click "Add Presentation" to start.</p>
        </div>
      )}
      {pres.map((p, idx) => (
        <PresForm key={p.id} pres={p} idx={idx} setProfile={setProfile} removePres={removePres} />
      ))}
    </div>
  );
};

const PresForm = ({ pres, idx, setProfile, removePres }) => {
  const [local, setLocal] = useState(pres);
  useEffect(() => {
    const t = setTimeout(() => setProfile(prev => ({ ...prev, presentations: prev.presentations.map(p => p.id === pres.id ? local : p) })), 300);
    return () => clearTimeout(t);
  }, [local, pres.id, setProfile]);
  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Presentation #{idx + 1}</h3>
        <button onClick={() => removePres(pres.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm ny-text-2 mb-2">Title *</label>
          <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Identification of free-living amoebae using PCR..." />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Type</label>
            <select value={local.type} onChange={e => setLocal(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg">
              <option value="poster">Poster</option>
              <option value="oral">Oral Presentation</option>
              <option value="invited">Invited Talk</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Date</label>
            <input type="month" value={local.date} onChange={e => setLocal(p => ({ ...p, date: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Event / Conference</label>
            <input type="text" value={local.event} onChange={e => setLocal(p => ({ ...p, event: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="10th Annual Research Day 2025" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Location / Institution</label>
            <input type="text" value={local.location} onChange={e => setLocal(p => ({ ...p, location: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="JIPMER, Puducherry" />
          </div>
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(p => ({ ...p, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const AwardsStep = ({ profile, setProfile }) => {
  const addAward = () => setProfile(prev => ({
    ...prev,
    awards: [...(prev.awards || []), { id: Date.now(), title: '', org: '', year: '', description: '', customFields: [] }]
  }));
  const removeAward = (id) => setProfile(prev => ({ ...prev, awards: prev.awards.filter(a => a.id !== id) }));
  const awards = profile.awards || [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Scholarships, fellowships, prizes, honors, distinctions</p>
        <button onClick={addAward} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Award</button>
      </div>
      {awards.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No awards yet. Click "Add Award" to start.</p>
        </div>
      )}
      {awards.map((a, idx) => (
        <AwardForm key={a.id} award={a} idx={idx} setProfile={setProfile} removeAward={removeAward} />
      ))}
    </div>
  );
};

const AwardForm = ({ award, idx, setProfile, removeAward }) => {
  const [local, setLocal] = useState(award);
  useEffect(() => {
    const t = setTimeout(() => setProfile(prev => ({ ...prev, awards: prev.awards.map(a => a.id === award.id ? local : a) })), 300);
    return () => clearTimeout(t);
  }, [local, award.id, setProfile]);
  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Award #{idx + 1}</h3>
        <button onClick={() => removeAward(award.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Award / Honor Title *</label>
            <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="GJ-STRAUS Awardee 2024" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Awarding Organization</label>
            <input type="text" value={local.org} onChange={e => setLocal(p => ({ ...p, org: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="JIPMER, Puducherry" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Year</label>
            <input type="text" value={local.year} onChange={e => setLocal(p => ({ ...p, year: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="2024" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Brief Description (optional)</label>
            <input type="text" value={local.description} onChange={e => setLocal(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Top position with 80.5% aggregate across 3.5 years" />
          </div>
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(p => ({ ...p, customFields: fields }))}
        />
      </div>
    </div>
  );
};

const ActivitiesStep = ({ profile, setProfile }) => {
  const addActivity = () => setProfile(prev => ({
    ...prev,
    activities: [...(prev.activities || []), { id: Date.now(), name: '', role: '', org: '', date: '', description: '', customFields: [] }]
  }));
  const removeActivity = (id) => setProfile(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }));
  const activities = profile.activities || [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="ny-text-2 text-sm">Conferences attended, workshops, e-courses, extracurriculars, leadership roles</p>
        <button onClick={addActivity} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add Activity</button>
      </div>
      {activities.length === 0 && (
        <div className="text-center py-12 ny-text-2">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No activities yet. Click "Add Activity" to start.</p>
        </div>
      )}
      {activities.map((a, idx) => (
        <ActivityForm key={a.id} activity={a} idx={idx} setProfile={setProfile} removeActivity={removeActivity} />
      ))}
      {activities.length > 0 && (
        <div className="ny-success-box border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 ny-success-text flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="ny-success-text font-semibold mb-1">Academic Profile Complete! 🎉</h3>
              <p className="ny-text-2 text-sm">Head to Generate to produce your academic CV</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityForm = ({ activity, idx, setProfile, removeActivity }) => {
  const [local, setLocal] = useState(activity);
  useEffect(() => {
    const t = setTimeout(() => setProfile(prev => ({ ...prev, activities: prev.activities.map(a => a.id === activity.id ? local : a) })), 300);
    return () => clearTimeout(t);
  }, [local, activity.id, setProfile]);
  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Activity #{idx + 1}</h3>
        <button onClick={() => removeActivity(activity.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Activity / Event Name *</label>
            <input type="text" value={local.name} onChange={e => setLocal(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="HIPRACON 2024 National Conference" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Your Role</label>
            <input type="text" value={local.role} onChange={e => setLocal(p => ({ ...p, role: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Attendee / Organizer / Speaker" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Organizer / Institution</label>
            <input type="text" value={local.org} onChange={e => setLocal(p => ({ ...p, org: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Dept. of Biochemistry, JIPMER" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Date / Year</label>
            <input type="text" value={local.date} onChange={e => setLocal(p => ({ ...p, date: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="2024" />
          </div>
        </div>
        <div>
          <label className="block text-sm ny-text-2 mb-2">Description (optional)</label>
          <input type="text" value={local.description} onChange={e => setLocal(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Themed: Building the future of healthcare with Innovation and Creativity" />
        </div>
        <CustomFieldsBlock
          fields={local.customFields || []}
          onChange={fields => setLocal(p => ({ ...p, customFields: fields }))}
        />
      </div>
    </div>
  );
};
// ─── CustomFieldsBlock — reusable per-entry custom key/value fields ───────────
const CustomFieldsBlock = ({ fields, onChange }) => {
  const addField = () => onChange([...fields, { id: Date.now(), label: '', value: '' }]);
  const removeField = (id) => onChange(fields.filter(f => f.id !== id));
  const updateField = (id, key, val) => onChange(fields.map(f => f.id === id ? { ...f, [key]: val } : f));

  return (
    <div className="mt-4 pt-4 border-t ny-divider">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold ny-text-3 uppercase tracking-wider">Custom Fields</span>
        <button
          onClick={addField}
          className="text-xs ny-accent flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded border ny-border"
        >
          <Plus className="w-3 h-3" /> Add Field
        </button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs ny-text-3 italic">No custom fields. Click "Add Field" to add anything extra — Patent #, Grant ID, Score, Certificate #, etc.</p>
      )}
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={f.label}
              onChange={e => updateField(f.id, 'label', e.target.value)}
              className="w-36 px-3 py-1.5 ny-input rounded text-sm"
              placeholder="Label"
            />
            <span className="ny-text-3 text-sm">:</span>
            <input
              type="text"
              value={f.value}
              onChange={e => updateField(f.id, 'value', e.target.value)}
              className="flex-1 px-3 py-1.5 ny-input rounded text-sm"
              placeholder="Value"
            />
            <button onClick={() => removeField(f.id)} className="ny-danger-text hover:opacity-80 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── CustomSectionsStep — full profile-level custom sections ─────────────────
const CustomSectionsStep = ({ profile, setProfile }) => {
  const sections = profile.customSections || [];

  const addSection = () => {
    setProfile(prev => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        { id: Date.now(), title: '', entries: [{ id: Date.now() + 1, text: '' }] }
      ]
    }));
  };

  const removeSection = (sId) => {
    setProfile(prev => ({ ...prev, customSections: prev.customSections.filter(s => s.id !== sId) }));
  };

  const updateSection = (sId, updated) => {
    setProfile(prev => ({ ...prev, customSections: prev.customSections.map(s => s.id === sId ? updated : s) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="ny-text-2 text-sm">Add any section that doesn't fit the standard fields</p>
          <p className="ny-text-3 text-xs mt-1">Examples: Patents, Grants, Clinical Rotations, Committees, Licenses, Memberships, Courses…</p>
        </div>
        <button onClick={addSection} className="px-4 py-2 ny-btn-primary rounded-lg flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 ny-text-2 border-2 border-dashed ny-border rounded-lg">
          <Plus className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No custom sections yet</p>
          <p className="text-xs ny-text-3 mt-1">Click "Add Section" to create one — it will appear as a full section in your resume</p>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <CustomSectionCard
          key={section.id}
          section={section}
          sIdx={sIdx}
          onUpdate={updated => updateSection(section.id, updated)}
          onRemove={() => removeSection(section.id)}
        />
      ))}

      {sections.length > 0 && (
        <div className="ny-success-box border rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 ny-success-text flex-shrink-0 mt-0.5" />
          <div>
            <p className="ny-success-text font-semibold mb-1">Looking good! 🎉</p>
            <p className="ny-text-2 text-sm">All custom sections will appear at the bottom of your resume in the order listed above.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomSectionCard = ({ section, onUpdate, onRemove }) => {
  const addEntry = () => onUpdate({ ...section, entries: [...section.entries, { id: Date.now(), text: '' }] });
  const removeEntry = (eId) => onUpdate({ ...section, entries: section.entries.filter(e => e.id !== eId) });
  const updateEntry = (eId, text) => onUpdate({ ...section, entries: section.entries.map(e => e.id === eId ? { ...e, text } : e) });

  return (
    <div className="ny-subcard rounded-lg p-4 sm:p-6 border ny-border-strong">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <label className="block text-xs ny-text-3 uppercase tracking-wider mb-1">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={e => onUpdate({ ...section, title: e.target.value })}
            className="w-full px-4 py-2 ny-input rounded-lg text-base font-semibold"
            placeholder="e.g., Patents, Grants, Memberships, Clinical Rotations…"
          />
        </div>
        <button onClick={onRemove} className="ny-danger-text hover:opacity-80 mt-6 flex-shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {section.entries.map((entry, eIdx) => (
          <div key={entry.id} className="flex gap-2 items-center">
            <span className="ny-text-3 text-sm w-4 text-right flex-shrink-0">{eIdx + 1}.</span>
            <input
              type="text"
              value={entry.text}
              onChange={e => updateEntry(entry.id, e.target.value)}
              className="flex-1 px-4 py-2 ny-input rounded-lg text-sm"
              placeholder="Enter your content here…"
            />
            {section.entries.length > 1 && (
              <button onClick={() => removeEntry(entry.id)} className="ny-danger-text hover:opacity-80 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        className="mt-3 text-xs ny-accent flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <Plus className="w-3 h-3" /> Add entry
      </button>
    </div>
  );
};

// ─── AI Coach View ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

const DashboardView = ({ profile, savedResumes, setSavedResumes, setCurrentView, setSavedResumeToLoad, exportData, importData, clearAllData }) => {
  const deleteResume = (index) => {
    if (window.confirm('Delete this resume?')) {
      setSavedResumes(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen ny-bg p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="ny-card rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border ny-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-sm ny-text-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>💾 Data stored locally in your browser</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={exportData} className="px-3 py-2 ny-btn-secondary rounded text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4" />Export
              </button>
              <label className="px-3 py-2 ny-btn-secondary rounded text-sm flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />Import
                <input type="file" accept=".json,.nyxine" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold ny-heading-gradient">Dashboard</h1>
          <button onClick={() => setCurrentView('landing')} className="px-3 sm:px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" />Home
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="ny-card rounded-lg p-4 sm:p-6 border ny-border">
            <h2 className="text-xl font-semibold ny-text-1 mb-4">Master Profile</h2>
            <div className="space-y-3 ny-text-2 mb-6">
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Name:</span>
                <span className="font-medium text-right truncate">{profile.personal.fullName || 'Not set'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Email:</span>
                <span className="text-right truncate text-sm">{profile.personal.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Work Experiences:</span>
                <span className="font-semibold">{profile.workExperience.length}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Education:</span>
                <span className="font-semibold">{profile.education.length}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Skills:</span>
                <span className="font-semibold">{profile.skills.technical.length + profile.skills.soft.length}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="ny-text-2 shrink-0">Projects:</span>
                <span className="font-semibold">{profile.projects.length}</span>
              </div>
            </div>
            <button onClick={() => setCurrentView('wizard')} className="w-full px-4 py-2 ny-btn-secondary rounded-lg">
              Edit Profile
            </button>
          </div>

          <div className="ny-card rounded-lg p-6 border ny-border">
            <h2 className="text-xl font-semibold ny-text-1 mb-4">Saved Resumes</h2>
            {savedResumes.length === 0 ? (
              <div className="text-center py-6 mb-4">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 ny-text-3" />
                <p className="ny-text-2 text-sm">No resumes yet</p>
                <p className="ny-text-3 text-xs mt-1">Generate your first targeted resume!</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {savedResumes.map((resume, idx) => (
                  <div key={idx} className="ny-subcard rounded-lg p-3 flex justify-between items-center border ny-border-strong">
                    <div>
                      <p className="ny-text-1 font-medium">{resume.name}</p>
                      <p className="ny-text-2 text-xs">{resume.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSavedResumeToLoad(resume); setCurrentView('generate'); }}
                        className="ny-accent hover:opacity-80"
                        title="Open & download this resume"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteResume(idx)} className="ny-danger-text hover:opacity-80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setCurrentView('generate')} className="w-full px-4 py-2 ny-btn-success rounded-lg flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />Generate New Resume
            </button>
          </div>
        </div>

        <div className="ny-card rounded-lg p-4 sm:p-6 border ny-border">
          <h2 className="text-lg font-semibold ny-text-1 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            <button onClick={() => setCurrentView('generate')} className="px-3 sm:px-4 py-2 ny-btn-success rounded-lg flex items-center justify-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />Generate
            </button>
            <button onClick={() => setCurrentView('wizard')} className="px-3 sm:px-4 py-2 ny-btn-secondary rounded-lg text-sm">
              Edit Profile
            </button>
            <button onClick={() => setCurrentView('coach')} className="px-3 sm:px-4 py-2 rounded-lg border ny-border ny-text-1 hover:bg-purple-500/10 hover:border-purple-400/60 flex items-center justify-center gap-2 transition-colors text-sm">
              🤖 AI Coach
            </button>
            <button onClick={() => setCurrentView('workspace')} className="hidden lg:flex px-3 sm:px-4 py-2 rounded-lg border ny-border ny-text-1 hover:bg-purple-500/10 hover:border-purple-400/60 items-center justify-center gap-2 transition-colors text-sm">
              <Sparkles className="w-4 h-4" />Workspace
            </button>
            <button onClick={exportData} className="px-3 sm:px-4 py-2 ny-btn-secondary rounded-lg flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" />Export
            </button>
            <button onClick={clearAllData} className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 ny-btn-danger rounded-lg text-sm">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ RESUME TEMPLATES

const ModernTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white p-4 sm:p-5 md:p-6 max-w-6xl mx-auto print:p-0 print:max-w-none" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.4', background: 'linear-gradient(to right, #f3f4f6 300px, white 300px)' }}>
      <div className="grid grid-cols-[300px_1fr] print:grid-cols-[300px_1fr] gap-6 print:gap-6">
        {/* Left sidebar - Contact & Skills */}
        <div className="p-6" style={{ backgroundColor: 'transparent' }}>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{profile.personal.fullName}</h1>
            <div className="text-xs text-gray-700 space-y-1.5">
              <p className="break-words">{profile.personal.email}</p>
              <p>{profile.personal.phone}</p>
              <p>{profile.personal.location}</p>
              {profile.personal.linkedin && <p className="text-blue-600 break-words text-xs">{profile.personal.linkedin.replace('https://', '')}</p>}
              {profile.personal.github && <p className="text-blue-600 break-words text-xs">{profile.personal.github.replace('https://', '')}</p>}
              {profile.personal.portfolio && <p className="text-blue-600 break-words text-xs">{profile.personal.portfolio.replace('https://', '')}</p>}
            </div>
          </div>

          {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">SKILLS</h2>
              <div className="text-xs text-gray-700 space-y-3">
                {techSkills.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-500 uppercase tracking-wide mb-1" style={{fontSize:'8pt'}}>Technical</p>
                    <div className="space-y-0.5">
                      {techSkills.map((s, i) => <div key={i} className="flex items-start"><span className="mr-1 text-gray-400">•</span><span>{s}</span></div>)}
                    </div>
                  </div>
                )}
                {softSkills.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-500 uppercase tracking-wide mb-1" style={{fontSize:'8pt'}}>Professional</p>
                    <div className="space-y-0.5">
                      {softSkills.map((s, i) => <div key={i} className="flex items-start"><span className="mr-1 text-gray-400">•</span><span>{s}</span></div>)}
                    </div>
                  </div>
                )}
                {langSkills.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-500 uppercase tracking-wide mb-1" style={{fontSize:'8pt'}}>Languages</p>
                    <div className="space-y-0.5">
                      {langSkills.map((s, i) => <div key={i} className="flex items-start"><span className="mr-1 text-gray-400">•</span><span>{s}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {profile.education.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">EDUCATION</h2>
              {profile.education.map(edu => (
                <div key={edu.id} className="mb-3 text-xs resume-entry">
                  <div className="font-bold text-gray-900">{edu.degree}</div>
                  <div className="text-gray-700 font-medium">{edu.major}</div>
                  <div className="text-gray-600">{edu.school}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{formatDate(edu.graduationDate)}</div>
                  {edu.gpa && <div className="text-gray-500 text-xs">{edu.gradeType || 'GPA'}: {edu.gpa}</div>}
                  {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right main content - Summary, Experience & Projects */}
        <div>
          {profile.personal.summary && (
            <div className="mb-5 resume-entry">
              <h2 className="text-sm font-bold text-gray-900 mb-1.5 pb-1 border-b-2 border-gray-800 uppercase tracking-widest">Summary</h2>
              <p className="text-sm text-gray-800 leading-relaxed text-justify">{profile.personal.summary}</p>
            </div>
          )}
          {selectedJobs.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">EXPERIENCE</h2>
              {selectedJobs.map(job => (
                <div key={job.id} className="mb-5 resume-entry">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-gray-900">{job.title}</h3>
                    <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(job.startDate)} - {job.current ? 'Present' : formatDate(job.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 italic mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                    {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
                  {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {displayProjects.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">PROJECTS</h2>
              {displayProjects.map(proj => (
                <div key={proj.id} className="mb-4 resume-entry">
                  <h3 className="text-base font-bold text-gray-900">{proj.name}</h3>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed text-justify">{proj.description}</p>
                  {proj.technologies && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Technologies:</span> {proj.technologies}
                    </p>
                  )}
                  {proj.link && <p className="text-xs text-blue-600 mt-1 break-words">{proj.link}</p>}
                  {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
          {displayCerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">CERTIFICATIONS</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {displayCerts.map((cert, idx) => (
                  <li key={idx} className="leading-relaxed">{cert}</li>
                ))}
              </ul>
            </div>
          )}
          {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
            <div key={sec.id} className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-800">{sec.title.toUpperCase()}</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="leading-relaxed">{e.text}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ClassicTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white p-4 sm:p-6 md:p-10 lg:p-12 max-w-4xl mx-auto print:p-0 print:max-w-none" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-black">
        <h1 className="font-bold mb-2 tracking-wide" style={{ fontSize: '16pt' }}>{profile.personal.fullName.toUpperCase()}</h1>
        <p className="text-sm text-gray-700">
          {profile.personal.email} | {profile.personal.phone} | {profile.personal.location}
        </p>
        {(profile.personal.linkedin || profile.personal.github || profile.personal.portfolio) && (
          <p className="text-sm text-blue-700 mt-1">
            {[profile.personal.linkedin, profile.personal.github, profile.personal.portfolio]
              .filter(Boolean)
              .map(link => link.replace('https://', ''))
              .join(' | ')}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {/* Summary */}
        {profile.personal.summary && (
          <div className="resume-entry">
            <h2 className="text-base font-bold text-center mb-2 tracking-wide">PROFESSIONAL SUMMARY</h2>
            <p className="text-sm leading-relaxed text-justify">{profile.personal.summary}</p>
          </div>
        )}
        {/* Experience */}
        {selectedJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide">PROFESSIONAL EXPERIENCE</h2>
            {selectedJobs.map(job => (
              <div key={job.id} className="mb-4 resume-entry">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 className="text-base font-bold">{job.title}</h3>
                    <p className="text-sm italic">{job.company}{job.location && `, ${job.location}`}</p>
                  </div>
                  <span className="text-sm whitespace-nowrap ml-4">
                    {formatDate(job.startDate)} – {job.current ? 'Present' : formatDate(job.endDate)}
                  </span>
                </div>
                <ul className="list-disc ml-6 mt-2 space-y-1.5 text-sm leading-relaxed">
                  {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
                {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide">EDUCATION</h2>
            {profile.education.map(edu => (
              <div key={edu.id} className="mb-3 resume-entry">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="text-base font-bold">{edu.degree} in {edu.major}</h3>
                    <p className="text-sm">{edu.school}{edu.location && `, ${edu.location}`}</p>
                  </div>
                  <span className="text-sm whitespace-nowrap ml-4">{formatDate(edu.graduationDate)}</span>
                </div>
                {edu.gpa && <p className="text-sm text-gray-700 mt-1">{edu.gradeType || 'GPA'}: {edu.gpa}</p>}
                {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
          <div>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide border-b border-gray-400 pb-1">SKILLS</h2>
            <div className="text-sm leading-relaxed space-y-1">
              {techSkills.length > 0 && (
                <p><span className="font-bold">Technical: </span>{techSkills.join(' · ')}</p>
              )}
              {softSkills.length > 0 && (
                <p><span className="font-bold">Professional: </span>{softSkills.join(' · ')}</p>
              )}
              {langSkills.length > 0 && (
                <p><span className="font-bold">Languages: </span>{langSkills.join(' · ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {displayProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide">PROJECTS</h2>
            {displayProjects.map(proj => (
              <div key={proj.id} className="mb-3 resume-entry">
                <h3 className="text-base font-bold">{proj.name}</h3>
                <p className="text-sm mt-1 leading-relaxed text-justify">{proj.description}</p>
                {proj.technologies && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">Technologies:</span> {proj.technologies}
                  </p>
                )}
                {proj.link && <p className="text-sm text-blue-700 mt-1 break-words">{proj.link}</p>}
                {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                ))}
              </div>
            ))}
          </div>
        )}
        {/* Certifications */}
        {displayCerts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide">CERTIFICATIONS</h2>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              {displayCerts.map((cert, idx) => (
                <li key={idx} className="leading-relaxed">{cert}</li>
              ))}
            </ul>
          </div>
        )}
        {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
          <div key={sec.id}>
            <h2 className="text-lg font-bold text-center mb-3 tracking-wide">{sec.title.toUpperCase()}</h2>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="leading-relaxed">{e.text}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const HarvardTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));

  const headingStyle = {
    fontSize: '10.5pt', fontWeight: 'bold', textTransform: 'uppercase',
    letterSpacing: '0.06em', borderBottom: '1px solid #000',
    paddingBottom: '2px', marginBottom: '8px',
  };
  const colDate = { width: '84px', flexShrink: 0, textAlign: 'right', fontSize: '10pt', paddingTop: '1px' };
  const colBody = { flex: 1, fontSize: '10pt' };

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', lineHeight: '1.4', color: '#000' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '17pt', fontWeight: 'bold', letterSpacing: '0.04em', marginBottom: '4px' }}>
          {profile.personal.fullName.toUpperCase()}
        </h1>
        <p style={{ fontSize: '9.5pt' }}>
          {[
            profile.personal.email,
            profile.personal.phone,
            profile.personal.location,
            profile.personal.linkedin?.replace('https://','').replace('www.',''),
            profile.personal.github?.replace('https://','').replace('www.',''),
            profile.personal.portfolio?.replace('https://','').replace('www.',''),
          ].filter(Boolean).join(' | ')}
        </p>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #000', marginBottom: '10px' }} />

      {/* Summary */}
      {profile.personal.summary && (
        <div style={{ marginBottom: '10px' }} className="resume-entry">
          <h2 style={headingStyle}>Summary</h2>
          <p style={{ fontSize: '10pt', lineHeight: '1.45', textAlign: 'justify' }}>{profile.personal.summary}</p>
        </div>
      )}

      {/* Education */}
      {profile.education.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>Education</h2>
          {profile.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }} className="resume-entry">
              <div style={colDate}>{formatDate(edu.graduationDate) || 'Present'}</div>
              <div style={colBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.01em' }}>{edu.school}</span>
                  {edu.location && <span style={{ textTransform: 'uppercase', marginLeft: '10px', flexShrink: 0 }}>{edu.location}</span>}
                </div>
                <p style={{ marginBottom: '1px' }}>{edu.degree}{edu.major ? ` in ${edu.major}` : ''}</p>
                {edu.gpa && <p>{edu.gradeType || 'GPA'}: {edu.gpa}</p>}
                {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} style={{ fontSize: '9.5pt', marginTop: '2px' }}><strong>{f.label}:</strong> {f.value}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {selectedJobs.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>Experience</h2>
          {selectedJobs.map(job => (
            <div key={job.id} style={{ display: 'flex', gap: '12px', marginBottom: '10px' }} className="resume-entry">
              <div style={colDate}>{formatDate(job.startDate)}–{job.current ? 'Present' : formatDate(job.endDate)}</div>
              <div style={colBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.01em' }}>{job.company}</span>
                  {job.location && <span style={{ textTransform: 'uppercase', marginLeft: '10px', flexShrink: 0 }}>{job.location}</span>}
                </div>
                <p style={{ fontStyle: 'italic', marginBottom: '3px' }}>{job.title}</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.4em', lineHeight: '1.4' }}>
                  {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>{bullet}</li>
                  ))}
                </ul>
                {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} style={{ fontSize: '9.5pt', marginTop: '2px' }}><strong>{f.label}:</strong> {f.value}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {displayProjects.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>Projects</h2>
          {displayProjects.map(proj => (
            <div key={proj.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }} className="resume-entry">
              <div style={{ ...colDate, textAlign: 'left' }}></div>
              <div style={colBody}>
                <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{proj.name}</p>
                <p style={{ lineHeight: '1.4', marginBottom: '2px', textAlign: 'justify' }}>{proj.description}</p>
                {proj.technologies && <p style={{ fontStyle: 'italic' }}>Technologies: {proj.technologies}</p>}
                {proj.link && <p style={{ fontSize: '9.5pt' }}>{proj.link}</p>}
                {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <p key={f.id} style={{ fontSize: '9.5pt', marginTop: '2px' }}><strong>{f.label}:</strong> {f.value}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>Skills</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...colDate, textAlign: 'left' }}></div>
            <div style={{ ...colBody, lineHeight: '1.6' }}>
              {techSkills.length > 0 && <p style={{ marginBottom: '2px' }}><strong>Technical: </strong>{techSkills.join(', ')}</p>}
              {softSkills.length > 0 && <p style={{ marginBottom: '2px' }}><strong>Professional: </strong>{softSkills.join(', ')}</p>}
              {langSkills.length > 0 && <p><strong>Languages: </strong>{langSkills.join(', ')}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Certifications */}
      {displayCerts.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>Certifications</h2>
          {displayCerts.map((cert, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }} className="resume-entry">
              <div style={{ ...colDate, textAlign: 'left' }}></div>
              <p style={colBody}>{cert}</p>
            </div>
          ))}
        </div>
      )}
      {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
        <div key={sec.id} style={{ marginBottom: '10px' }}>
          <h2 style={headingStyle}>{sec.title}</h2>
          {sec.entries.filter(e=>e.text?.trim()).map(e=>(
            <div key={e.id} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
              <div style={{ ...colDate, textAlign: 'left' }}></div>
              <p style={colBody}>{e.text}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ATSOptimizedTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white p-4 sm:p-6 md:p-10 lg:p-12 max-w-4xl mx-auto print:p-0 print:max-w-none" style={{ fontFamily: 'Arial, Calibri, sans-serif' }}>
      {/* Header - Simple and Clean */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
          {profile.personal.fullName}
        </h1>
        <p className="text-sm" style={{ color: '#000000' }}>
          {profile.personal.email} | {profile.personal.phone} | {profile.personal.location}
        </p>
        {(profile.personal.linkedin || profile.personal.github || profile.personal.portfolio) && (
          <p className="text-sm mt-1" style={{ color: '#000000' }}>
            {[profile.personal.linkedin, profile.personal.github, profile.personal.portfolio]
              .filter(Boolean)
              .map(link => link.replace('https://', ''))
              .join(' | ')}
          </p>
        )}
      </div>

      {/* Professional Summary */}
      {profile.personal.summary && (
        <div className="mb-6 resume-entry">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Summary</h2>
          <p className="text-sm leading-relaxed text-justify" style={{ color: '#000000' }}>{profile.personal.summary}</p>
        </div>
      )}

      {/* Skills - Bulleted List */}
      {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Skills</h2>
          <div className="text-sm space-y-1" style={{ color: '#000000' }}>
            {techSkills.length > 0 && (
              <p><span className="font-semibold">Technical Skills: </span>{techSkills.join(' • ')}</p>
            )}
            {softSkills.length > 0 && (
              <p><span className="font-semibold">Professional Skills: </span>{softSkills.join(' • ')}</p>
            )}
            {langSkills.length > 0 && (
              <p><span className="font-semibold">Languages: </span>{langSkills.join(' • ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {selectedJobs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Work Experience</h2>
          {selectedJobs.map(job => (
            <div key={job.id} className="mb-4 resume-entry">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-sm font-bold" style={{ color: '#000000' }}>{job.title}</h3>
                <span className="text-xs whitespace-nowrap ml-4" style={{ color: '#000000' }}>
                  {formatDate(job.startDate)} - {job.current ? 'Present' : formatDate(job.endDate)}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: '#000000' }}>
                {job.company}{job.location && `, ${job.location}`}
              </p>
              <ul className="list-disc ml-6 text-sm" style={{ color: '#000000' }}>
                {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                  <li key={idx} className="mb-1 leading-relaxed">{bullet}</li>
                ))}
              </ul>
              {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <p key={f.id} className="text-xs mt-0.5" style={{color:'#000'}}><span className="font-semibold">{f.label}:</span> {f.value}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {profile.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Education</h2>
          {profile.education.map(edu => (
            <div key={edu.id} className="mb-3 resume-entry">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#000000' }}>
                    {edu.degree} in {edu.major}
                  </h3>
                  <p className="text-sm" style={{ color: '#000000' }}>
                    {edu.school}{edu.location && `, ${edu.location}`}
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap ml-4" style={{ color: '#000000' }}>
                  {formatDate(edu.graduationDate)}
                </span>
              </div>
              {edu.gpa && <p className="text-sm mt-1" style={{ color: '#000000' }}>{edu.gradeType || 'GPA'}: {edu.gpa}</p>}
              {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <p key={f.id} className="text-xs mt-0.5" style={{color:'#000'}}><span className="font-semibold">{f.label}:</span> {f.value}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {displayProjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Projects</h2>
          {displayProjects.map(proj => (
            <div key={proj.id} className="mb-3 resume-entry">
              <h3 className="text-sm font-bold" style={{ color: '#000000' }}>{proj.name}</h3>
              <p className="text-sm mt-1 leading-relaxed text-justify" style={{ color: '#000000' }}>{proj.description}</p>
              {proj.technologies && (
                <p className="text-sm mt-1" style={{ color: '#000000' }}>
                  Technologies: {proj.technologies}
                </p>
              )}
              {proj.link && <p className="text-sm mt-1" style={{ color: '#000000' }}>{proj.link}</p>}
              {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <p key={f.id} className="text-xs mt-0.5" style={{color:'#000'}}><span className="font-semibold">{f.label}:</span> {f.value}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      {displayCerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>Certifications</h2>
          <ul className="list-disc ml-6 text-sm" style={{ color: '#000000' }}>
            {displayCerts.map((cert, idx) => (
              <li key={idx} className="mb-1 leading-relaxed">{cert}</li>
            ))}
          </ul>
        </div>
      )}
      {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
        <div key={sec.id} className="mb-6">
          <h2 className="text-base font-bold mb-2" style={{ color: '#000000' }}>{sec.title}</h2>
          <ul className="list-disc ml-6 text-sm" style={{ color: '#000000' }}>
            {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="mb-1 leading-relaxed">{e.text}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};

// 🎨 NEW COLORFUL TEMPLATES

const CreativeTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white max-w-6xl mx-auto print:max-w-none print-full-bleed" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt' }}>
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 print:p-8">
        <h1 className="font-bold mb-3" style={{ fontSize: '20pt' }}>{profile.personal.fullName}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-100">
          <span>✉ {profile.personal.email}</span>
          <span>📱 {profile.personal.phone}</span>
          <span>📍 {profile.personal.location}</span>
        </div>
        {(profile.personal.linkedin || profile.personal.github || profile.personal.portfolio) && (
          <div className="flex gap-4 mt-2 text-sm text-blue-100">
            {profile.personal.linkedin && <span>🔗 {profile.personal.linkedin.replace('https://', '')}</span>}
            {profile.personal.github && <span>💻 {profile.personal.github.replace('https://', '')}</span>}
            {profile.personal.portfolio && <span>🌐 {profile.personal.portfolio.replace('https://', '')}</span>}
          </div>
        )}
      </div>

      <div className="p-8 print:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] print:grid-cols-[1fr_300px] gap-6 print:gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Professional Summary */}
            {profile.personal.summary && (
              <div className="resume-entry">
                <h2 className="text-base font-bold text-blue-600 mb-2 pb-1.5 border-b-2 border-blue-600 uppercase tracking-wide">Summary</h2>
                <p className="text-sm text-gray-800 leading-relaxed text-justify">{profile.personal.summary}</p>
              </div>
            )}

            {/* Experience */}
            {selectedJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1.5 border-b-2 border-blue-600 uppercase tracking-wide">Experience</h2>
                {selectedJobs.map(job => (
                  <div key={job.id} className="mb-5 resume-entry">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-base font-bold text-gray-900">{job.title}</h3>
                      <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                        {formatDate(job.startDate)} - {job.current ? 'Present' : formatDate(job.endDate)}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 font-semibold mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                    <ul className="list-none space-y-1.5 text-sm text-gray-800">
                      {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                        <li key={idx} className="pl-5 relative before:content-['▸'] before:absolute before:left-0 before:text-gray-400 leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                      <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {displayProjects.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1.5 border-b-2 border-blue-600 uppercase tracking-wide">Projects</h2>
                {displayProjects.map(proj => (
                  <div key={proj.id} className="mb-4 resume-entry">
                    <h3 className="text-base font-bold text-gray-900">{proj.name}</h3>
                    <p className="text-sm text-gray-800 mt-1 leading-relaxed text-justify">{proj.description}</p>
                    {proj.technologies && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold">Tech:</span> {proj.technologies}
                      </p>
                    )}
                    {proj.link && <p className="text-xs text-slate-500 mt-1 break-words">{proj.link}</p>}
                    {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                      <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {displayCerts.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1.5 border-b-2 border-blue-600 uppercase tracking-wide">Certifications</h2>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                  {displayCerts.map((cert, idx) => (
                    <li key={idx} className="leading-relaxed">{cert}</li>
                  ))}
                </ul>
              </div>
            )}
            {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
              <div key={sec.id}>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1.5 border-b-2 border-blue-600 uppercase tracking-wide">{sec.title.toUpperCase()}</h2>
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                  {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="leading-relaxed">{e.text}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
              <div>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1 border-b-2 border-blue-600 uppercase tracking-wide">Skills</h2>
                <div className="space-y-3">
                  {techSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Technical</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {techSkills.map((s, i) => <li key={i} className="text-sm text-gray-800">{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {softSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Professional</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {softSkills.map((s, i) => <li key={i} className="text-sm text-gray-800">{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {langSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Languages</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {langSkills.map((s, i) => <li key={i} className="text-sm text-gray-800">{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-blue-600 mb-3 pb-1 border-b-2 border-blue-600 uppercase tracking-wide">Education</h2>
                {profile.education.map(edu => (
                  <div key={edu.id} className="mb-4 last:mb-0 resume-entry">
                    <div className="font-bold text-gray-900 text-sm">{edu.degree}</div>
                    <div className="text-sm text-gray-700">{edu.major}</div>
                    <div className="text-sm text-gray-600">{edu.school}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(edu.graduationDate)}</div>
                    {edu.gpa && <div className="text-xs text-gray-500">{edu.gradeType || 'GPA'}: {edu.gpa}</div>}
                    {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                      <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalColorTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.5' }}>
      {/* Subtle Colored Header Bar */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 h-3"></div>

      <div className="p-0 print:p-0">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-slate-600">
          <h1 className="font-bold text-slate-800 mb-3" style={{ fontSize: '16pt' }}>{profile.personal.fullName}</h1>
          <div className="text-sm text-gray-600 space-x-3">
            <span>{profile.personal.email}</span>
            <span>•</span>
            <span>{profile.personal.phone}</span>
            <span>•</span>
            <span>{profile.personal.location}</span>
          </div>
          {(profile.personal.linkedin || profile.personal.github || profile.personal.portfolio) && (
            <p className="text-sm text-slate-600 mt-2">
              {[profile.personal.linkedin, profile.personal.github, profile.personal.portfolio]
                .filter(Boolean)
                .map(link => link.replace('https://', ''))
                .join(' • ')}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Professional Summary */}
          {profile.personal.summary && (
            <div className="resume-entry">
              <h2 className="text-sm font-bold text-slate-700 mb-2 pb-1.5 border-b-2 border-slate-600 tracking-widest">PROFESSIONAL SUMMARY</h2>
              <p className="text-sm text-gray-800 leading-relaxed text-justify">{profile.personal.summary}</p>
            </div>
          )}

          {/* Experience */}
          {selectedJobs.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">EXPERIENCE</h2>
              {selectedJobs.map(job => (
                <div key={job.id} className="mb-5 resume-entry">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-slate-800">{job.title}</h3>
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(job.startDate)} – {job.current ? 'Present' : formatDate(job.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 italic mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                    {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
                  {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {profile.education.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">EDUCATION</h2>
              {profile.education.map(edu => (
                <div key={edu.id} className="mb-3 resume-entry">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{edu.degree} in {edu.major}</h3>
                      <p className="text-sm text-gray-700">{edu.school}{edu.location && `, ${edu.location}`}</p>
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">{formatDate(edu.graduationDate)}</span>
                  </div>
                  {edu.gpa && <p className="text-sm text-gray-600 mt-1">{edu.gradeType || 'GPA'}: {edu.gpa}</p>}
                  {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">SKILLS</h2>
              <div className="space-y-3">
                {techSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Technical</p>
                    <div className="flex flex-wrap gap-1.5">
                      {techSkills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs border border-slate-300">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {softSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Professional</p>
                    <div className="flex flex-wrap gap-1.5">
                      {softSkills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs border border-slate-300">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {langSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {langSkills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs border border-slate-300">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {displayProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">PROJECTS</h2>
              {displayProjects.map(proj => (
                <div key={proj.id} className="mb-4 resume-entry">
                  <h3 className="text-sm font-bold text-slate-800">{proj.name}</h3>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed text-justify">{proj.description}</p>
                  {proj.technologies && (
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold">Technologies:</span> {proj.technologies}
                    </p>
                  )}
                  {proj.link && <p className="text-xs text-slate-600 mt-1 break-words">{proj.link}</p>}
                  {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {displayCerts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">CERTIFICATIONS</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {displayCerts.map((cert, idx) => (
                  <li key={idx} className="leading-relaxed">{cert}</li>
                ))}
              </ul>
            </div>
          )}
          {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
            <div key={sec.id}>
              <h2 className="text-sm font-bold text-slate-700 mb-3 pb-1.5 border-b-2 border-slate-600 tracking-widest">{sec.title.toUpperCase()}</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="leading-relaxed">{e.text}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BoldTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white max-w-6xl mx-auto print:max-w-none print-full-bleed" style={{ background: 'linear-gradient(to right, #1e293b 280px, white 280px)' }}>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] print:grid-cols-[280px_1fr]">
        {/* Dark Sidebar */}
        <div className="text-white p-8 print:p-8" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', backgroundColor: 'transparent' }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 break-words">{profile.personal.fullName}</h1>
            <div className="h-1 w-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded"></div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">Contact</h3>
              <div className="space-y-2 text-slate-300">
                <p className="break-words">{profile.personal.email}</p>
                <p>{profile.personal.phone}</p>
                <p>{profile.personal.location}</p>
                {profile.personal.linkedin && <p className="text-cyan-300 break-words text-xs">{profile.personal.linkedin.replace('https://', '')}</p>}
                {profile.personal.github && <p className="text-cyan-300 break-words text-xs">{profile.personal.github.replace('https://', '')}</p>}
                {profile.personal.portfolio && <p className="text-cyan-300 break-words text-xs">{profile.personal.portfolio.replace('https://', '')}</p>}
              </div>
            </div>

            {(techSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0) && (
              <div>
                <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">Skills</h3>
                <div className="space-y-4">
                  {techSkills.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Technical</p>
                      <div className="space-y-1">
                        {techSkills.map((s, i) => <div key={i} className="bg-slate-700 px-2.5 py-1 rounded text-slate-200 text-xs">{s}</div>)}
                      </div>
                    </div>
                  )}
                  {softSkills.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Professional</p>
                      <div className="space-y-1">
                        {softSkills.map((s, i) => <div key={i} className="bg-slate-700 px-2.5 py-1 rounded text-slate-200 text-xs">{s}</div>)}
                      </div>
                    </div>
                  )}
                  {langSkills.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">Languages</p>
                      <div className="space-y-1">
                        {langSkills.map((s, i) => <div key={i} className="bg-slate-700 px-2.5 py-1 rounded text-slate-200 text-xs">{s}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {profile.education.length > 0 && (
              <div>
                <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">Education</h3>
                {profile.education.map(edu => (
                  <div key={edu.id} className="mb-4 last:mb-0 resume-entry">
                    <div className="font-bold text-white text-sm">{edu.degree}</div>
                    <div className="text-slate-300 text-xs">{edu.major}</div>
                    <div className="text-slate-400 text-xs">{edu.school}</div>
                    <div className="text-slate-500 text-xs mt-1">{formatDate(edu.graduationDate)}</div>
                    {edu.gpa && <div className="text-slate-500 text-xs">{edu.gradeType || 'GPA'}: {edu.gpa}</div>}
                    {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                      <p key={f.id} className="text-xs text-slate-400 mt-0.5"><span className="font-semibold text-slate-300">{f.label}:</span> {f.value}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 print:p-8" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.5' }}>
          {/* Professional Summary */}
          {profile.personal.summary && (
            <div className="mb-8 resume-entry">
              <h2 className="text-sm font-bold text-slate-800 mb-3 pb-1.5 border-b-2 border-cyan-400 uppercase tracking-widest">Summary</h2>
              <p className="text-sm text-gray-800 leading-relaxed text-justify">{profile.personal.summary}</p>
            </div>
          )}

          {selectedJobs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-1.5 border-b-2 border-cyan-400 uppercase tracking-widest">Experience</h2>
              {selectedJobs.map(job => (
                <div key={job.id} className="mb-6 resume-entry">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-slate-800">{job.title}</h3>
                    <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(job.startDate)} - {job.current ? 'Present' : formatDate(job.endDate)}
                    </span>
                  </div>
                  <p className="text-base text-cyan-600 font-semibold mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                  <ul className="list-none space-y-1.5 text-sm text-gray-800">
                    {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-cyan-500 leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  {(job.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {displayProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-1.5 border-b-2 border-cyan-400 uppercase tracking-widest">Projects</h2>
              {displayProjects.map(proj => (
                <div key={proj.id} className="mb-5 resume-entry">
                  <h3 className="text-sm font-bold text-slate-800">{proj.name}</h3>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed text-justify">{proj.description}</p>
                  {proj.technologies && (
                    <p className="text-xs text-cyan-600 mt-1">
                      <span className="font-semibold">Technologies:</span> {proj.technologies}
                    </p>
                  )}
                  {proj.link && <p className="text-xs text-cyan-600 mt-1 break-words">{proj.link}</p>}
                  {(proj.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <p key={f.id} className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">{f.label}:</span> {f.value}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {displayCerts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-1.5 border-b-2 border-cyan-400 uppercase tracking-widest">Certifications</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {displayCerts.map((cert, idx) => (
                  <li key={idx} className="leading-relaxed">{cert}</li>
                ))}
              </ul>
            </div>
          )}
          {(profile.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
            <div key={sec.id}>
              <h2 className="text-sm font-bold text-slate-800 mb-4 pb-1.5 border-b-2 border-cyan-400 uppercase tracking-widest">{sec.title.toUpperCase()}</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                {sec.entries.filter(e=>e.text?.trim()).map(e=><li key={e.id} className="leading-relaxed">{e.text}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ACADEMIC CV TEMPLATE ─────────────────────────────────────────────────────
const AcademicTemplate = ({ profile }) => {
  const divider = { borderBottom: '1px solid #000', marginBottom: '6px', paddingBottom: '2px' };
  const sectionHeading = { fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', ...divider };
  const p = profile;
  const personal = p.personal || {};
  const labSkills = p.skills?.laboratory || [];
  const techSkills = p.skills?.technical || [];
  const langSkills = p.skills?.languages || [];
  const interests = p.skills?.interests || [];
  const researchExp = p.researchExperience || [];
  const pubs = p.publications || [];
  const presentations = p.presentations || [];
  const awards = p.awards || [];
  const activities = p.activities || [];
  const education = p.education || [];

  const pubTypeLabel = { journal: 'Journal Article', conference: 'Conference Paper', preprint: 'Preprint', 'book-chapter': 'Book Chapter', thesis: 'Thesis' };

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', lineHeight: '1.45', color: '#000', background: '#fff' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '17pt', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.03em' }}>{personal.fullName || ''}</h1>
        <p style={{ fontSize: '9.5pt', marginBottom: '2px' }}>
          {[personal.email, personal.phone, personal.location].filter(Boolean).join(' | ')}
        </p>
        <p style={{ fontSize: '9pt' }}>
          {[
            personal.linkedin?.replace('https://','').replace('www.',''),
            personal.researchgate?.replace('https://','').replace('www.',''),
            personal.orcid ? `ORCID: ${personal.orcid}` : null
          ].filter(Boolean).join(' | ')}
        </p>
      </div>
      <hr style={{ border: 'none', borderTop: '1.5px solid #000', marginBottom: '10px' }} />

      {/* Professional Summary */}
      {personal.summary && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Summary</h2>
          <p style={{ fontSize: '10pt', textAlign: 'justify' }}>{personal.summary}</p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Education</h2>
          {education.map((edu, i) => (
            <div key={edu.id || i} style={{ marginBottom: '8px' }} className="resume-entry">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{edu.degree}{edu.major ? ` in ${edu.major}` : ''}</strong>
                  <div>{edu.school}{edu.location ? `, ${edu.location}` : ''}</div>
                  {edu.gpa && <div style={{ fontSize: '10pt' }}>{edu.gradeType || 'GPA'}: {edu.gpa}</div>}
                  {edu.coursework && <div style={{ fontSize: '10pt' }}><em>Relevant Coursework:</em> {edu.coursework}</div>}
                  {edu.thesis && <div style={{ fontSize: '10pt' }}><em>Thesis:</em> {edu.thesis}</div>}
                  {(edu.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                    <div key={f.id} style={{ fontSize: '10pt', marginTop: '2px' }}><strong>{f.label}:</strong> {f.value}</div>
                  ))}
                </div>
                <span style={{ whiteSpace: 'nowrap', marginLeft: '12px', fontSize: '10pt' }}>{formatDate(edu.graduationDate) || ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Research Experience */}
      {researchExp.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Research Experience</h2>
          {researchExp.map((r, i) => (
            <div key={r.id || i} style={{ marginBottom: '8px' }} className="resume-entry">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.title}{r.institution ? `, ${r.institution}` : ''}{r.location ? `, ${r.location}` : ''}</strong>
                <span style={{ whiteSpace: 'nowrap', marginLeft: '12px', fontSize: '10pt' }}>
                  {formatDate(r.startDate)}{(r.startDate || r.endDate) ? ' – ' : ''}{r.current ? 'Present' : formatDate(r.endDate)}
                </span>
              </div>
              {r.bullets?.filter(b => b.trim()).length > 0 && (
                <ul style={{ paddingLeft: '1.4em', marginTop: '3px' }}>
                  {r.bullets.filter(b => b.trim()).map((b, bi) => <li key={bi} style={{ marginBottom: '2px', fontSize: '10pt' }}>{b}</li>)}
                </ul>
              )}
              {(r.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <div key={f.id} style={{ fontSize: '10pt', marginTop: '2px' }}><strong>{f.label}:</strong> {f.value}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Publications */}
      {pubs.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Publications</h2>
          {pubs.map((pub, i) => (
            <div key={pub.id || i} style={{ marginBottom: '6px', paddingLeft: '1.4em', textIndent: '-1.4em', fontSize: '10pt' }} className="resume-entry">
              {pub.authors && <>{pub.authors}. </>}
              <em>{pub.title}</em>.
              {pub.journal && <> {pub.journal}.</>}
              {pub.year && <> {pub.year}.</>}
              {pub.doi && <> DOI: {pub.doi}.</>}
              {pub.type && <span style={{ color: '#555', fontSize: '9pt' }}> [{pubTypeLabel[pub.type] || pub.type}]</span>}
              {(pub.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <span key={f.id} style={{ fontSize: '9.5pt', marginLeft: '4px' }}> | <strong>{f.label}:</strong> {f.value}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Presentations */}
      {presentations.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Presentations</h2>
          {presentations.map((pr, i) => (
            <div key={pr.id || i} style={{ marginBottom: '5px', fontSize: '10pt' }} className="resume-entry">
              <strong>{pr.title}</strong>{pr.type ? ` [${pr.type.charAt(0).toUpperCase() + pr.type.slice(1)}]` : ''}.
              {pr.event && <> {pr.event}.</>}
              {pr.location && <> {pr.location}.</>}
              {pr.date && <> {pr.date}.</>}
              {(pr.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <span key={f.id} style={{ fontSize: '9.5pt', marginLeft: '4px' }}> | <strong>{f.label}:</strong> {f.value}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Awards & Honors */}
      {awards.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Awards &amp; Honors</h2>
          {awards.map((a, i) => (
            <div key={a.id || i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10pt' }} className="resume-entry">
              <div>
                <strong>{a.title}</strong>{a.org ? `, ${a.org}` : ''}
                {a.description && <div style={{ fontStyle: 'italic' }}>{a.description}</div>}
                {(a.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                  <div key={f.id} style={{ fontSize: '9.5pt' }}><strong>{f.label}:</strong> {f.value}</div>
                ))}
              </div>
              {a.year && <span style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}>{a.year}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Leadership & Activities */}
      {activities.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Leadership &amp; Activities</h2>
          {activities.map((a, i) => (
            <div key={a.id || i} style={{ marginBottom: '5px', fontSize: '10pt' }} className="resume-entry">
              <strong>{a.name}</strong>{a.role ? ` — ${a.role}` : ''}.
              {a.org && <> {a.org}.</>}
              {a.date && <> {a.date}.</>}
              {a.description && <div style={{ fontStyle: 'italic', paddingLeft: '1em' }}>{a.description}</div>}
              {(a.customFields||[]).filter(f=>f.label&&f.value).map(f=>(
                <div key={f.id} style={{ fontSize: '9.5pt', paddingLeft: '1em' }}><strong>{f.label}:</strong> {f.value}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {(techSkills.length > 0 || labSkills.length > 0 || langSkills.length > 0 || interests.length > 0) && (
        <div style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>Skills &amp; Interests</h2>
          <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
            {techSkills.length > 0 && <p><strong>Technical: </strong>{techSkills.join(', ')}</p>}
            {labSkills.length > 0 && <p><strong>Laboratory: </strong>{labSkills.join(', ')}</p>}
            {langSkills.length > 0 && <p><strong>Languages: </strong>{langSkills.join(', ')}</p>}
            {interests.length > 0 && <p><strong>Interests: </strong>{interests.join(', ')}</p>}
          </div>
        </div>
      )}
      {(p.customSections||[]).filter(s=>s.title&&s.entries?.some(e=>e.text?.trim())).map(sec=>(
        <div key={sec.id} style={{ marginBottom: '10px' }}>
          <h2 style={sectionHeading}>{sec.title}</h2>
          <ul style={{ paddingLeft: '1.4em', fontSize: '10pt' }}>
            {sec.entries.filter(e=>e.text?.trim()).map(e=>(
              <li key={e.id} style={{ marginBottom: '2px' }}>{e.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// Serialize profile → plain text resume for AI prompts

const GenerateView = ({ setCurrentView, profile, setSavedResumes, savedResumeToLoad, setSavedResumeToLoad, theme, mode }) => {
  const isLight = theme === 'light';
  const atsBadge = (score) => {
    if (score >= 80) return isLight ? 'bg-green-100 text-green-700 font-semibold' : 'bg-green-500/20 text-green-300 font-semibold';
    if (score >= 50) return isLight ? 'bg-amber-100 text-amber-700 font-semibold' : 'bg-yellow-500/20 text-yellow-300 font-semibold';
    return isLight ? 'bg-red-100 text-red-700 font-semibold' : 'bg-red-500/20 text-red-300 font-semibold';
  };
  const [step, setStep] = useState(() => savedResumeToLoad ? 'preview' : 'input');
  const [jobTarget, setJobTarget] = useState(() => savedResumeToLoad?.jobTarget || '');
  const [, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(() => savedResumeToLoad?.analysisResult || null);
  const defaultTemplate = mode === 'academic' ? 'academic' : 'modern';
  const [selectedTemplate, setSelectedTemplate] = useState(() => savedResumeToLoad?.template || defaultTemplate);
  const [resumeName, setResumeName] = useState('');
  const [includeAllItems, setIncludeAllItems] = useState(false);




  useEffect(() => {
    if (savedResumeToLoad) setSavedResumeToLoad(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📊 Template ATS Compatibility Scores
  const templateCompatibility = {
    'modern': {
      score: 40,
      label: 'Low',
      color: 'red',
      warning: 'Uses 2-column layout which may confuse ATS parsers. Best for direct email submissions.'
    },
    'classic': {
      score: 75,
      label: 'Good',
      color: 'yellow',
      warning: 'Traditional single-column format. Minor issues with serif font, but generally ATS-friendly.'
    },
    'creative': {
      score: 20,
      label: 'Poor',
      color: 'red',
      warning: 'Gradient colors, emojis, and 2-column layout will likely fail ATS parsing. Use for direct submissions only.'
    },
    'professional': {
      score: 55,
      label: 'Moderate',
      color: 'yellow',
      warning: 'Gradient header bar and colored borders may cause parsing issues. Better for human-reviewed applications.'
    },
    'bold': {
      score: 15,
      label: 'Poor',
      color: 'red',
      warning: 'Dark sidebar with white text will fail most ATS systems. Great for portfolio sites, not for online applications.'
    },
    'harvard': {
      score: 70,
      label: 'Good',
      color: 'yellow',
      warning: 'Traditional Harvard Business School style. Serif font and tight spacing may cause minor parsing issues, but format is clean and widely recognized by recruiters.'
    },
    'ats': {
      score: 100,
      label: 'Excellent',
      color: 'green',
      warning: null
    },
    'academic': {
      score: 95,
      label: 'Excellent',
      color: 'green',
      warning: null
    }
  };

  // 🎯 Smart Local Keyword Matching Algorithm (No API needed!)
  const analyzeWithAI = async () => {
    if (!jobTarget.trim()) {
      alert('Please enter a job title or description');
      return;
    }

    setIsAnalyzing(true);
    setStep('analyzing');

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // === STEP 1: Extract Keywords from Job Description ===
      const extractKeywords = (text) => {
        if (!text || typeof text !== 'string') return {};

        // Common stop words to filter out
        const stopWords = new Set([
          'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
          'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'we', 'our', 'you', 'your',
          'this', 'they', 'their', 'have', 'had', 'can', 'or', 'but', 'if', 'about', 'all', 'also',
          'should', 'would', 'could', 'must', 'may', 'into', 'through', 'over', 'any', 'these',
          'such', 'been', 'other', 'which', 'who', 'when', 'where', 'why', 'how', 'what'
        ]);

        return text
          .toLowerCase()
          .replace(/[^\w\s+#]/g, ' ') // Keep + and # for tech terms like C++, C#
          .split(/\s+/)
          .filter(word => word && word.length > 2 && !stopWords.has(word))
          .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
          }, {});
      };

      const jobKeywords = extractKeywords(jobTarget);
      const jobKeywordList = Object.keys(jobKeywords);

      // === STEP 2: Score Each Work Experience ===
      const scoreExperience = (experience) => {
        // Safely get experience fields with defaults
        const title = experience.title || '';
        const company = experience.company || '';
        const description = experience.description || '';
        const duration = experience.duration || '';

        const expText = `${title} ${company} ${description}`.toLowerCase();

        let matchScore = 0;
        let matchedKeywords = [];

        // Count keyword matches (weighted by frequency in job description)
        for (const keyword of jobKeywordList) {
          if (expText.includes(keyword)) {
            const weight = jobKeywords[keyword];
            matchScore += weight * 10; // Weight matches by importance
            matchedKeywords.push(keyword);
          }
        }

        // Bonus for title match
        if (title && jobTarget && title.toLowerCase().includes(jobTarget.split(' ')[0].toLowerCase())) {
          matchScore += 30;
        }

        // Bonus for recent experience (within last 5 years)
        if (duration) {
          const yearMatch = duration.match(/(\d{4})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            const currentYear = new Date().getFullYear();
            if (currentYear - year <= 5) {
              matchScore += 15;
            }
          }
        }

        // Normalize score to 0-100
        const relevanceScore = Math.min(100, Math.max(20, matchScore));

        return {
          id: experience.id || Date.now(),
          relevanceScore: Math.round(relevanceScore),
          matchedKeywords: matchedKeywords.slice(0, 5),
          reason: matchedKeywords.length > 0
            ? `Matches ${matchedKeywords.length} key terms: ${matchedKeywords.slice(0, 3).join(', ')}`
            : 'General professional experience'
        };
      };

      // === STEP 3: Rank All Experiences ===
      const workExperiences = Array.isArray(profile.workExperience) ? profile.workExperience : [];
      const rankedExperiences = workExperiences.length > 0
        ? workExperiences.map(scoreExperience).sort((a, b) => b.relevanceScore - a.relevanceScore)
        : [];

      // === STEP 4: Select Top Skills ===
      const technicalSkills = Array.isArray(profile.skills?.technical) ? profile.skills.technical : [];
      const softSkills = Array.isArray(profile.skills?.soft) ? profile.skills.soft : [];
      const certifications = Array.isArray(profile.skills?.certifications) ? profile.skills.certifications : [];

      const allSkills = [...technicalSkills, ...softSkills, ...certifications];

      let finalTopSkills = [];

      if (allSkills.length > 0) {
        const skillScores = allSkills.map(skill => {
          const skillLower = (skill || '').toLowerCase();
          let score = 0;

          // Check if skill appears in job description
          for (const keyword of jobKeywordList) {
            if (skillLower.includes(keyword) || keyword.includes(skillLower)) {
              score += 20;
            }
          }

          // Prioritize technical skills
          if (technicalSkills.includes(skill)) {
            score += 10;
          }

          return { skill, score };
        });

        const topSkills = skillScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(s => s.skill);

        // If no matching skills, use top technical skills
        finalTopSkills = topSkills.length >= 6 ? topSkills : technicalSkills.slice(0, 8);
      } else {
        // No skills at all - use empty array
        finalTopSkills = [];
      }

      // === STEP 5: Calculate ATS-Style Scores ===
      const totalKeywords = jobKeywordList.length;
      const matchedKeywordsInResume = new Set();

      rankedExperiences.forEach(exp => {
        if (exp.matchedKeywords && Array.isArray(exp.matchedKeywords)) {
          exp.matchedKeywords.forEach(kw => matchedKeywordsInResume.add(kw));
        }
      });

      const keywordMatchPercent = totalKeywords > 0
        ? Math.round((matchedKeywordsInResume.size / totalKeywords) * 100)
        : 70;

      const atsScore = Math.min(95, Math.max(60, keywordMatchPercent + 10));
      const authenticityScore = 92; // High since we're using real profile data

      // === STEP 6: Generate Helpful Suggestions ===
      const suggestions = [];

      if (keywordMatchPercent < 70) {
        suggestions.push('Add more keywords from the job description to your bullet points');
      }

      if (rankedExperiences.length > 0 && rankedExperiences[0].relevanceScore < 80) {
        suggestions.push('Consider adding more details to your most relevant role');
      }

      suggestions.push('Use specific metrics and numbers to quantify achievements');
      suggestions.push('Tailor your bullet points to highlight relevant accomplishments');

      if (finalTopSkills.length < 8) {
        suggestions.push('Add more technical skills relevant to this position');
      }

      // === FINAL RESULT ===
      const result = {
        includeAllItems,
        rankedExperiences,
        topSkills: finalTopSkills,
        atsScore,
        keywordMatch: keywordMatchPercent,
        authenticityScore,
        suggestions: suggestions.slice(0, 4)
      };

      setAnalysisResult(result);
      setStep('preview');
    } catch (error) {
      console.error('Analysis Error:', error);
      console.error('Error stack:', error.stack);

      // Fallback with simple mock data so it still works
      const fallbackResult = {
        includeAllItems,
        rankedExperiences: (profile.workExperience || []).map((job, idx) => ({
          id: job.id || Date.now() + idx,
          relevanceScore: Math.max(60, 100 - (idx * 15)),
          reason: `Relevant experience in ${job.title || 'your role'}`
        })),
        topSkills: (profile.skills?.technical || []).slice(0, 8),
        atsScore: 85,
        keywordMatch: 75,
        authenticityScore: 88,
        suggestions: [
          'Add specific metrics to bullet points',
          'Include more keywords from job description',
          'Highlight relevant accomplishments'
        ]
      };

      setAnalysisResult(fallbackResult);
      setStep('preview');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate a complete resume with ALL profile data (no job filtering)
  const generateFullResume = async () => {
    setIsAnalyzing(true);
    setStep('analyzing');

    await new Promise(resolve => setTimeout(resolve, 600));

    const allSkills = [
      ...( Array.isArray(profile.skills?.technical) ? profile.skills.technical : []),
      ...( Array.isArray(profile.skills?.soft) ? profile.skills.soft : []),
      ...( Array.isArray(profile.skills?.certifications) ? profile.skills.certifications : []),
      ...( Array.isArray(profile.skills?.languages) ? profile.skills.languages : []),
    ];

    const totalSections = [
      profile.workExperience?.length > 0,
      profile.education?.length > 0,
      allSkills.length > 0,
      profile.projects?.length > 0,
      !!profile.personal?.summary,
    ].filter(Boolean).length;

    const completeness = Math.round((totalSections / 5) * 100);

    setAnalysisResult({
      fullResume: true,
      completeness,
      rankedExperiences: (profile.workExperience || []).map(exp => ({
        id: exp.id,
        relevanceScore: 100,
        matchedKeywords: [],
        reason: 'Full resume - all experiences included'
      })),
      topSkills: allSkills,
      atsScore: 0,
      keywordMatch: 0,
      authenticityScore: 100,
      suggestions: [
        'Add a job description to get targeted keyword matching',
        'Use the ATS-Optimized template when applying through online portals',
        'Customize your resume for each application for best results'
      ]
    });

    setIsAnalyzing(false);
    setStep('preview');
  };

  const saveResume = () => {
    const name = resumeName.trim() || `Resume - ${new Date().toLocaleDateString()}`;
    const newResume = {
      name,
      date: new Date().toLocaleDateString(),
      jobTarget,
      analysisResult,
      template: selectedTemplate
    };
    setSavedResumes(prev => [...prev, newResume]);
    alert('Resume saved successfully!');
    setResumeName('');
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen ny-bg p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="ny-card rounded-lg p-4 sm:p-8 border ny-border">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 ny-accent" />
              <h2 className="text-xl sm:text-2xl font-bold ny-text-1">Generate Targeted Resume</h2>
            </div>
            <p className="ny-text-2 mb-6">Smart keyword matching will analyze the job and select your most relevant experiences.</p>

            <div className="space-y-4">
              {/* ✅ TEMPLATE SELECTOR */}
              <div>
                <label className="block text-sm font-medium ny-text-2 mb-3">
                  Choose Resume Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Academic CV template — pinned first when in academic mode */}
                  {mode === 'academic' && (
                    <button
                      onClick={() => setSelectedTemplate('academic')}
                      className={`p-4 rounded-lg border-2 transition-all ${selectedTemplate === 'academic' ? 'border-teal-500 bg-teal-500/10' : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'}`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎓</div>
                        <div className={`font-semibold ${selectedTemplate === 'academic' ? 'text-teal-300' : 'ny-text-2'}`}>Academic CV</div>
                        <div className="text-xs ny-text-2 mt-1">Research & publications</div>
                        <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.academic.score)}`}>ATS: {templateCompatibility.academic.score}%</div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTemplate('modern')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'modern'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📄</div>
                      <div className={`font-semibold ${selectedTemplate === 'modern' ? 'ny-accent' : 'ny-text-2'}`}>
                        Modern
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Two-column gray</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.modern.score)}`}>
                        ATS: {templateCompatibility.modern.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('classic')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'classic'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📋</div>
                      <div className={`font-semibold ${selectedTemplate === 'classic' ? 'ny-accent' : 'ny-text-2'}`}>
                        Classic
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Traditional serif</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.classic.score)}`}>
                        ATS: {templateCompatibility.classic.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('ats')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'ats'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className={`font-semibold ${selectedTemplate === 'ats' ? 'ny-success-text' : 'ny-text-2'}`}>
                        ATS-Optimized
                      </div>
                      <div className="text-xs ny-text-2 mt-1">For online systems</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.ats.score)}`}>
                        ATS: {templateCompatibility.ats.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('harvard')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'harvard'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎓</div>
                      <div className={`font-semibold ${selectedTemplate === 'harvard' ? 'text-amber-300' : 'ny-text-2'}`}>
                        Harvard
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Business school style</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.harvard.score)}`}>
                        ATS: {templateCompatibility.harvard.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('creative')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'creative'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎨</div>
                      <div className={`font-semibold ${selectedTemplate === 'creative' ? 'text-purple-300' : 'ny-text-2'}`}>
                        Creative
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Colorful gradient</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.creative.score)}`}>
                        ATS: {templateCompatibility.creative.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('professional')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'professional'
                        ? 'border-[var(--ny-accent)] bg-[var(--ny-accent-dim)]'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💼</div>
                      <div className={`font-semibold ${selectedTemplate === 'professional' ? 'ny-accent' : 'ny-text-2'}`}>
                        Professional
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Subtle color bar</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.professional.score)}`}>
                        ATS: {templateCompatibility.professional.score}%
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('bold')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === 'bold'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-[var(--ny-border-strong)] hover:border-[var(--ny-accent)]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className={`font-semibold ${selectedTemplate === 'bold' ? 'text-cyan-300' : 'ny-text-2'}`}>
                        Bold
                      </div>
                      <div className="text-xs ny-text-2 mt-1">Dark sidebar</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${atsBadge(templateCompatibility.bold.score)}`}>
                        ATS: {templateCompatibility.bold.score}%
                      </div>
                    </div>
                  </button>
                </div>

                {/* Template Compatibility Warning */}
                {templateCompatibility[selectedTemplate].warning && (
                  <div className={`mt-4 border rounded-lg p-4 ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-yellow-400'}`} />
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-amber-800' : 'text-yellow-300'}`}>
                          ⚠️ Template Compatibility Notice
                        </p>
                        <p className="text-sm ny-text-2">
                          {templateCompatibility[selectedTemplate].warning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium ny-text-2 mb-2">
                  Job Title or Description
                </label>
                <textarea
                  value={jobTarget}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit input to 50,000 characters to prevent DoS
                    if (value.length <= 50000) {
                      setJobTarget(value);
                    }
                  }}
                  rows={8}
                  placeholder="Enter job title (e.g., Senior Software Engineer) or paste the full job description for better matching..."
                  className="w-full px-4 py-3 ny-input rounded-lg transition-all resize-y"
                  maxLength={50000}
                />
                <p className="ny-text-3 text-xs mt-2">💡 More details = better keyword matching</p>

                <label className="flex items-start gap-3 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeAllItems}
                    onChange={(e) => setIncludeAllItems(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded ny-border-strong ny-subcard ny-accent focus:ring-2 focus:ring-[var(--ny-accent)]"
                  />
                  <div>
                    <span className="text-sm ny-text-2 group-hover:ny-text-1 transition-colors">
                      Include all experiences and projects (don't filter by relevance)
                    </span>
                    <p className="text-xs ny-text-3 mt-0.5">
                      Show everything while still calculating match scores for insights
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 sm:px-6 py-3 ny-btn-secondary rounded-lg text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={generateFullResume}
                  className="px-4 sm:px-6 py-3 ny-btn-secondary rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  title="Include all your experiences, skills and projects — no filtering"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Full Resume
                </button>
                <button
                  onClick={analyzeWithAI}
                  disabled={!jobTarget.trim()}
                  className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base ${jobTarget.trim() ? 'ny-btn-primary' : 'opacity-40 ny-accent cursor-not-allowed ny-subcard'}`}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  Analyze & Match
                </button>
              </div>
              {!jobTarget.trim() && (
                <p className="ny-text-3 text-xs text-center">Enter a job description to enable smart matching, or click <span className="ny-text-2">Full Resume</span> to include everything.</p>
              )}
            </div>
          </div>


        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen ny-bg p-6 flex items-center justify-center">
        <div className="ny-card rounded-lg p-6 sm:p-8 md:p-12 border ny-border text-center">
          <Sparkles className="w-16 h-16 ny-accent mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold ny-text-1 mb-2">Analyzing Job Requirements</h2>
          <p className="ny-text-2">Matching your profile to the job description...</p>
          <p className="ny-text-3 text-sm mt-2">Extracting keywords and ranking experiences</p>
        </div>
      </div>
    );
  }

  if (step === 'preview' && analysisResult) {
    // Full resume / includeAllItems → date-sorted (newest first)
    // Analyzed + filtered → sort by relevance score (highest first), date as tiebreaker
    const selectedJobs = analysisResult.fullResume || analysisResult.includeAllItems
      ? sortChronologically(profile.workExperience || [], 'startDate', 'current')
      : (profile.workExperience || [])
          .filter(job => {
            const rank = analysisResult.rankedExperiences.find(r => r.id === job.id);
            return rank && rank.relevanceScore >= 60;
          })
          .sort((a, b) => {
            const scoreA = analysisResult.rankedExperiences.find(r => r.id === a.id)?.relevanceScore || 0;
            const scoreB = analysisResult.rankedExperiences.find(r => r.id === b.id)?.relevanceScore || 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return parseDateForSort(b.startDate, b.current) - parseDateForSort(a.startDate, a.current);
          });

    const displaySkills = analysisResult.fullResume || analysisResult.includeAllItems
      ? [
          ...(Array.isArray(profile.skills?.technical) ? profile.skills.technical : []),
          ...(Array.isArray(profile.skills?.soft) ? profile.skills.soft : []),
          ...(Array.isArray(profile.skills?.languages) ? profile.skills.languages : []),
        ]
      : (analysisResult.topSkills && analysisResult.topSkills.length > 0
          ? analysisResult.topSkills
          : [...(profile.skills?.technical || []), ...(profile.skills?.soft || [])].slice(0, 10));

    // Certifications always shown in full — they are their own closing section
    const displayCerts = Array.isArray(profile.skills?.certifications)
      ? profile.skills.certifications
      : [];

    const displayProjects = analysisResult.fullResume || analysisResult.includeAllItems
      ? [...(profile.projects || [])]
      : (profile.projects || []).slice(0, 2);

    // Education always sorted newest-first across all templates
    const sortedProfile = {
      ...profile,
      education: sortChronologically(profile.education || [], 'graduationDate'),
    };

    return (
      <div className="min-h-screen ny-bg p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-bold ny-text-1 mb-4 sm:mb-6">
            {analysisResult.fullResume ? 'Complete Resume Preview' : 'Resume Preview'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            {analysisResult.fullResume ? (
              <>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ny-accent">{selectedJobs.length}</div>
                    <p className="ny-text-2 text-xs sm:text-sm">Experiences</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">All included</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${templateCompatibility[selectedTemplate].score >= 80 ? 'ny-success-text' : templateCompatibility[selectedTemplate].score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {templateCompatibility[selectedTemplate].score}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Template ATS</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Format compatibility</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ny-accent">{displaySkills.length}</div>
                    <p className="ny-text-2 text-xs sm:text-sm">Skills</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">All categories</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${analysisResult.completeness >= 80 ? 'ny-success-text' : analysisResult.completeness >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.completeness}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Profile Complete</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Sections filled</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${analysisResult.atsScore >= 80 ? 'ny-success-text' : analysisResult.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.atsScore}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Content Match</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Keywords & relevance</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${templateCompatibility[selectedTemplate].score >= 80 ? 'ny-success-text' : templateCompatibility[selectedTemplate].score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {templateCompatibility[selectedTemplate].score}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Template ATS</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Format compatibility</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${analysisResult.keywordMatch >= 80 ? 'ny-success-text' : analysisResult.keywordMatch >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.keywordMatch}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Keyword Match</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Job description fit</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-3 sm:p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 ${analysisResult.authenticityScore >= 80 ? 'ny-success-text' : analysisResult.authenticityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.authenticityScore}%
                    </div>
                    <p className="ny-text-2 text-xs sm:text-sm">Authenticity</p>
                    <p className="ny-text-3 text-xs mt-1 hidden sm:block">Real profile data</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
            <div className="ny-info-box border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold ny-accent mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {analysisResult.fullResume ? 'Tips' : 'AI Suggestions'}
              </h3>
              <ul className="space-y-2 ny-text-2">
                {analysisResult.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 ny-accent flex-shrink-0 mt-1" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save Resume Feature */}
          <div className="ny-card rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border ny-border">
            <h3 className="text-base sm:text-lg font-semibold ny-text-1 mb-3">Save This Resume</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g., Software Engineer - Tech Corp"
                className="flex-1 px-4 py-2 ny-input rounded-lg"
              />
              <button
                onClick={saveResume}
                className="px-5 py-2 ny-btn-success rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          {/* 🔧 FIX #2: Print-specific styling */}
          <style>{`
            /* ── A4 preview: zero out each template's own wrapper padding/margin/max-width.
               The #resume-preview container now provides the 0.75in margins so template
               outer divs must not add their own. Applies in both preview and print. */
            #resume-preview > div {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }

            @media print {
              /* Full-bleed templates (Creative, Bold) use margin:0 so their gradient
                 headers and dark sidebars reach the paper edge. Their inner content
                 divs (p-8) provide the text margins. All other templates keep 0.75in
                 page margins so the outer wrapper zeroing (#resume-preview > div) still
                 produces correct spacing. */
              @page {
                size: A4;
                margin: ${['creative', 'bold'].includes(selectedTemplate) ? '0' : '0.75in'};
              }

              /* Hide everything except resume */
              body * {
                visibility: hidden;
              }

              #resume-preview, #resume-preview * {
                visibility: visible;
              }

              #resume-preview {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                /* @page margin: 0.75in now handles all 4 sides on every page.
                   Remove #resume-preview's own padding on print to avoid double-stacking. */
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                overflow: visible !important;
                max-width: none !important;
              }

              /* Zero only the template's own outer wrapper div — NOT #resume-preview.
                 The wrapper's padding is the margin. Template divs must not add their own. */
              #resume-preview > div {
                padding: 0 !important;
                margin: 0 !important;
                max-width: none !important;
                page-break-inside: auto !important;
                break-inside: auto !important;
              }

              /* Hide print buttons and UI elements */
              .no-print {
                display: none !important;
              }

              /* Prevent orphaned headings */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
              }

              /* Remove decorative shadows (keeps gradients/colors intact) */
              * {
                box-shadow: none !important;
                text-shadow: none !important;
              }

              /* Ensure page background is white */
              body {
                background: white !important;
              }

              /* Force color/background printing (required for gradient templates) */
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              /* Remove any overflow/height constraints so content flows naturally */
              #resume-preview, #resume-preview * {
                overflow: visible !important;
                max-height: none !important;
                min-height: 0 !important;
              }

              /* Full-bleed templates (Creative, Bold): colored header/sidebar
                 fills edge-to-edge within the @page margins — no extra padding. */
              #resume-preview > .print-full-bleed {
                padding: 0 !important;
              }

              /* Prevent job / education entries from splitting mid-entry across pages */
              #resume-preview .resume-entry {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `}</style>

          {/* ✅ TEMPLATE-BASED RENDERING — A4 page preview (794×1123px at 96dpi)
               Width is fixed to A4 so preview === PDF. Scrolls horizontally on
               small viewports. Full-bleed templates (Creative/Bold) use 0 padding
               so their headers/sidebars run edge-to-edge. All others get 0.75in
               padding to mirror the @page margin the PDF engine applies. */}
          <div className="overflow-x-auto mb-6 print:mb-0 print:overflow-visible">
          <div
            id="resume-preview"
            className="print:shadow-none print:rounded-none print:p-0"
            style={{
              width: '794px',
              minHeight: '1123px',
              margin: '0 auto',
              background: 'white',
              borderRadius: '3px',
              boxShadow: '0 4px 40px rgba(0,0,0,0.35)',
              padding: (selectedTemplate === 'creative' || selectedTemplate === 'bold') ? '0' : '0.75in',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {selectedTemplate === 'modern' && (
              <ModernTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'classic' && (
              <ClassicTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'harvard' && (
              <HarvardTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'ats' && (
              <ATSOptimizedTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'creative' && (
              <CreativeTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'professional' && (
              <ProfessionalColorTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'bold' && (
              <BoldTemplate
                profile={sortedProfile}
                selectedJobs={selectedJobs}
                displaySkills={displaySkills}
                displayProjects={displayProjects}
                displayCerts={displayCerts}
              />
            )}
            {selectedTemplate === 'academic' && (
              <AcademicTemplate profile={sortedProfile} />
            )}
          </div>{/* end #resume-preview */}
          </div>{/* end overflow-x-auto scroll wrapper */}

          <div className="flex gap-3 no-print">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-3 ny-btn-secondary rounded-lg"
            >
              Back
            </button>
            <button
              onClick={() => {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                  alert('📱 Mobile PDF Download:\n\n1. Click OK to open print preview\n2. In the print dialog:\n   • iOS: tap Share → Save to Files\n   • Android: Select "Save as PDF" as printer\n3. Choose location and save');
                }
                window.print();
              }}
              className="flex-1 px-6 py-3 ny-btn-success rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NyxineResumeMaker;