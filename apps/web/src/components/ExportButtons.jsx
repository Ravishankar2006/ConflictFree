import { Download, Printer } from 'lucide-react';

/* Shared ICS / PDF export pair used by the admin, faculty and student dashboards. */
export default function ExportButtons({ onIcs, onPrint }) {
  return (
    <div className="export-buttons">
      <button
        className="btn-export"
        onClick={onIcs}
        title="Download .ics calendar file"
      >
        <Download size={13} aria-hidden="true" />
        <span>ICS</span>
      </button>
      <button
        className="btn-export"
        onClick={onPrint}
        title="Print / Save as PDF"
      >
        <Printer size={13} aria-hidden="true" />
        <span>PDF</span>
      </button>
    </div>
  );
}
