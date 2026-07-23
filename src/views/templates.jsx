// Resume templates — pure presentational components driven by profile data.
import { formatDate } from '../lib/dates';

const ModernTemplate = ({ profile, selectedJobs, displaySkills, displayProjects, displayCerts }) => {
  const techSkills = (profile.skills?.technical || []).filter(s => displaySkills.includes(s));
  const softSkills = (profile.skills?.soft || []).filter(s => displaySkills.includes(s));
  const langSkills = (profile.skills?.languages || []).filter(s => displaySkills.includes(s));
  return (
    <div className="bg-white max-w-6xl mx-auto print:max-w-none" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.4', background: 'linear-gradient(to right, #f3f4f6 300px, white 300px)' }}>
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
        <div className="py-6 pr-6">
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
    <div className="bg-white max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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
    <div className="bg-white max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: 'Arial, Calibri, sans-serif' }}>
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
            {labSkills.length > 0 && <p><strong>Methods &amp; Tools: </strong>{labSkills.join(', ')}</p>}
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

export { ModernTemplate, ClassicTemplate, HarvardTemplate, ATSOptimizedTemplate, CreativeTemplate, ProfessionalColorTemplate, BoldTemplate, AcademicTemplate };
