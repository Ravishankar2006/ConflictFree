import { useRef } from 'react';

import './TimetableCalendar.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
};

const GRID_START = 8 * 60;
const GRID_END   = 20 * 60;
const ROW_HEIGHT = 48;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function minutesToStr(m) {
  const clamped = Math.max(GRID_START, Math.min(GRID_END, m));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}:00`;
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
    rows.push(
      <div key={m} className={`cal-time-cell ${m % 60 === 0 ? 'cal-hour' : 'cal-half'}`}>
        {m % 60 === 0 ? `${String(Math.floor(m / 60)).padStart(2, '0')}:00` : ''}
      </div>
    );
  }
  return <div className="cal-gutter">{rows}</div>;
}

function calcSlotStyle(slot, color, extra = {}) {
  const start = timeToMinutes(slot.start_time);
  const end   = timeToMinutes(slot.end_time);
  const top    = ((start - GRID_START) / 30) * ROW_HEIGHT;
  const height = ((end - start) / 30) * ROW_HEIGHT;
  return {
    top:              `${top}px`,
    height:           `${Math.max(height - 4, 20)}px`,
    background:       color.bg,
    borderLeft:       `3px solid ${color.border}`,
    boxShadow:        `0 0 12px ${color.border}22`,
    ...extra,
  };
}

function SlotContent({ slot, color }) {
  return (
    <>
      <div className="cal-slot-code" style={{ color: color.text }}>
        {slot.course_code}
      </div>
      <div className="cal-slot-name">{slot.course_name}</div>
      <div className="cal-slot-meta">
        <span>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
        {slot.room && <span>📍 {slot.room}</span>}
        {slot.faculty_name && <span>👤 {slot.faculty_name}</span>}
      </div>
    </>
  );
}

/* ── Static (non-editable) calendar ─────────────── */
function StaticSlot({ slot, color }) {
  return (
    <div className="cal-slot" style={calcSlotStyle(slot, color)}>
      <SlotContent slot={slot} color={color} />
    </div>
  );
}

function StaticDayColumn({ day, slots }) {
  const totalRows = (GRID_END - GRID_START) / 30;
  return (
    <div className="cal-day-col">
      {Array.from({ length: totalRows }).map((_, i) => (
        <div
          key={i}
          className={`cal-gridline ${i % 2 === 0 ? 'cal-gridline-hour' : 'cal-gridline-half'}`}
          style={{ top: i * ROW_HEIGHT }}
        />
      ))}
      {slots.map(slot => {
        const color = getSlotColor(slot.course_id);
        return <StaticSlot key={slot.id} slot={slot} color={color} />;
      })}
    </div>
  );
}

function StaticCalendar({ slots }) {
  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day);
    return acc;
  }, {});
  const activeDays = DAYS.filter(d => grouped[d].length > 0);
  const displayDays = activeDays.length > 0 ? activeDays : DAYS;

  return (
    <div className="cal-wrapper">
      <div className="cal-header-row">
        <div className="cal-header-gutter" />
        {displayDays.map(day => (
          <div key={day} className="cal-header-day">
            <span className="cal-day-short">{day}</span>
            <span className="cal-day-full">{DAY_LABELS[day]}</span>
          </div>
        ))}
      </div>
      <div className="cal-body">
        <TimeGutter />
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${displayDays.length}, 1fr)` }}>
          {displayDays.map(day => (
            <StaticDayColumn key={day} day={day} slots={grouped[day]} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Editable (drag-and-drop) calendar ───── */
function EditableCalendar({ slots, onSlotMove, toast }) {
  const dragRef = useRef(null);

  function handleDragStart(e, slot) {
    dragRef.current = slot;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(slot.id));
    e.target.classList.add('cal-slot-dragging-source');
  }

  function handleDragEnd(e) {
    dragRef.current = null;
    e.target.classList.remove('cal-slot-dragging-source');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.currentTarget.classList.add('cal-day-col-over');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('cal-day-col-over');
  }

  function handleDrop(e, targetDay) {
    e.preventDefault();
    e.currentTarget.classList.remove('cal-day-col-over');
    const slot = dragRef.current;
    if (!slot) return;
    const colRect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - colRect.top;
    const snapSlot = Math.round(y / ROW_HEIGHT);
    const newStartMin = snapSlot * 30 + GRID_START;
    const duration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
    const newEndMin = newStartMin + duration;
    if (newStartMin < GRID_START || newEndMin > GRID_END) {
      if (toast) toast('Cannot move slot outside operating hours (08:00 – 20:00)', 'error');
      return;
    }
    if (targetDay === slot.day && newStartMin === timeToMinutes(slot.start_time)) return;
    onSlotMove(slot.id, { day: targetDay, start_time: minutesToStr(newStartMin), end_time: minutesToStr(newEndMin) });
  }

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day);
    return acc;
  }, {});
  const activeDays = DAYS.filter(d => grouped[d].length > 0);
  const displayDays = activeDays.length > 0 ? activeDays : DAYS;
  const totalRows = (GRID_END - GRID_START) / 30;

  return (
    <div className="cal-wrapper">
      <div className="cal-header-row">
        <div className="cal-header-gutter" />
        {displayDays.map(day => (
          <div key={day} className="cal-header-day">
            <span className="cal-day-short">{day}</span>
            <span className="cal-day-full">{DAY_LABELS[day]}</span>
          </div>
        ))}
      </div>
      <div className="cal-body">
        <TimeGutter />
        <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${displayDays.length}, 1fr)` }}>
          {displayDays.map(day => (
            <div
              key={day}
              className="cal-day-col cal-day-col-droppable"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, day)}
            >
              {Array.from({ length: totalRows }).map((_, i) => (
                <div key={i} className={`cal-gridline ${i % 2 === 0 ? 'cal-gridline-hour' : 'cal-gridline-half'}`} style={{ top: i * ROW_HEIGHT }} />
              ))}
              {grouped[day].map(slot => {
                const color = getSlotColor(slot.course_id);
                return (
                  <div key={slot.id} className="cal-slot cal-slot-draggable" draggable onDragStart={e => handleDragStart(e, slot)} onDragEnd={handleDragEnd} style={calcSlotStyle(slot, color)}>
                    <SlotContent slot={slot} color={color} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Public entry point ────────────────────────── */
export default function TimetableCalendar({ slots = [], onSlotMove, toast }) {
  if (typeof onSlotMove === 'function') {
    return <EditableCalendar slots={slots} onSlotMove={onSlotMove} toast={toast} />;
  }
  return <StaticCalendar slots={slots} />;
}
