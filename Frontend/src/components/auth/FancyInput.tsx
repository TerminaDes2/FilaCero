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
  // Track value for uncontrolled usage so label can float when user types
  const [internalValue, setInternalValue] = useState<string>(
    (rest.value !== undefined ? String(rest.value) : (rest.defaultValue !== undefined ? String(rest.defaultValue) : ''))
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
      <div className={`relative rounded-2xl border-2 backdrop-blur-sm transition-all duration-300
        ${hasError 
          ? 'border-rose-300 bg-rose-50/30 shadow-sm shadow-rose-200/50' 
          : focused 
            ? 'border-brand-400 bg-white/90 shadow-lg shadow-brand-200/30 scale-[1.01]' 
            : 'border-gray-200/80 bg-white/70 hover:border-gray-300 hover:bg-white/80 shadow-sm'
        }
        ${hasContent && !hasError && !focused ? 'border-emerald-200/60 bg-emerald-50/20' : ''}
      `}
      >
        {/* Glow effect on focus */}
        {focused && !hasError && (
          <div className="absolute -inset-[2px] bg-gradient-to-r from-brand-400/20 via-brand-300/20 to-brand-400/20 rounded-2xl blur-sm -z-10 animate-pulse" />
        )}
        
        {/* Floating label with enhanced styling */}
        <label
          htmlFor={id}
          className={`absolute ${leftIcon ? 'left-11' : 'left-4'} transition-all duration-300 px-2 rounded-lg font-semibold
            ${(focused || hasContent) 
              ? '-top-3 text-xs bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md px-3 py-0.5' 
              : 'top-4 text-sm text-gray-500'
            }
            pointer-events-none origin-left`}
        >
          {label}
        </label>
        
        {leftIcon && (
          <span className={`absolute inset-y-0 left-4 flex items-center transition-colors duration-300
            ${focused ? 'text-brand-600' : hasError ? 'text-rose-500' : 'text-gray-400'}`}>
            {leftIcon}
          </span>
        )}
        
        <input
          id={id}
          {...rest}
          type={type}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-2xl bg-transparent outline-none appearance-none text-base text-gray-900 placeholder-transparent font-medium
            ${leftIcon ? 'pl-12' : 'pl-4'} ${isPassword || rightIcon ? 'pr-12' : 'pr-4'} py-4`}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          onChange={(e) => {
            if (rest.onChange) rest.onChange(e);
            if (rest.value === undefined) setInternalValue(e.target.value);
          }}
        />
        
        {/* Success indicator */}
        {hasContent && !hasError && !focused && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {(isPassword || rightIcon) && (
          <button
            type={isPassword ? 'button' : 'button'}
            tabIndex={isPassword ? 0 : -1}
            onClick={isPassword ? onTogglePassword : undefined}
            className={`absolute inset-y-0 right-4 flex items-center transition-all duration-200 select-none focus:outline-none rounded-lg px-1
              ${focused ? 'text-brand-600 scale-110' : 'text-gray-500 hover:text-gray-700'}`}
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
      
      {/* Enhanced strength bar */}
      {typeof strength === 'number' && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1.5" aria-hidden>
            {[0,1,2,3].map(i => {
              const active = strength > i;
              const color = !active ? 'bg-gray-200' : strength <=1 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : strength ===2 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : strength ===3 ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600';
              return (
                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-300 ${color} ${active ? 'shadow-sm' : ''}`} />
              );
            })}
          </div>
          <p className="text-xs font-medium text-center">
            {strength <= 1 && <span className="text-rose-600">Débil</span>}
            {strength === 2 && <span className="text-amber-600">Media</span>}
            {strength === 3 && <span className="text-brand-600">Fuerte</span>}
            {strength === 4 && <span className="text-emerald-600">Muy fuerte</span>}
          </p>
        </div>
      )}
      
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hint}
        </p>
      )}
      
      {hasError && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1.5 animate-pulse">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
