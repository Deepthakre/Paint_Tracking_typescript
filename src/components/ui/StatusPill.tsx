import { memo, type ReactNode } from 'react';

const STYLES: Record<string, string> = {
  FACTORY: 'bg-[#E4EDF4] text-blue',
  TRANSIT: 'bg-[#F6E8DD] text-ochre',
  DEALER: 'bg-[#E3EFE8] text-green',
  SOLD: 'bg-[#F5E3E5] text-red',
  RETURNED: 'bg-[#EDE7F2] text-violet',
  OK: 'bg-[#E3EFE8] text-green',
  LOW: 'bg-[#F6E8DD] text-ochre',
  OUT: 'bg-[#F5E3E5] text-red',
  PENDING: 'bg-[#F6E8DD] text-ochre',
  DISPATCHED: 'bg-[#E3EFE8] text-green',
  REJECTED: 'bg-[#F5E3E5] text-red',
};

interface StatusPillProps {
  status: string;
  children?: ReactNode;
}

function StatusPill({ status, children }: StatusPillProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STYLES[status] || 'bg-line text-ink-soft'}`}>
      {children || status}
    </span>
  );
}

// Purely presentational and re-rendered inside large table bodies — memoize
// so an unrelated state change in the parent (e.g. a filter input) doesn't
// re-render every pill row that didn't actually change.
export default memo(StatusPill);
