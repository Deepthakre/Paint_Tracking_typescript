import { JOURNEY_STAGES } from '../../lib/constants';

interface ConveyorTrackerProps {
  current: string;
}

/**
 * Small horizontal stage tracker used on the Verify page and product
 * detail views. `current` is one of FACTORY | TRANSIT | DEALER | SOLD.
 */
export default function ConveyorTracker({ current }: ConveyorTrackerProps) {
  const idx = JOURNEY_STAGES.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1 my-4" role="list" aria-label="Product journey">
      {JOURNEY_STAGES.map((s, i) => {
        const reached = i <= idx;
        return (
          <div key={s.key} className="flex items-center flex-1" role="listitem">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 ${
                  reached ? 'bg-green border-green text-white' : 'bg-white border-line text-ink-soft'
                }`}
              >
                {s.icon}
              </div>
              <span className={`text-[10px] font-semibold text-center max-w-[70px] ${reached ? 'text-ink' : 'text-ink-soft'}`}>
                {s.label}
              </span>
            </div>
            {i < JOURNEY_STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < idx ? 'bg-green' : 'bg-line'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
