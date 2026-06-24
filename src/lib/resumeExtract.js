// Resume text extraction + light parsing helpers.
// No API key required: text extraction is client-side (pdfjs / mammoth),
// contact fields are regex, and the heavy structuring is delegated to the
// user's own Claude/ChatGPT via a copy-paste prompt (see buildResumeParsePrompt).

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Extraction ───────────────────────────────────────────────────────────────
export async function extractTextFromFile(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isDocx = /\.docx?$/i.test(file.name) ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const arrayBuffer = await file.arrayBuffer();

  if (isPdf) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(' ') + '\n';
    }
    return text.replace(/[ \t]+/g, ' ').trim();
  }

  if (isDocx) {
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return (value || '').trim();
  }

  throw new Error('Unsupported file type. Upload a PDF or DOCX.');
}

// ── Regex contact fields (no AI) ──────────────────────────────────────────────
export function extractContactFields(text) {
  const grab = (re) => {
    const m = text.match(re);
    return m ? m[0].trim() : '';
  };

  const email = grab(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const phone = grab(/(\+?\d[\d\s().-]{7,}\d)/);
  const linkedin = grab(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i);
  const github = grab(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)]+/i);

  // First URL that isn't linkedin/github = likely portfolio
  const urls = text.match(/https?:\/\/[^\s)]+/gi) || [];
  const portfolio = urls.find((u) => !/linkedin\.com|github\.com/i.test(u)) || '';

  const fields = {};
  if (email) fields.email = email;
  if (phone) fields.phone = phone;
  if (linkedin) fields.linkedin = linkedin;
  if (github) fields.github = github;
  if (portfolio) fields.portfolio = portfolio;
  return fields;
}

// ── Parse prompt for the user's own AI (no key needed) ────────────────────────
export function buildResumeParsePrompt(text) {
  return `You are a resume parsing expert. Extract structured data from the resume text below and return ONLY valid JSON — no markdown, no backticks, no commentary.

RESUME TEXT:
${text.slice(0, 8000)}

Return ONLY this exact JSON shape:
{
  "personal": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "github": "", "summary": "" },
  "workExperience": [ { "title": "", "company": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "bullets": ["", ""] } ],
  "education": [ { "degree": "", "major": "", "school": "", "location": "", "graduationDate": "YYYY-MM", "gpa": "" } ],
  "skills": { "technical": [], "soft": [], "certifications": [], "languages": [] },
  "projects": [ { "name": "", "description": "", "technologies": "", "link": "" } ],
  "additional": { "volunteer": "", "awards": "", "publications": "" }
}

RULES:
1. Extract everything you can find; use "" or [] for anything missing.
2. Dates as YYYY-MM. If a job is current, set "current": true and "endDate": "".
3. Separate technical vs soft skills.
4. Keep complete bullet points for each role.
5. Output ONLY the JSON object.`;
}

// ── Safe parse of the JSON the user pastes back ───────────────────────────────
export function safeParseResumeJSON(raw) {
  if (!raw || !raw.trim()) return { ok: false, error: 'Nothing pasted yet.' };

  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) return { ok: false, error: 'No JSON object found in the pasted text.' };
  cleaned = cleaned.slice(first, last + 1);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return { ok: false, error: `Could not parse JSON: ${e.message}` };
  }

  const stamp = Date.now();
  const withIds = (arr, offset) =>
    Array.isArray(arr) ? arr.map((item, i) => ({ ...item, id: stamp + offset + i })) : [];

  const data = {
    personal: parsed.personal || {},
    workExperience: withIds(parsed.workExperience, 0).map((j) => ({
      ...j,
      bullets: Array.isArray(j.bullets) ? j.bullets : [j.bullets || ''].filter(Boolean),
    })),
    education: withIds(parsed.education, 1000),
    projects: withIds(parsed.projects, 2000),
    skills: {
      technical: parsed.skills?.technical || [],
      soft: parsed.skills?.soft || [],
      certifications: parsed.skills?.certifications || [],
      languages: parsed.skills?.languages || [],
    },
    additional: parsed.additional || {},
  };

  return { ok: true, data };
}
