// Industry ↔ Academic mode switch.
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

export default ModeToggle;
