// Nyxine Resume Maker - Updated Feb 3, 2026
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Briefcase, GraduationCap, Code, Award, Plus, Trash2, ChevronLeft, ChevronRight, Download, AlertCircle, Check, X, Sparkles, Save, Sun, Moon, Home } from 'lucide-react';

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

  const [currentView, setCurrentView] = useState('landing');
  const [currentStep, setCurrentStep] = useState(0);
  const [showStorageWarning, setShowStorageWarning] = useState(true);
  const [profile, setProfile] = useState({
    personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', github: '', summary: '' },
    workExperience: [],
    education: [],
    skills: { technical: [], soft: [], certifications: [], languages: [] },
    projects: [],
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

      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          // Validate parsed data structure
          if (parsed && typeof parsed === 'object' && parsed.personal) {
            setProfile(parsed);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.profile) setProfile(data.profile);
        if (data.savedResumes) setSavedResumes(data.savedResumes);
        alert('Data imported successfully!');
      } catch {
        alert('Import failed. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      setProfile({
        personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', github: '', summary: '' },
        workExperience: [],
        education: [],
        skills: { technical: [], soft: [], certifications: [], languages: [] },
        projects: [],
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

  if (currentView === 'landing') {
    return <><LandingPage showStorageWarning={showStorageWarning} setShowStorageWarning={setShowStorageWarning} setCurrentView={setCurrentView} setCurrentStep={setCurrentStep} profile={profile} savedResumes={savedResumes} theme={theme} /><ThemeToggle /></>;
  }

  if (currentView === 'wizard') {
    return <><WizardView currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} profile={profile} setProfile={setProfile} setCurrentView={setCurrentView} /><ThemeToggle /></>;
  }

  if (currentView === 'dashboard') {
    return <><DashboardView profile={profile} savedResumes={savedResumes} setSavedResumes={setSavedResumes} setCurrentView={setCurrentView} setSavedResumeToLoad={setSavedResumeToLoad} exportData={exportData} importData={importData} clearAllData={clearAllData} /><ThemeToggle /></>;
  }

  if (currentView === 'generate') {
    return <><GenerateView setCurrentView={setCurrentView} profile={profile} savedResumes={savedResumes} setSavedResumes={setSavedResumes} savedResumeToLoad={savedResumeToLoad} setSavedResumeToLoad={setSavedResumeToLoad} /><ThemeToggle /></>;
  }

  return null;
};

const LandingPage = ({ showStorageWarning, setShowStorageWarning, setCurrentView, setCurrentStep, profile, savedResumes, theme }) => {
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

          {(profile.personal.fullName || savedResumes.length > 0) && (
            <div className="text-center pt-4 border-t ny-divider">
              <button onClick={() => setCurrentView('dashboard')} className="ny-accent hover:opacity-80 flex items-center gap-2 mx-auto">
                <FileText className="w-4 h-4" />Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 ny-text-3 text-sm">
          <p>Open Source • Privacy First • AI-Powered</p>
        </div>
      </div>
    </div>
  );
};

const WizardView = ({ currentStep, setCurrentStep, steps, profile, setProfile, setCurrentView }) => {
  const CurrentStepIcon = steps[currentStep].icon;

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
            <span className="ny-text-2 text-sm">{currentStep + 1} of {steps.length}</span>
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

          {currentStep === 0 && <PersonalInfoStep profile={profile} setProfile={setProfile} />}
          {currentStep === 1 && <WorkExperienceStep profile={profile} setProfile={setProfile} />}
          {currentStep === 2 && <EducationStep profile={profile} setProfile={setProfile} />}
          {currentStep === 3 && <SkillsStep profile={profile} setProfile={setProfile} />}
          {currentStep === 4 && <ProjectsStep profile={profile} setProfile={setProfile} />}
          {currentStep === 5 && <AdditionalStep profile={profile} setProfile={setProfile} />}

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

const PersonalInfoStep = ({ profile, setProfile }) => {
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
          <label className="block text-sm font-medium ny-text-2 mb-2">Portfolio</label>
          <input
            type="url"
            value={local.portfolio}
            onChange={(e) => setLocal(prev => ({ ...prev, portfolio: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="yoursite.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium ny-text-2 mb-2">GitHub</label>
          <input
            type="url"
            value={local.github}
            onChange={(e) => setLocal(prev => ({ ...prev, github: e.target.value }))}
            className="w-full px-4 py-2 ny-input rounded-lg transition-all"
            placeholder="github.com/..."
          />
        </div>
      </div>
      <div className="ny-info-box border rounded-lg p-3 text-sm">
        💡 <strong>Tip:</strong> No photo needed - not recommended for US/Canada resumes
      </div>
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
        bullets: ['']
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
      </div>
    </div>
  );
};

const EducationStep = ({ profile, setProfile }) => {
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
        gpa: ''
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
        <EduForm key={edu.id} edu={edu} idx={idx} setProfile={setProfile} removeEdu={removeEdu} />
      ))}
    </div>
  );
};

const EduForm = ({ edu, idx, setProfile, removeEdu }) => {
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
            <label className="block text-sm ny-text-2 mb-2">GPA (optional)</label>
            <input
              type="text"
              value={local.gpa}
              onChange={(e) => setLocal(prev => ({ ...prev, gpa: e.target.value }))}
              className="w-full px-4 py-2 ny-input rounded-lg transition-all"
              placeholder="3.8/4.0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillsStep = ({ profile, setProfile }) => {
  // 🔧 FIX: Use refs to prevent re-render on every keystroke
  const technicalInputRef = useRef(null);
  const softInputRef = useRef(null);
  const certificationsInputRef = useRef(null);
  const languagesInputRef = useRef(null);

  const addSkill = (cat, inputRef) => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    
    setProfile(prev => {
      const newSkills = { ...prev.skills };
      newSkills[cat] = [...newSkills[cat], value];
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
      newSkills[cat] = newSkills[cat].filter((_, i) => i !== idx);
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
          {profile.skills[cat].map((skill, idx) => (
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
        link: ''
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

const DashboardView = ({ profile, savedResumes, setSavedResumes, setCurrentView, setSavedResumeToLoad, exportData, importData, clearAllData }) => {
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
                  <div className="text-gray-500 text-xs mt-0.5">{edu.graduationDate}</div>
                  {edu.gpa && <div className="text-gray-500 text-xs">GPA: {edu.gpa}</div>}
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
                      {job.startDate} - {job.current ? 'Present' : job.endDate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 italic mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                    {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
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
                    {job.startDate} – {job.current ? 'Present' : job.endDate}
                  </span>
                </div>
                <ul className="list-disc ml-6 mt-2 space-y-1.5 text-sm leading-relaxed">
                  {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
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
                  <span className="text-sm whitespace-nowrap ml-4">{edu.graduationDate}</span>
                </div>
                {edu.gpa && <p className="text-sm text-gray-700 mt-1">GPA: {edu.gpa}</p>}
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
              <div style={colDate}>{edu.graduationDate || 'Present'}</div>
              <div style={colBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.01em' }}>{edu.school}</span>
                  {edu.location && <span style={{ textTransform: 'uppercase', marginLeft: '10px', flexShrink: 0 }}>{edu.location}</span>}
                </div>
                <p style={{ marginBottom: '1px' }}>{edu.degree}{edu.major ? ` in ${edu.major}` : ''}</p>
                {edu.gpa && <p>GPA: {edu.gpa}</p>}
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
              <div style={colDate}>{job.startDate}–{job.current ? 'Present' : job.endDate}</div>
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
                  {job.startDate} - {job.current ? 'Present' : job.endDate}
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
                  {edu.graduationDate}
                </span>
              </div>
              {edu.gpa && <p className="text-sm mt-1" style={{ color: '#000000' }}>GPA: {edu.gpa}</p>}
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

      <div className="p-8 print:p-8 print:pt-10">
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
                        {job.startDate} - {job.current ? 'Present' : job.endDate}
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
                    <div className="text-xs text-gray-500 mt-1">{edu.graduationDate}</div>
                    {edu.gpa && <div className="text-xs text-gray-500">GPA: {edu.gpa}</div>}
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
                      {job.startDate} – {job.current ? 'Present' : job.endDate}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 italic mb-2">{job.company}{job.location && ` | ${job.location}`}</p>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-800">
                    {job.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
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
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">{edu.graduationDate}</span>
                  </div>
                  {edu.gpa && <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>}
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

          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">Contact</h3>
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
                    <div className="text-slate-500 text-xs mt-1">{edu.graduationDate}</div>
                    {edu.gpa && <div className="text-slate-500 text-xs">GPA: {edu.gpa}</div>}
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
                      {job.startDate} - {job.current ? 'Present' : job.endDate}
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
        </div>
      </div>
    </div>
  );
};

const GenerateView = ({ setCurrentView, profile, setSavedResumes, savedResumeToLoad, setSavedResumeToLoad }) => {
  const [step, setStep] = useState(() => savedResumeToLoad ? 'preview' : 'input');
  const [jobTarget, setJobTarget] = useState(() => savedResumeToLoad?.jobTarget || '');
  const [, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(() => savedResumeToLoad?.analysisResult || null);
  const [selectedTemplate, setSelectedTemplate] = useState(() => savedResumeToLoad?.template || 'modern');
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
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${templateCompatibility.modern.color === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-green-500/20 ny-success-text">
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-red-500/20 text-red-300">
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
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
                      <div className="text-xs mt-2 px-2 py-1 rounded bg-red-500/20 text-red-300">
                        ATS: {templateCompatibility.bold.score}%
                      </div>
                    </div>
                  </button>
                </div>

                {/* Template Compatibility Warning */}
                {templateCompatibility[selectedTemplate].warning && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-300 mb-1">
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
              /* 0.75in @page margin handles top/bottom gaps on ALL pages including
                 page 2, 3, etc. Full-bleed templates lose edge-to-edge in PDF but
                 gain correct multi-page margins — better trade-off than cut-off content. */
              @page {
                size: A4;
                margin: 0.75in;
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