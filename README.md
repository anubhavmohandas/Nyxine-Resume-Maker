# NYXINE Resume Builder

**Smart, privacy-first resume generation for industry professionals and academic researchers.**

NYXINE is a fully local, no-account resume builder that lets you maintain one master profile and generate targeted resumes for specific roles. All data stays in your browser — nothing is ever sent to a server.

---

## ✨ What Makes NYXINE Different?

- **Build Once, Generate Many** — Enter your complete history once, instantly generate targeted resumes per job
- **Industry & Academic Modes** — Two distinct workflows: standard industry wizard or full academic CV mode with research-specific fields
- **AI Coaching Panel** — One-click prompts that open Claude with your resume pre-loaded for brutally honest feedback, ATS gap analysis, bullet rewrites, and more
- **Fully Customizable** — Add custom fields inside any entry and create entirely new named sections (Patents, Grants, Clinical Rotations, etc.)
- **8 Professional Templates** — From ATS-optimized plain text to academic CV format
- **Privacy First** — 100% localStorage, no sign-up, no tracking, no external API calls for core features

---

## 🚀 Key Features

### Industry / Academic Mode Toggle
Switch between two tailored wizards at any time via the pill toggle on the landing page and wizard header.

**Industry mode** — 7-step wizard covering personal info, work experience, education, skills, projects, additional info, and custom sections.

**Academic mode** — 9-step wizard with dedicated steps for research experience, publications, presentations, awards, and leadership/activities, plus academic-specific fields throughout:
- ORCID iD and ResearchGate profile
- Thesis title and relevant coursework per education entry
- Laboratory skills and research interests
- Publication type, DOI, journal, and authors
- Presentation type (poster, oral, invited) and conference details

---

### Two-Level Customization

**Level 1 — Custom fields within entries**
Every form card (Work Experience, Education, Research Experience, Publications, Presentations, Awards, Activities, Projects) has an **+ Add Field** button. Add any label + value pair — Patent #, Grant ID, Exchange Program, Score, Certificate number, etc. These render inline inside the entry in all resume templates.

**Level 2 — Custom sections**
A dedicated **Custom Sections** step (last step in both modes) lets you create entirely new named sections with free-text bullet entries. Examples: Patents, Grants, Clinical Rotations, Conferences Organized, Invited Talks, Volunteer Work. These appear as full-weight sections at the bottom of every template.

---

### AI Coaching Panel
Located in the **Generate Resume** view, below the template selector. Five prompts that open Claude.ai in a new tab with your resume already baked into the prompt — no copy-pasting needed.

| Prompt | What it does |
|--------|-------------|
| 🔥 **Brutal Review** | Hiring manager persona — flags every weakness, gap, and instant-reject trigger |
| ⚡ **Bullet Transformer** | Rewrites every bullet using Action Verb + Task + Measurable Result; asks questions to find missing numbers |
| ✨ **Final Polish** | Kills clichés ("team player", "passionate"), fixes tense inconsistency, replaces generic language |
| 🎯 **ATS Optimizer** | Paste a job description → Claude identifies missing keywords and suggests exact bullet rewrites to pass ATS |
| 🎨 **Tone Match** | Enter target companies → Claude rewrites your summary and skills to match their voice and culture |

---

### Smart Keyword Matching
Paste a job title or full description in the Generate view. The local matching algorithm scores each of your work experiences by keyword overlap, title relevance, and recency — then selects the most relevant subset for the generated resume. No API call required.

---

### 8 Resume Templates

| Template | Best For | ATS Score |
|----------|----------|-----------|
| **ATS-Optimized** | Online applications, applicant tracking systems | 95% |
| **Academic CV** | Research roles, faculty positions, grant applications | 95% |
| **Harvard** | Business, consulting, traditional industries | 70% |
| **Classic** | Finance, law, conservative industries | 75% |
| **Modern** | Tech, startups (direct email submissions) | 40% |
| **Professional** | Corporate roles, human-reviewed applications | 55% |
| **Creative** | Portfolio submissions, direct outreach | 20% |
| **Bold** | Portfolio sites, design roles | 15% |

Academic CV template defaults when Academic mode is active. Renders: ORCID in header, thesis/coursework in education, bulleted research experience, formatted publications with DOI, presentations, awards, activities, and skills/interests.

---

### Resume Management
- Save unlimited named resume versions per job application
- Each saved resume stores template choice, job target, and AI match analysis
- Export your full profile as JSON backup
- Import from a previous backup to restore all data
- One-click clear for complete data removal

---

## 💡 How It Works

1. **Choose your mode** — Industry (standard) or Academic (research-focused) via the toggle on the landing screen

2. **Build your master profile** — Complete the step-by-step wizard once with your full history. Use custom fields for anything the standard form doesn't cover.

3. **Generate targeted resumes** — Go to Generate, paste a job description, pick a template, and let the keyword matcher select your most relevant experiences

4. **Refine with AI** — Use the AI Coaching panel to open Claude with your resume pre-loaded. Iterate on feedback, update your profile, regenerate.

5. **Download as PDF** — Use the browser's Print → Save as PDF function from the resume preview

---

## 🔒 Privacy & Data

- **100% Local Storage** — Your data never leaves your browser
- **No account required** — Start immediately, no email or sign-up
- **No external API** — Core features (wizard, templates, keyword matching) work entirely offline
- **AI Coaching** — Opens Claude.ai in a new tab; your resume text is passed via URL parameter. Anthropic's standard privacy policy applies.
- **Export anytime** — Download your full profile as a JSON backup
- **Clear all data** — One-click removal via the dashboard

> ⚠️ Clearing browser cache/localStorage will delete your profile. Export backups regularly.

---

## 🔧 Tech Stack

- **React 19** with hooks
- **Vite** build tooling
- **Tailwind CSS** utility-first styling
- **localStorage** for persistence (no backend, no database)
- **lucide-react** icons

---

## 🛠️ Running Locally

```bash
git clone <repo>
cd nyxine-resume-maker
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚡ Quick Tips

- **Add everything to your master profile** — the keyword matcher filters down per job, so more data = better matches
- **Use custom fields** for niche credentials that don't fit standard forms (exchange programs, patent numbers, grant IDs)
- **Use custom sections** for entire categories the app doesn't cover (Patents, Clinical Rotations, Fellowships)
- **Run the Brutal Review** before submitting anywhere — catches weak bullet points and missing keywords consistently
- **ATS-Optimized template** for any online application portal; save visual templates for direct email/portfolio submissions
- **Export a JSON backup** before clearing browser data or switching devices

---

## 🎓 Academic Users — Specific Tips

- Fill ORCID and ResearchGate in the Personal Info step (Academic mode)
- Add thesis title and relevant coursework inside each education entry via the dedicated fields
- Use the Publications step for peer-reviewed work; set the DOI field — it renders in the Academic CV template
- Use Custom Sections for Grants, Patents, Invited Reviews, Conference Organization, or anything discipline-specific
- The Academic CV template uses Times New Roman single-column format — standard for most research fields

---

## 📄 License

Open-source. Use, modify, and share freely.

Built with React, Vite, Tailwind CSS. AI Coaching powered by Claude (Anthropic).

---
- **Created with ❤️**