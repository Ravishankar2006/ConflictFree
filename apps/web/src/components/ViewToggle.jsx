/* Shared segmented control for switching timetable views.
   `options` is [{ value, label, Icon }] — admin passes Calendar/Table,
   faculty and student pass Calendar/List. */
export default function ViewToggle({ mode, onChange, options }) {
  return (
    <div className="view-toggle" role="group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={mode === opt.value ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => onChange(opt.value)}
          aria-pressed={mode === opt.value}
        >
          <opt.Icon size={13} aria-hidden="true" />
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
