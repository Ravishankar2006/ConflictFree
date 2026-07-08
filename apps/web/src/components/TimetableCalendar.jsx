import './TimetableCalendar.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

// Time grid: 08:00 → 20:00, one row per 30 minutes
const GRID_START = 8 * 60;  // 08:00 in minutes
const GRID_END   = 20 * 60; // 20:00 in minutes
const ROW_HEIGHT = 48;       // px per 30-min row

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

const SLOT_COLORS = [
  { bg: 'rgba(56, 189, 248, 0.12)',  border: '#38bdf8',  text: '#38bdf8'  },
  { bg: 'rgba(192, 132, 252, 0.12)', border: '#c084fc',  text: '#c084fc'  },
  { bg: 'rgba(52, 211, 153, 0.12)',  border: '#34d399',  text: '#34d399'  },
  { bg: 'rgba(251, 146, 60, 0.12)',  border: '#fb923c',  text: '#fb923c'  },
  { bg: 'rgba(251, 113, 133, 0.12)', border: '#fb7185',  text: '#fb7185'  },
  { bg: 'rgba(250, 204, 21, 0.12)',  border: '#facc15',  text: '#facc15'  },
];

function getSlotColor(courseId) {
  return SLOT_COLORS[(courseId ?? 0) % SLOT_COLORS.length];
}

function TimeGutter() {
  const rows = [];
  for (let m = GRID_START; m < GRID_END; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const min = m % 60 === 0 ? '00' : '30';
    rows.push(
      <div key={m} className={`cal-time-cell ${m % 60 === 0 ? 'cal-hour' : 'cal-half'}`}>
        {m % 60 === 0 ? `${h}:${min}` : ''}
      </div>
    );
  }
  return <div className="cal-gutter">{rows}</div>;
}

function DayColumn({ day, slots }) {
  const totalRows = (GRID_END - GRID_START) / 30;

  return (
    <div className="cal-day-col">
      {/* Grid lines */}
      {Array.from({ length: totalRows }).map((_, i) => (
        <div
          key={i}
          className={`cal-gridline ${i % 2 === 0 ? 'cal-gridline-hour' : 'cal-gridline-half'}`}
          style={{ top: i * ROW_HEIGHT }}
        />
      ))}

      {/* Slot blocks */}
      {slots.map(slot => {
        const start = timeToMinutes(slot.start_time);
        const end   = timeToMinutes(slot.end_time);
        const top    = ((start - GRID_START) / 30) * ROW_HEIGHT;
        const height = ((end - start) / 30) * ROW_HEIGHT;
        const color  = getSlotColor(slot.course_id);

        return (
          <div
            key={slot.id}
            className="cal-slot"
            style={{
              top:              `${top}px`,
              height:           `${Math.max(height - 4, 20)}px`,
              background:       color.bg,
              borderLeft:       `3px solid ${color.border}`,
              boxShadow:        `0 0 12px ${color.border}22`,
            }}
          >
            <div className="cal-slot-code" style={{ color: color.text }}>
              {slot.course_code}
            </div>
            <div className="cal-slot-name">{slot.course_name}</div>
            <div className="cal-slot-meta">
              <span>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
              {slot.room && <span>📍 {slot.room}</span>}
              {slot.faculty_name && <span>👤 {slot.faculty_name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TimetableCalendar({ slots = [] }) {
  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day);
    return acc;
  }, {});

  const activeDays = DAYS.filter(d => grouped[d].length > 0);
  const displayDays = activeDays.length > 0 ? activeDays : DAYS;

  const gridHeight = ((GRID_END - GRID_START) / 30) * ROW_HEIGHT;

  return (
    <div className="cal-wrapper">
      {/* Column headers */}
      <div className="cal-header-row">
        <div className="cal-header-gutter" />
        {displayDays.map(day => (
          <div key={day} className="cal-header-day">
            <span className="cal-day-short">{day}</span>
            <span className="cal-day-full">{DAY_LABELS[day]}</span>
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="cal-body">
        <TimeGutter />
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${displayDays.length}, 1fr)` }}>
          {displayDays.map(day => (
            <DayColumn key={day} day={day} slots={grouped[day]} />
          ))}
        </div>
      </div>
    </div>
  );
}
