import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[14px] font-semibold text-ink-soft tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const baseInput = 'px-2.5 py-2 border border-line rounded-[7px] text-sm bg-white min-w-[160px] focus:border-blue';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(props, ref) {
  return <input ref={ref} className={baseInput} {...props} />;
});

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" className={baseInput} {...props} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={baseInput} {...props}>
      {children}
    </select>
  );
}
