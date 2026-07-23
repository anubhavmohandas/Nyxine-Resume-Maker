// Real OOXML .docx generation (client-side, browser-safe via docx's Packer.toBlob).
//
// Replaces the old approach of writing an HTML string, naming it "*.doc", and
// lying about the MIME type (application/msword). That trick only renders
// correctly in Microsoft Word itself, which specifically sniffs for it — Pages,
// Preview, Google Docs, and LibreOffice generally fail to open it or show a
// blank document. This module builds an actual Word document structure instead,
// so the exported file works in any DOCX-compatible app.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { formatDate } from './dates';

const clean = (s) => String(s ?? '').trim();
const stripProtocol = (u) => clean(u).replace(/^https?:\/\//i, '');
const withProtocol = (u) => (/^https?:\/\//i.test(u) ? u : `https://${clean(u)}`);

// The stored shape of `technologies` isn't guaranteed — AI-imported profiles
// can hand back an array instead of the comma string the wizard's text input
// produces. Export code doesn't get the JSX forgiveness the templates get
// (React silently concatenates array children with no separator); here we
// normalize explicitly instead of trusting the shape, and also fix the
// no-space-after-comma artifact that shows up when a stored array gets
// joined with Array.prototype.join(',').
export const formatTechnologies = (t) => {
  if (Array.isArray(t)) return t.map(clean).filter(Boolean).join(', ');
  if (typeof t === 'string') return t.split(',').map(clean).filter(Boolean).join(', ');
  return '';
};

const linkRun = (url, text) =>
  new ExternalHyperlink({
    link: withProtocol(url),
    children: [new TextRun({ text, style: 'Hyperlink' })],
  });

const sectionHeading = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: { bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 4 } },
    children: [new TextRun({ text: String(text || '').toUpperCase(), bold: true })],
  });

const dateRange = (start, end, current) =>
  `${formatDate(start)} – ${current ? 'Present' : formatDate(end)}`;

// Shared renderer for role-style entries (work + research). Both carry a
// title, an org, a date range, and achievement bullets — only the org field
// name differs (company vs institution), which the caller resolves.
const pushRoleEntries = (children, entries, orgKey) => {
  entries.filter(Boolean).forEach((e) => {
    const roleLine = [clean(e.title), e[orgKey] ? `— ${clean(e[orgKey])}` : ''].filter(Boolean).join(' ');
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 20 },
        children: [
          new TextRun({ text: roleLine, bold: true }),
          new TextRun({ text: `    ${dateRange(e.startDate, e.endDate, e.current)}`, italics: true, color: '555555' }),
        ],
      })
    );
    (e.bullets || [])
      .filter((b) => b && b.trim())
      .forEach((b) => {
        children.push(new Paragraph({ text: clean(b), bullet: { level: 0 } }));
      });
  });
};

export async function buildResumeDocxBlob({
  personal,
  selectedJobs,
  education,
  skills,
  projects,
  researchExperience = [],
  publications = [],
  presentations = [],
  awards = [],
  activities = [],
  customSections = [],
}) {
  const p = personal || {};
  const children = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [new TextRun({ text: clean(p.fullName) || 'Resume', bold: true })],
    })
  );

  const contactRuns = [];
  const pushContact = (text, url) => {
    if (!text) return;
    if (contactRuns.length) contactRuns.push(new TextRun({ text: '   |   ' }));
    contactRuns.push(url ? linkRun(url, text) : new TextRun({ text }));
  };
  pushContact(clean(p.email));
  pushContact(clean(p.phone));
  pushContact(clean(p.location));
  if (p.linkedin) pushContact(stripProtocol(p.linkedin), p.linkedin);
  if (p.github) pushContact(stripProtocol(p.github), p.github);
  if (p.portfolio) pushContact(stripProtocol(p.portfolio), p.portfolio);
  if (p.researchgate) pushContact(stripProtocol(p.researchgate), p.researchgate);
  if (p.orcid) pushContact(`ORCID: ${clean(p.orcid)}`);
  if (contactRuns.length) {
    children.push(new Paragraph({ children: contactRuns, spacing: { after: 200 } }));
  }

  if (p.summary) {
    children.push(sectionHeading('Summary'));
    children.push(new Paragraph({ text: clean(p.summary), spacing: { after: 120 } }));
  }

  const jobs = (selectedJobs || []).filter(Boolean);
  if (jobs.length) {
    children.push(sectionHeading('Experience'));
    pushRoleEntries(children, jobs, 'company');
  }

  const research = (researchExperience || []).filter(Boolean);
  if (research.length) {
    children.push(sectionHeading('Research Experience'));
    pushRoleEntries(children, research, 'institution');
  }

  const edu = (education || []).filter(Boolean);
  if (edu.length) {
    children.push(sectionHeading('Education'));
    edu.forEach((e) => {
      const degreeLine = [clean(e.degree), e.major ? `, ${clean(e.major)}` : ''].filter(Boolean).join('');
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 0 },
          children: [new TextRun({ text: degreeLine, bold: true })],
        })
      );
      const meta = [clean(e.school), formatDate(e.graduationDate), e.gpa ? `${clean(e.gradeType || 'GPA')}: ${clean(e.gpa)}` : '']
        .filter(Boolean)
        .join('  ·  ');
      if (meta) children.push(new Paragraph({ text: meta, spacing: { after: 100 } }));
      if (e.thesis) children.push(new Paragraph({ children: [new TextRun({ text: 'Thesis: ', italics: true }), new TextRun({ text: clean(e.thesis) })], spacing: { after: 60 } }));
      if (e.coursework) children.push(new Paragraph({ children: [new TextRun({ text: 'Relevant Coursework: ', italics: true }), new TextRun({ text: clean(e.coursework) })], spacing: { after: 100 } }));
    });
  }

  const pubs = (publications || []).filter(Boolean);
  if (pubs.length) {
    children.push(sectionHeading('Publications'));
    pubs.forEach((pub) => {
      const runs = [];
      if (pub.authors) runs.push(new TextRun({ text: `${clean(pub.authors)}. ` }));
      if (pub.title) runs.push(new TextRun({ text: clean(pub.title), italics: true }), new TextRun({ text: '.' }));
      if (pub.journal) runs.push(new TextRun({ text: ` ${clean(pub.journal)}.` }));
      if (pub.year) runs.push(new TextRun({ text: ` ${clean(pub.year)}.` }));
      if (pub.doi) runs.push(new TextRun({ text: ` DOI: ${clean(pub.doi)}.` }));
      if (runs.length) children.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
    });
  }

  const pres = (presentations || []).filter(Boolean);
  if (pres.length) {
    children.push(sectionHeading('Presentations'));
    pres.forEach((pr) => {
      const meta = [pr.event, pr.location, pr.date].filter(Boolean).map((x) => ` ${clean(x)}.`).join('');
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: clean(pr.title), bold: true }), ...(meta ? [new TextRun({ text: meta })] : [])],
        })
      );
    });
  }

  const aw = (awards || []).filter(Boolean);
  if (aw.length) {
    children.push(sectionHeading('Awards & Honors'));
    aw.forEach((a) => {
      const line = [clean(a.title), a.org ? `, ${clean(a.org)}` : '', a.year ? ` (${clean(a.year)})` : ''].join('');
      children.push(new Paragraph({ spacing: { after: a.description ? 0 : 60 }, children: [new TextRun({ text: line, bold: true })] }));
      if (a.description) children.push(new Paragraph({ text: clean(a.description), spacing: { after: 60 } }));
    });
  }

  const acts = (activities || []).filter(Boolean);
  if (acts.length) {
    children.push(sectionHeading('Leadership & Activities'));
    acts.forEach((a) => {
      const head = [clean(a.name), a.role ? ` — ${clean(a.role)}` : ''].join('');
      const meta = [a.org, a.date].filter(Boolean).map(clean).join('. ');
      children.push(
        new Paragraph({
          spacing: { after: a.description ? 0 : 60 },
          children: [new TextRun({ text: head, bold: true }), ...(meta ? [new TextRun({ text: `   ${meta}`, color: '555555' })] : [])],
        })
      );
      if (a.description) children.push(new Paragraph({ text: clean(a.description), spacing: { after: 60 } }));
    });
  }

  const sk = skills || {};
  const skillRow = (label, arr) => {
    const vals = (arr || []).map(clean).filter(Boolean);
    if (!vals.length) return null;
    return new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: vals.join(', ') })],
    });
  };
  const skillParas = [
    skillRow('Technical', sk.technical),
    skillRow('Methods & Tools', sk.laboratory),
    skillRow('Professional', sk.soft),
    skillRow('Languages', sk.languages),
    skillRow('Certifications', sk.certifications),
    skillRow('Interests', sk.interests),
  ].filter(Boolean);
  if (skillParas.length) {
    children.push(sectionHeading('Skills'));
    children.push(...skillParas);
  }

  const projs = (projects || []).filter(Boolean);
  if (projs.length) {
    children.push(sectionHeading('Projects'));
    projs.forEach((pr) => {
      const tech = formatTechnologies(pr.technologies);
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: clean(pr.name), bold: true }),
            ...(tech ? [new TextRun({ text: `   ${tech}`, italics: true, color: '555555' })] : []),
          ],
        })
      );
      if (pr.description) {
        children.push(new Paragraph({ text: clean(pr.description), spacing: { after: 20 } }));
      }
      if (pr.link) {
        children.push(
          new Paragraph({ spacing: { after: 100 }, children: [linkRun(pr.link, stripProtocol(pr.link))] })
        );
      }
    });
  }

  // Profile-level custom sections (both modes) — appended last, in order.
  (customSections || [])
    .filter((s) => s && s.title && (s.entries || []).some((e) => e.text && e.text.trim()))
    .forEach((sec) => {
      children.push(sectionHeading(sec.title));
      (sec.entries || [])
        .filter((e) => e.text && e.text.trim())
        .forEach((e) => children.push(new Paragraph({ text: clean(e.text), bullet: { level: 0 } })));
    });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } }, // 22 half-points = 11pt
      },
    },
  });

  return Packer.toBlob(doc);
}
