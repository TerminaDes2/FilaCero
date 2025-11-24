"use client";
import React, { useId, useState } from 'react';

interface FancyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  validateOnChange?: boolean;
  strength?: number; // 0 - 4 (optional, for password)
  onTogglePassword?: () => void;
  isPassword?: boolean;
}

export const FancyInput: React.FC<FancyInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  validateOnChange,
  strength,
  onTogglePassword,
  isPassword,
  type,
  ...rest
}) => {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    rest.value !== undefined
      ? String(rest.value)
      : rest.defaultValue !== undefined
        ? String(rest.defaultValue)
        : ''
  );

  const hasError = !!error;
  const describedBy = hasError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const hasContent = (
    (rest.value !== undefined && String(rest.value).length > 0) ||
    (rest.defaultValue !== undefined && String(rest.defaultValue).length > 0) ||
    internalValue.length > 0
  );

  return (
    <div className="relative group">
      <div
        className={`relative rounded-xl border bg-white/85 backdrop-blur transition
        ${hasError ? 'border-rose-300 bg-rose-50/90 shadow-sm' : 'border-gray-200/80 hover:border-gray-300'}
        focus-within:ring-2 focus-within:ring-brand-400/30 shadow-sm focus-within:shadow-md`}
      >
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`absolute ${leftIcon ? 'left-10' : 'left-3'} transition-[top,transform,color,background-color] px-1 rounded-md text-[11px] tracking-wide font-medium
            ${(focused || hasContent) ? '-top-2.5 scale-90 bg-white/95 text-brand-600 shadow-sm' : 'top-3 text-gray-500'}
            pointer-events-none origin-left duration-200`}
        >
          {label}
        </label>
        {leftIcon && (
          <span className="absolute inset-y-0 left-3 flex items-center pt-0.5 text-gray-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          {...rest}
          type={type}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-xl bg-transparent outline-none appearance-none text-sm text-gray-800 placeholder-transparent
            ${leftIcon ? 'pl-10' : 'pl-2'} ${isPassword || rightIcon ? 'pr-11' : 'pr-2'} py-3`}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          onChange={(e) => {
            if (rest.onChange) rest.onChange(e);
            if (rest.value === undefined) setInternalValue(e.target.value);
          }}
        />
        {(isPassword || rightIcon) && (
          <button
            type="button"
            tabIndex={isPassword ? 0 : -1}
            onClick={isPassword ? onTogglePassword : undefined}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition select-none focus:outline-none focus:ring-0"
            aria-label={isPassword ? 'Mostrar / ocultar contraseña' : undefined}
          >
            {isPassword ? (
              type === 'password' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94m4.24-2.16A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19M1 1l22 22" /><path d="M9.9 9.9a3 3 0 0 0 4.24 4.24" /></svg>
              )
            ) : rightIcon}
          </button>
        )}
      </div>
      {typeof strength === 'number' && (
        <div className="mt-1 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => {
            const active = strength > i;
            const color = !active
              ? 'bg-gray-300'
              : strength <= 1
                ? 'bg-rose-400'
                : strength === 2
                  ? 'bg-amber-400'
                  : strength === 3
                    ? 'bg-brand-500'
                    : 'bg-emerald-500';
            return <span key={i} className={`h-1.5 flex-1 rounded-full transition-all ${color}`} />;
          })}
        </div>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
};
