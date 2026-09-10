import type { MouseEvent, ReactNode } from 'react';

interface PanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function Panel({ title, subtitle, actions, children }: PanelProps) {
  return (
    <section className="bg-panel border border-line rounded-[10px] p-6 mb-4.5">
      <div className="flex justify-between items-start gap-3 mb-1">
        <h2 className="text-[19px] m-0">{title}</h2>
        {actions}
      </div>
      {subtitle && <div className="text-ink-soft text-[13px] mb-4.5">{subtitle}</div>}
      {children}
    </section>
  );
}

interface TableProps {
  columns: string[];
  children?: ReactNode;
  emptyLabel?: string;
  isEmpty?: boolean;
}

export function Table({ columns, children, emptyLabel = 'Nothing here yet.', isEmpty }: TableProps) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} className="text-left text-[11px] uppercase tracking-wide text-ink-soft py-2 px-2.5 border-b border-line">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={columns.length} className="text-ink-soft text-[13px] py-3.5">
              {emptyLabel}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  );
}

interface FlashProps {
  kind?: 'err' | 'ok';
  children?: ReactNode;
}

export function Flash({ kind, children }: FlashProps) {
  if (!children) return null;
  return (
    <div
      className={`px-3.5 py-2.5 rounded-lg text-[13px] font-semibold mb-3.5 ${
        kind === 'err' ? 'bg-[#F5E3E5] text-red' : 'bg-[#E3EFE8] text-green'
      }`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  n: ReactNode;
  label: ReactNode;
}

export function StatCard({ n, label }: StatCardProps) {
  return (
    <div className="bg-white border border-line rounded-[10px] p-4">
      <div className="font-display text-[28px] font-extrabold">{n}</div>
      <div className="text-xs text-ink-soft font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}

interface ProgressBarProps {
  pct: number;
}

export function ProgressBar({ pct }: ProgressBarProps) {
  return (
    <div className="bg-[#EDEFED] rounded-full h-3.5 overflow-hidden my-2">
      <div className="bg-green h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
}

// Centered overlay dialog — click the backdrop or the × to close. Used for
// things like popping open an invoice without leaving the current page.
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto p-6 z-50 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[10px] shadow-xl mt-8 mb-8 max-w-[90vw]"
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-line no-print">
          <h3 className="text-[15px] font-bold m-0">{title}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
