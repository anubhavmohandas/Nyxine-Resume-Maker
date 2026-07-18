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
    children: [new TextRun({ text: text.toUpperCase(), bold: true })],
  });

export async function buildResumeDocxBlob({ personal, selectedJobs, education, skills, projects }) {
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
    jobs.forEach((j) => {
      const roleLine = [clean(j.title), j.company ? `— ${clean(j.company)}` : ''].filter(Boolean).join(' ');
      const dateText = `${clean(j.startDate)} – ${j.current ? 'Present' : clean(j.endDate)}`;
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 20 },
          children: [
            new TextRun({ text: roleLine, bold: true }),
            new TextRun({ text: `    ${dateText}`, italics: true, color: '555555' }),
          ],
        })
      );
      (j.bullets || [])
        .filter((b) => b && b.trim())
        .forEach((b) => {
          children.push(new Paragraph({ text: clean(b), bullet: { level: 0 } }));
        });
    });
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
      const meta = [clean(e.school), clean(e.graduationDate), e.gpa ? `${clean(e.gradeType || 'GPA')}: ${clean(e.gpa)}` : '']
        .filter(Boolean)
        .join('  ·  ');
      if (meta) children.push(new Paragraph({ text: meta, spacing: { after: 100 } }));
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
    skillRow('Professional', sk.soft),
    skillRow('Languages', sk.languages),
    skillRow('Certifications', sk.certifications),
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
