import { formatDate } from './dates';

// Flattens the structured profile object into a plain-text resume,
// used as context for the AI Coach prompts.
export const profileToResumeText = (prof) => {
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
