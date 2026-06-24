// ─── Date utilities (sorting, formatting, legacy migration) ──────────────────

// Converts YYYY-MM date strings into a sortable integer.
// Current jobs get the highest value so they always appear first.
export const parseDateForSort = (dateStr, isCurrent = false) => {
  if (isCurrent) return 999999; // "Present" always on top
  if (!dateStr || dateStr.trim() === '') return 0; // No date → bottom
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (match) return parseInt(match[1]) * 100 + parseInt(match[2]); // YYYY-MM
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) return parseInt(yearOnly[1]) * 100; // YYYY only
  return 0;
};

// Returns a new sorted array (newest → oldest). Does not mutate the original.
export const sortChronologically = (items, dateKey, currentKey = null) => {
  if (!Array.isArray(items) || items.length <= 1) return items;
  return [...items].sort((a, b) => {
    const da = parseDateForSort(a[dateKey], currentKey && a[currentKey]);
    const db = parseDateForSort(b[dateKey], currentKey && b[currentKey]);
    return db - da;
  });
};

// Converts stored date strings to display format.
// Handles both "2021-08" (ISO from date picker) and "Aug 2021" (legacy free-text).
export const formatDate = (dateStr) => {
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
export const migrateDate = (s) => {
  if (!s || typeof s !== 'string') return s;
  const m = s.trim().match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return s;
  const monthNum = MONTH_ABBR[m[1].slice(0,3).toLowerCase()];
  if (!monthNum) return s;
  return `${m[2]}-${String(monthNum).padStart(2, '0')}`;
};

// Walks a profile object and converts all date fields to ISO format.
// Non-destructive — fields already in "YYYY-MM" or other formats pass through unchanged.
export const migrateDatesInProfile = (p) => {
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
