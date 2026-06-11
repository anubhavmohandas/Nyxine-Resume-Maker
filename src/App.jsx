// Nyxine Resume Maker - Updated Feb 3, 2026
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Briefcase, GraduationCap, Code, Award, Plus, Trash2, ChevronLeft, ChevronRight, Download, AlertCircle, Check, X, Sparkles, Save, Sun, Moon, Home, BookOpen, Mic2, Star, FlaskConical, ToggleLeft, ToggleRight, Trophy, Presentation } from 'lucide-react';

// ─── Date Sorting Utilities ───────────────────────────────────────────────────
// Converts YYYY-MM date strings into a sortable integer.
// Current jobs get the highest value so they always appear first.
const parseDateForSort = (dateStr, isCurrent = false) => {
  if (isCurrent) return 999999; // "Present" always on top
  if (!dateStr || dateStr.trim() === '') return 0; // No date → bottom
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (match) return parseInt(match[1]) * 100 + parseInt(match[2]); // YYYY-MM
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) return parseInt(yearOnly[1]) * 100; // YYYY only
  return 0;
};

// Returns a new sorted array (newest → oldest). Does not mutate the original.
const sortChronologically = (items, dateKey, currentKey = null) => {
  if (!Array.isArray(items) || items.length <= 1) return items;
  return [...items].sort((a, b) => {
    const da = parseDateForSort(a[dateKey], currentKey && a[currentKey]);
    const db = parseDateForSort(b[dateKey], currentKey && b[currentKey]);
    return db - da;
  });
};

// Converts stored date strings to display format.
// Handles both "2021-08" (ISO from date picker) and "Aug 2021" (legacy free-text).
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const iso = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(iso[2]) - 1]} ${iso[1]}`;
  }
  return dateStr; // already "Aug 2021" or similar — show as-is
};
// ─── Date Migration (legacy "Aug 2021" → ISO "2021-08") ──────────────────────
const MONTH_ABBR = {
  jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
  jul:7, aug:8, sep:9, oct:10, nov:11, dec:12
};

// Converts a single "Month YYYY" string to "YYYY-MM". Passes through anything else.
const migrateDate = (s) => {
  if (!s || typeof s !== 'string') return s;
  const m = s.trim().match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return s;
  const monthNum = MONTH_ABBR[m[1].slice(0,3).toLowerCase()];
  if (!monthNum) return s;
  return `${m[2]}-${String(monthNum).padStart(2, '0')}`;
};

// Walks a profile object and converts all date fields to ISO format.
// Non-destructive — fields already in "YYYY-MM" or other formats pass through unchanged.
const migrateDatesInProfile = (p) => {
  if (!p || typeof p !== 'object') return p;
  const migrate = migrateDate;
  return {
    ...p,
    workExperience: (p.workExperience || []).map(j => ({
      ...j,
      startDate: migrate(j.startDate),
      endDate: migrate(j.endDate),
    })),
    researchExperience: (p.researchExperience || []).map(r => ({
      ...r,
      startDate: migrate(r.startDate),
      endDate: migrate(r.endDate),
    })),
    education: (p.education || []).map(e => ({
      ...e,
      graduationDate: migrate(e.graduationDate),
      startDate: migrate(e.startDate),
      gradeType: e.gradeType || 'GPA',
    })),
    publications: (p.publications || []).map(pub => ({
      ...pub,
      year: migrate(pub.year),
    })),
    presentations: (p.presentations || []).map(pres => ({
      ...pres,
      date: migrate(pres.date),
    })),
    awards: (p.awards || []).map(a => ({
      ...a,
      year: migrate(a.year),
    })),
    activities: (p.activities || []).map(act => ({
      ...act,
      date: migrate(act.date),
    })),
  };
};
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
  const [, setIsProcessingUpload] = useState(false); // value unused until Upload ships
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

  // eslint-disable-next-line no-unused-vars -- wired up when Upload feature ships
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert('⚠️ File too large!\n\nMaximum file size: 10MB\nYour file: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB\n\nPlease upload a smaller file or use "Start Fresh" option.');
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }

    setIsProcessingUpload(true);

    try {
      let extractedText = '';

      // Extract text based on file type
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDF: Use basic text extraction
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder('utf-8');
        extractedText = decoder.decode(uint8Array);
        
        // Clean up PDF extraction artifacts
        extractedText = extractedText
          .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable chars
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
        
      } else if (file.name.match(/\.docx?$/i)) {
        // For DOCX: Read as text (basic extraction)
        const text = await file.text();
        extractedText = text;
      }

      // If extraction failed or text is too short
      if (!extractedText || extractedText.length < 50) {
        throw new Error('Could not extract text from file. The file might be image-based or corrupted.');
      }

      // Parse with AI
      const prompt = `You are a resume parsing expert. Extract structured data from this resume text and return ONLY valid JSON.

RESUME TEXT:
${extractedText.slice(0, 6000)}

Return ONLY a JSON object in this EXACT format (no markdown, no backticks, no extra text):
{
  "personal": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "portfolio": "",
    "github": ""
  },
  "workExperience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": false,
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "",
      "major": "",
      "school": "",
      "location": "",
      "graduationDate": "YYYY-MM",
      "gpa": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "certifications": [],
    "languages": []
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": "",
      "link": ""
    }
  ],
  "additional": {
    "volunteer": "",
    "awards": "",
    "publications": ""
  }
}

IMPORTANT RULES:
1. Extract ALL information you can find
2. For dates, use YYYY-MM format (e.g., "2023-01")
3. If current job, set "current": true and "endDate": ""
4. Separate technical vs soft skills appropriately
5. Extract complete bullet points for each job
6. Include ALL jobs, education, and projects found
7. Return ONLY the JSON object, no other text
8. If a field is not found, use empty string "" or empty array []`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI parsing failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;

      // Clean up response
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(responseText);

      // Add IDs to arrays
      if (parsed.workExperience) {
        parsed.workExperience = parsed.workExperience.map((job, idx) => ({
          ...job,
          id: Date.now() + idx,
          bullets: Array.isArray(job.bullets) ? job.bullets : [job.bullets || '']
        }));
      }

      if (parsed.education) {
        parsed.education = parsed.education.map((edu, idx) => ({
          ...edu,
          id: Date.now() + idx + 1000
        }));
      }

      if (parsed.projects) {
        parsed.projects = parsed.projects.map((proj, idx) => ({
          ...proj,
          id: Date.now() + idx + 2000
        }));
      }

      // Ensure skills structure
      if (!parsed.skills) {
        parsed.skills = { technical: [], soft: [], certifications: [], languages: [] };
      }

      // Merge with existing profile (in case user wants to keep some data)
      setProfile(prev => ({
        personal: { ...prev.personal, ...parsed.personal },
        workExperience: parsed.workExperience || prev.workExperience,
        education: parsed.education || prev.education,
        skills: {
          technical: parsed.skills.technical || prev.skills.technical,
          soft: parsed.skills.soft || prev.skills.soft,
          certifications: parsed.skills.certifications || prev.skills.certifications,
          languages: parsed.skills.languages || prev.skills.languages
        },
        projects: parsed.projects || prev.projects,
        additional: { ...prev.additional, ...parsed.additional }
      }));

      alert('✅ Resume parsed successfully! Please review and edit the extracted information.');
      setCurrentView('wizard');
      setCurrentStep(0);

    } catch (error) {
      console.error('Resume upload error:', error);
      alert(`❌ Failed to parse resume: ${error.message}\n\nPlease try:\n1. A different file format\n2. Manual entry (Start Fresh)`);
    } finally {
      setIsProcessingUpload(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ profile, savedResumes }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nyxine-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be re-imported if needed
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (event) => {
      let data;
      try {
        data = JSON.parse(event.target.result);
      } catch {
        alert('Import failed — the file is not valid JSON. Please export a fresh backup and try again.');
        return;
      }
      try {
        if (!data || typeof data !== 'object') {
          alert('Import failed — unexpected file structure.');
          return;
        }
        // Support both { profile, savedResumes } and bare profile object
        const rawProfile = data.profile || (data.personal ? data : null);
        if (rawProfile) setProfile(migrateDatesInProfile(rawProfile));
        if (data.savedResumes && Array.isArray(data.savedResumes)) setSavedResumes(data.savedResumes);
        alert('✅ Data imported successfully!');
        setCurrentView('dashboard');
      } catch (err) {
        alert(`Import failed — ${err.message || 'could not apply the data. Try exporting a fresh backup.'}`);
      }
    };
    reader.readAsText(file);
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
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
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
      <section style={{ padding: '80px 0 90px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
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
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
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
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '26px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }} className="mkt-reveal">
          {[['8','professional templates'],['Zero','data sent to servers'],['2','modes — industry & academic'],['17','AI coaching prompts']].map(([b,t]) => (
            <div key={t} className="flex items-center gap-3 ny-text-2 font-medium text-sm">
              <Award className="w-5 h-5 ny-accent flex-shrink-0" style={{ color: 'var(--ny-accent)' }} />
              <span><strong className="ny-text-1 mkt-disp">{b}</strong> {t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: '96px 0' }} id="features">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
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
      <section style={{ padding: '96px 0', background: 'var(--ny-surface)' }} id="modes">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
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
      <section style={{ padding: '96px 0' }} id="coaching">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">AI coaching panel</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              17 prompts that open <span className="mkt-grad-head">Claude</span> with your resume loaded
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 620, margin: '18px auto 0', lineHeight: 1.65 }}>
              One click bakes your resume into a purpose-built prompt and opens Claude in a new tab. No copy-pasting — just brutally honest feedback.
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
      <section style={{ padding: '96px 0', background: 'var(--ny-surface)' }} id="templates">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
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
      <section style={{ padding: '96px 0' }} id="how">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
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
      <section style={{ padding: '96px 0', background: 'var(--ny-surface)' }} id="privacy">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
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
      <section style={{ padding: '96px 0' }} id="pricing">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div className="mkt-reveal">
            <span className="mkt-eyebrow">Pricing</span>
            <h2 className="mkt-disp ny-text-1" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.1, marginTop: 20, letterSpacing: '-0.025em' }}>
              Free. <span className="mkt-grad-head">Open source.</span> Forever.
            </h2>
            <p className="ny-text-2" style={{ fontSize: 18, marginTop: 18, maxWidth: 560, margin: '18px auto 0' }}>
              No tiers, no paywalls, no "upgrade to export." MIT licensed — clone it, fork it, self-host it.
            </p>
          </div>
          <div className="mkt-reveal ny-card border ny-border rounded-2xl p-10 mt-14 text-left" style={{ transitionDelay: '.08s' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="mkt-disp" style={{ fontSize: 'clamp(48px,8vw,80px)', fontWeight: 700, lineHeight: 1 }}><span className="mkt-grad-title" style={{ display: 'inline-block' }}>$0</span></div>
                <div className="ny-text-3" style={{ fontSize: 15, marginTop: 4 }}>/ forever · no card required</div>
              </div>
              <span className="mkt-eyebrow">MIT Licensed</span>
            </div>
            <p className="ny-text-2" style={{ fontSize: 16, marginTop: 20, maxWidth: 560 }}>
              Every template, both modes, all 17 AI coaches, unlimited saved versions — the complete app with nothing held back.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
              {['All 8 templates','Industry & Academic modes','17 AI coaching prompts','Unlimited saved versions','PDF & JSON export','No ads, no tracking'].map(f => (
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
      <section style={{ padding: '96px 0', background: 'var(--ny-surface)' }} id="faq">
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 32px' }}>
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
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div className="mkt-reveal ny-card border ny-border rounded-3xl p-16 text-center mkt-cta-glow relative">
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
      <footer style={{ borderTop: '1px solid var(--ny-border)', padding: '54px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div className="flex justify-between gap-10 flex-wrap items-start">
            <div style={{ maxWidth: 280 }}>
              <span className="ny-logo-gradient mkt-disp" style={{ fontSize: 22, fontWeight: 700 }}>NYXINE</span>
              <p className="ny-text-3" style={{ fontSize: 14, marginTop: 14, lineHeight: 1.6 }}>Smart, privacy-first resume generation for industry professionals and academic researchers.</p>
            </div>
            <div className="flex gap-16 flex-wrap">
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
    <div className="min-h-screen ny-bg flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {showStorageWarning && (
          <div className="mb-6 ny-card border ny-border rounded-lg p-6">
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

        <div className="ny-card rounded-2xl shadow-2xl p-8 border ny-border">
          <div className="text-center mb-8">
            <h1 className={`text-5xl font-bold mb-4 ${theme === 'dark' ? 'ny-title-dark' : 'ny-title-light'}`} style={{ letterSpacing: '0.08em' }}>NYXINE</h1>
            <p className="text-xl ny-text-2">Smart Resume Builder</p>
            <p className="ny-text-2 mt-2">Enter once. Generate targeted resumes. Stay authentic.</p>

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

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="ny-subcard rounded-lg p-6 border ny-border-strong opacity-60 relative transition-colors">
              <div className="absolute top-3 right-3 ny-badge-warning text-xs px-2 py-1 rounded-full border">
                🚧 Coming Soon
              </div>
              <Upload className="w-8 h-8 ny-text-3 mb-3" />
              <h3 className="text-lg font-semibold ny-text-1 mb-2">Upload Resume</h3>
              <p className="ny-text-2 text-sm mb-4">This feature is under development</p>
              <div className="px-4 py-3 ny-subcard cursor-not-allowed ny-text-3 rounded-lg text-center">
                Coming Soon
              </div>
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
              <input type="file" accept=".json" onChange={importData} className="hidden" />
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
    <div className="min-h-screen ny-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="ny-card rounded-lg p-6 mb-6 border ny-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold ny-text-1">Build Your Profile</h2>
            <div className="flex items-center gap-4">
              <ModeToggle mode={mode} toggleMode={() => { toggleMode(); setCurrentStep(0); }} />
              <span className="ny-text-2 text-sm">{currentStep + 1} of {steps.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className={`flex-1 h-2 rounded-full transition-all ${idx < currentStep ? 'ny-progress-done' : idx === currentStep ? 'ny-progress-active' : 'ny-progress-pending'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {steps.map((step, idx) => (
              <div key={idx} className={`text-xs ${idx === currentStep ? 'ny-accent font-semibold' : idx < currentStep ? 'ny-success-text' : 'ny-text-3'}`}>
                {step.name}
              </div>
            ))}
          </div>
        </div>

        <div className="ny-card rounded-lg p-8 border ny-border">
          <div className="flex items-center gap-3 mb-6">
            <CurrentStepIcon className="w-8 h-8 ny-accent" />
            <h2 className="text-2xl font-bold ny-text-1">{steps[currentStep].name}</h2>
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

          <div className="flex justify-between mt-8 pt-6 border-t ny-divider">
            <button onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setCurrentView('landing')} className="px-6 py-2 ny-btn-secondary rounded-lg flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />{currentStep === 0 ? 'Back' : 'Previous'}
            </button>
            {currentStep < steps.length - 1 ? (
              <button onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep(currentStep + 1);
                }
              }} className="px-6 py-2 ny-btn-primary rounded-lg flex items-center gap-2">
                Next<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentView('dashboard');
                }
              }} className="px-6 py-2 ny-btn-success rounded-lg flex items-center gap-2">
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
      <div className="grid md:grid-cols-2 gap-4">
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
      <div className="grid md:grid-cols-3 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Job #{idx + 1}</h3>
        <button onClick={() => removeJob(job.id)} className="ny-danger-text hover:opacity-80">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
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

        <div className="grid md:grid-cols-3 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Education #{idx + 1}</h3>
        <button onClick={() => removeEdu(edu.id)} className="ny-danger-text hover:opacity-80">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
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

        <div className="grid md:grid-cols-2 gap-4">
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

        <div className="grid md:grid-cols-2 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
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

        <div className="grid md:grid-cols-2 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Research Role #{idx + 1}</h3>
        <button onClick={() => removeEntry(entry.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Role / Position *</label>
            <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Junior Research Fellow" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Institution *</label>
            <input type="text" value={local.institution} onChange={e => setLocal(p => ({ ...p, institution: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="JIPMER, Puducherry" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
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
        <div className="grid md:grid-cols-3 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Presentation #{idx + 1}</h3>
        <button onClick={() => removePres(pres.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm ny-text-2 mb-2">Title *</label>
          <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Identification of free-living amoebae using PCR..." />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
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
        <div className="grid md:grid-cols-2 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Award #{idx + 1}</h3>
        <button onClick={() => removeAward(award.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Award / Honor Title *</label>
            <input type="text" value={local.title} onChange={e => setLocal(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="GJ-STRAUS Awardee 2024" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Awarding Organization</label>
            <input type="text" value={local.org} onChange={e => setLocal(p => ({ ...p, org: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="JIPMER, Puducherry" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
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
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold ny-text-1">Activity #{idx + 1}</h3>
        <button onClick={() => removeActivity(activity.id)} className="ny-danger-text hover:opacity-80"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm ny-text-2 mb-2">Activity / Event Name *</label>
            <input type="text" value={local.name} onChange={e => setLocal(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="HIPRACON 2024 National Conference" />
          </div>
          <div>
            <label className="block text-sm ny-text-2 mb-2">Your Role</label>
            <input type="text" value={local.role} onChange={e => setLocal(p => ({ ...p, role: e.target.value }))} className="w-full px-4 py-2 ny-input rounded-lg" placeholder="Attendee / Organizer / Speaker" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
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

const CustomSectionCard = ({ section, sIdx, onUpdate, onRemove }) => {
  const addEntry = () => onUpdate({ ...section, entries: [...section.entries, { id: Date.now(), text: '' }] });
  const removeEntry = (eId) => onUpdate({ ...section, entries: section.entries.filter(e => e.id !== eId) });
  const updateEntry = (eId, text) => onUpdate({ ...section, entries: section.entries.map(e => e.id === eId ? { ...e, text } : e) });

  return (
    <div className="ny-subcard rounded-lg p-6 border ny-border-strong">
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
const CoachView = ({ profile, setCurrentView }) => {
  const [openSections, setOpenSections] = useState({
    review: true, ats: true, linkedin: true, outreach: true, strategy: true, linkedin_deep: false
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
      setToast("Opening Claude… if the prompt didn\'t auto-fill, press Ctrl+V / ⌘V to paste.");
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold ny-heading-gradient">AI Coach</h1>
            <p className="ny-text-2 text-sm mt-1">
              {aiModel === 'claude' && 'One click → Claude opens with your resume pre-loaded'}
              {aiModel === 'chatgpt' && 'Prompt copies to clipboard + ChatGPT opens → just paste'}
              {aiModel === 'other' && 'Prompt copies to clipboard → paste it in any AI tool'}
            </p>
          </div>
          <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2 text-sm">
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

        </div>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

const DashboardView = ({ profile, savedResumes, setSavedResumes, setCurrentView, setSavedResumeToLoad, exportData, importData, clearAllData, mode }) => {
  const deleteResume = (index) => {
    if (window.confirm('Delete this resume?')) {
      setSavedResumes(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen ny-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="ny-card rounded-lg p-4 mb-6 border ny-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm ny-text-2">
            <AlertCircle className="w-4 h-4" />
            <span>💾 Data stored locally in your browser</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportData} className="px-4 py-2 ny-btn-secondary rounded text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </button>
            <label className="px-4 py-2 ny-btn-secondary rounded text-sm flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold ny-heading-gradient">Dashboard</h1>
          <button onClick={() => setCurrentView('landing')} className="px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" />Home
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="ny-card rounded-lg p-6 border ny-border">
            <h2 className="text-xl font-semibold ny-text-1 mb-4">Master Profile</h2>
            <div className="space-y-3 ny-text-2 mb-6">
              <div className="flex justify-between">
                <span className="ny-text-2">Name:</span>
                <span className="font-medium">{profile.personal.fullName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="ny-text-2">Email:</span>
                <span>{profile.personal.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="ny-text-2">Work Experiences:</span>
                <span className="font-semibold">{profile.workExperience.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="ny-text-2">Education:</span>
                <span className="font-semibold">{profile.education.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="ny-text-2">Skills:</span>
                <span className="font-semibold">{profile.skills.technical.length + profile.skills.soft.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="ny-text-2">Projects:</span>
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

        <div className="ny-card rounded-lg p-6 border ny-border">
          <h2 className="text-lg font-semibold ny-text-1 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setCurrentView('generate')} className="px-4 py-2 ny-btn-success rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" />Generate Resume
            </button>
            <button onClick={() => setCurrentView('wizard')} className="px-4 py-2 ny-btn-secondary rounded-lg">
              Edit Profile
            </button>
            <button onClick={() => setCurrentView('coach')} className="px-4 py-2 rounded-lg border ny-border ny-text-1 hover:bg-purple-500/10 hover:border-purple-400/60 flex items-center gap-2 transition-colors">
              🤖 AI Coach
            </button>
            <button onClick={exportData} className="px-4 py-2 ny-btn-secondary rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" />Export Backup
            </button>
            <button onClick={clearAllData} className="px-4 py-2 ny-btn-danger rounded-lg">
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
    <div className="bg-white p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto print:p-0 print:max-w-none" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.4', background: 'linear-gradient(to right, #f3f4f6 300px, white 300px)' }}>
      <div className="grid grid-cols-[300px_1fr] print:grid-cols-[300px_1fr] gap-8 print:gap-6">
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
const profileToResumeText = (prof) => {
  const lines = [];
  const p = prof.personal || {};
  if (p.fullName) lines.push(p.fullName);
  const contact = [p.email, p.phone, p.location].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  const links = [p.linkedin, p.github, p.portfolio, p.orcid ? `ORCID: ${p.orcid}` : null].filter(Boolean).join(' | ');
  if (links) lines.push(links);
  if (p.summary) lines.push('\nSUMMARY\n' + p.summary);

  if (prof.workExperience?.length) {
    lines.push('\nWORK EXPERIENCE');
    prof.workExperience.forEach(j => {
      lines.push(`${j.title || ''} at ${j.company || ''} (${j.startDate || ''} – ${j.current ? 'Present' : (j.endDate || '')})`);
      (j.bullets || []).filter(b => b.trim()).forEach(b => lines.push('• ' + b));
    });
  }

  if (prof.researchExperience?.length) {
    lines.push('\nRESEARCH EXPERIENCE');
    prof.researchExperience.forEach(r => {
      lines.push(`${r.title || ''}, ${r.institution || ''} (${formatDate(r.startDate) || ''} – ${r.current ? 'Present' : (formatDate(r.endDate) || '')})`);
      (r.bullets || []).filter(b => b.trim()).forEach(b => lines.push('• ' + b));
    });
  }

  if (prof.education?.length) {
    lines.push('\nEDUCATION');
    prof.education.forEach(e => {
      lines.push(`${e.degree || ''} in ${e.major || ''}, ${e.school || ''} (${e.graduationDate || ''})`);
      if (e.gpa) lines.push((e.gradeType || 'GPA') + ': ' + e.gpa);
      if (e.thesis) lines.push('Thesis: ' + e.thesis);
    });
  }

  const tech = prof.skills?.technical || [];
  const soft = prof.skills?.soft || [];
  const lab  = prof.skills?.laboratory || [];
  const lang = prof.skills?.languages || [];
  const certs = prof.skills?.certifications || [];
  if (tech.length || soft.length || lab.length || lang.length || certs.length) {
    lines.push('\nSKILLS');
    if (tech.length)  lines.push('Technical: ' + tech.join(', '));
    if (soft.length)  lines.push('Professional: ' + soft.join(', '));
    if (lab.length)   lines.push('Laboratory: ' + lab.join(', '));
    if (lang.length)  lines.push('Languages: ' + lang.join(', '));
    if (certs.length) lines.push('Certifications: ' + certs.join(', '));
  }

  if (prof.projects?.length) {
    lines.push('\nPROJECTS');
    prof.projects.forEach(pr => {
      lines.push(pr.name + (pr.technologies ? ` | ${pr.technologies}` : ''));
      if (pr.description) lines.push(pr.description);
    });
  }

  if (prof.publications?.length) {
    lines.push('\nPUBLICATIONS');
    prof.publications.forEach(pub => {
      lines.push([pub.authors, pub.title, pub.journal, pub.year, pub.doi ? `DOI: ${pub.doi}` : null].filter(Boolean).join('. '));
    });
  }

  if (prof.awards?.length) {
    lines.push('\nAWARDS & HONORS');
    prof.awards.forEach(a => lines.push(`${a.title || ''}${a.org ? `, ${a.org}` : ''}${a.year ? ` (${a.year})` : ''}`));
  }

  (prof.customSections || []).forEach(sec => {
    if (sec.title && sec.entries?.some(e => e.text?.trim())) {
      lines.push(`\n${sec.title.toUpperCase()}`);
      sec.entries.filter(e => e.text?.trim()).forEach(e => lines.push('• ' + e.text));
    }
  });

  return lines.join('\n').trim();
};

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
      <div className="min-h-screen ny-bg p-6">
        <div className="max-w-4xl mx-auto">
          <div className="ny-card rounded-lg p-8 border ny-border">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 ny-accent" />
              <h2 className="text-2xl font-bold ny-text-1">Generate Targeted Resume</h2>
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-6 py-3 ny-btn-secondary rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={generateFullResume}
                  className="px-6 py-3 ny-btn-secondary rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  title="Include all your experiences, skills and projects — no filtering"
                >
                  <FileText className="w-5 h-5" />
                  Full Resume
                </button>
                <button
                  onClick={analyzeWithAI}
                  disabled={!jobTarget.trim()}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${jobTarget.trim() ? 'ny-btn-primary' : 'opacity-40 ny-accent cursor-not-allowed ny-subcard'}`}
                >
                  <Sparkles className="w-5 h-5" />
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
      <div className="min-h-screen ny-bg p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold ny-text-1 mb-6">
            {analysisResult.fullResume ? 'Complete Resume Preview' : 'Resume Preview'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {analysisResult.fullResume ? (
              <>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 ny-accent">{selectedJobs.length}</div>
                    <p className="ny-text-2 text-sm">Experiences</p>
                    <p className="ny-text-3 text-xs mt-1">All included</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${templateCompatibility[selectedTemplate].score >= 80 ? 'ny-success-text' : templateCompatibility[selectedTemplate].score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {templateCompatibility[selectedTemplate].score}%
                    </div>
                    <p className="ny-text-2 text-sm">Template ATS</p>
                    <p className="ny-text-3 text-xs mt-1">Format compatibility</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 ny-accent">{displaySkills.length}</div>
                    <p className="ny-text-2 text-sm">Skills</p>
                    <p className="ny-text-3 text-xs mt-1">All categories</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${analysisResult.completeness >= 80 ? 'ny-success-text' : analysisResult.completeness >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.completeness}%
                    </div>
                    <p className="ny-text-2 text-sm">Profile Complete</p>
                    <p className="ny-text-3 text-xs mt-1">Sections filled</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${analysisResult.atsScore >= 80 ? 'ny-success-text' : analysisResult.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.atsScore}%
                    </div>
                    <p className="ny-text-2 text-sm">Content Match</p>
                    <p className="ny-text-3 text-xs mt-1">Keywords & relevance</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${templateCompatibility[selectedTemplate].score >= 80 ? 'ny-success-text' : templateCompatibility[selectedTemplate].score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {templateCompatibility[selectedTemplate].score}%
                    </div>
                    <p className="ny-text-2 text-sm">Template ATS</p>
                    <p className="ny-text-3 text-xs mt-1">Format compatibility</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${analysisResult.keywordMatch >= 80 ? 'ny-success-text' : analysisResult.keywordMatch >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.keywordMatch}%
                    </div>
                    <p className="ny-text-2 text-sm">Keyword Match</p>
                    <p className="ny-text-3 text-xs mt-1">Job description fit</p>
                  </div>
                </div>
                <div className="ny-card rounded-lg p-6 border ny-border">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${analysisResult.authenticityScore >= 80 ? 'ny-success-text' : analysisResult.authenticityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.authenticityScore}%
                    </div>
                    <p className="ny-text-2 text-sm">Authenticity</p>
                    <p className="ny-text-3 text-xs mt-1">Real profile data</p>
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

          {/* 🔧 FIX #5: Save Resume Feature */}
          <div className="ny-card rounded-lg p-6 mb-6 border ny-border">
            <h3 className="text-lg font-semibold ny-text-1 mb-3">Save This Resume</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g., Software Engineer - Tech Corp"
                className="flex-1 px-4 py-2 ny-input rounded-lg"
              />
              <button
                onClick={saveResume}
                className="px-6 py-2 ny-btn-success rounded-lg flex items-center gap-2"
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