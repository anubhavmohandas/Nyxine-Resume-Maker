# NYXINE Resume Builder

**A privacy-first resume builder for industry professionals and academic researchers — runs entirely in your browser.**

Keep one master profile, generate targeted resumes per role, and start either from scratch or by uploading an existing PDF/DOCX to auto-fill. No account, no backend, no tracking. Your profile lives in your browser; nothing leaves it unless you choose to send a prompt to your own AI.

---

## ✨ What Makes NYXINE Different?

- **Build Once, Generate Many** — Enter your complete history once, instantly generate targeted resumes per job
- **Upload to Auto-fill** — Drop in an existing PDF or DOCX; text is extracted on-device, contact details auto-fill, and the rest is structured by your own AI (no key needed)
- **Industry & Academic Modes** — Two distinct workflows: standard industry wizard or full academic CV mode with research-specific fields
- **24 AI Coaching Prompts** — Grouped into Resume Review, ATS & Targeting, LinkedIn, Outreach, Strategy & Prep, a LinkedIn Deep Audit, and a dedicated Internship Toolkit — each opens Claude/ChatGPT with your resume already loaded
- **Fully Customizable** — Add custom fields inside any entry and create entirely new named sections (Patents, Grants, Clinical Rotations, etc.)
- **8 Professional Templates** — From ATS-optimized plain text to academic CV format
- **Privacy First** — 100% localStorage, no sign-up, no tracking, no API key required

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

### AI Coach
A dedicated **AI Coach** view with 24 one-click prompts, grouped by what you're actually trying to do. Each builds a prompt with your resume already baked in and opens it in Claude or ChatGPT — or just copies it to your clipboard. No API key, and no pasting your resume in by hand.

| Category | What's inside |
|----------|---------------|
| **Resume Review** | 6-second recruiter filter, bullet & impact rewriter, final polish, tone-match to target companies |
| **ATS & Targeting** | ATS deep scan against a job description, role-alignment dual pass |
| **LinkedIn & Brand** | Headline/About/skills optimizer, plus a 5-prompt deep audit of your whole profile |
| **Outreach** | Cover letter, cold DM, follow-up email |
| **Strategy & Prep** | 7-day job-hunt blueprint, interview question predictor |
| **🎓 Internship Toolkit** | 7 internship-specific prompts: ATS resume, LinkedIn, 7-day hunt blueprint, cover letter, cold DM, interview predictor, application tracker |

---

### Upload Resume → Auto-fill
Already have a resume? Upload a **PDF or DOCX** and Nyxine extracts the text in your browser — nothing is uploaded to a server. It auto-fills contact details (email, phone, LinkedIn, GitHub) by pattern-matching, then hands the heavier structuring to your own Claude/ChatGPT: it opens with a parse prompt, you paste the JSON back, and the wizard fills in. No API key required, consistent with the rest of the app.

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

2. **Build your master profile** — Complete the step-by-step wizard once with your full history, or **upload an existing PDF/DOCX** to auto-fill and edit from there. Use custom fields for anything the standard form doesn't cover.

3. **Generate targeted resumes** — Go to Generate, paste a job description, pick a template, and let the keyword matcher select your most relevant experiences

4. **Refine with AI** — Use the AI Coaching panel to open Claude with your resume pre-loaded. Iterate on feedback, update your profile, regenerate.

5. **Download as PDF** — Use the browser's Print → Save as PDF function from the resume preview

---

## 🔒 Privacy & Data

- **100% Local Storage** — Your data never leaves your browser
- **No account required** — Start immediately, no email or sign-up
- **No external API** — Core features (wizard, templates, keyword matching) work entirely offline
- **Resume upload** — PDF/DOCX text extraction runs in your browser (pdfjs + mammoth). Structuring uses your own Claude/ChatGPT, so no key is stored and your resume is never sent to Nyxine
- **AI Coaching** — Opens Claude.ai/ChatGPT in a new tab; your resume text is passed via the prompt. The provider's standard privacy policy applies.
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

## 👋 From the maker

I built Nyxine because re-tailoring the same resume by hand for every application got old fast — and most tools that fix that want an account, a subscription, and your data on their servers. This one doesn't. It's free, it runs on your machine, and your profile never leaves your browser unless you send it to your own AI. If it saves you an afternoon, that's the whole point.

— Anubhav

---

## 📄 License

Open-source. Use, modify, and share freely.

Built with React 19, Vite, and Tailwind. Resume parsing via pdfjs + mammoth. AI coaching runs on your own Claude or ChatGPT.

---

Built by [Anubhav Mohandas](https://github.com/anubhavmohandas).