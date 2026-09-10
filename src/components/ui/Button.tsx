import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'blue' | 'ochre' | 'green' | 'violet';

const VARIANTS: Record<ButtonVariant, string> = {
  blue: 'bg-blue hover:brightness-110',
  ochre: 'bg-ochre hover:brightness-110',
  green: 'bg-green hover:brightness-110',
  violet: 'bg-violet hover:brightness-110',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: ReactNode;
}

export default function Button({ variant = 'blue', disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`px-4 py-2.5 rounded-[7px] text-white font-semibold text-sm transition
        ${disabled ? 'bg-[#C6CBC8] cursor-not-allowed' : VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`bg-transparent border border-line text-blue font-semibold text-xs px-2.5 py-1.5 rounded-md hover:bg-[#E4EDF4] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
