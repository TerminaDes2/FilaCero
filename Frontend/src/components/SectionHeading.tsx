import React from 'react';
import clsx from 'clsx';

interface SectionHeadingProps {
  id?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  badgeTone?: 'brand' | 'teal' | 'sun' | 'neutral';
  as?: keyof JSX.IntrinsicElements;
}

/*
  Reusable heading block for landing sections.
  - Provides consistent hierarchy & spacing
  - Optional badge with tone mapping
  - Accessible: <section aria-labelledby> should reference id passed here
*/

const toneMap: Record<string, { bg: string; text: string; border: string }> = {
  brand: {
    bg: 'bg-[var(--fc-brand-50)] dark:bg-[rgba(233,74,111,0.12)]',
    text: 'text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-100)]',
    border: 'border-[var(--fc-brand-200)]/70 dark:border-[rgba(233,74,111,0.35)]'
  },
  teal: {
    bg: 'bg-[var(--fc-teal-50)] dark:bg-[rgba(35,184,163,0.12)]',
    text: 'text-[var(--fc-teal-700)] dark:text-[var(--fc-teal-100)]',
    border: 'border-[var(--fc-teal-200)]/70 dark:border-[rgba(76,193,173,0.35)]'
  },
  sun: {
    bg: 'bg-[var(--fc-sun-50)] dark:bg-[rgba(240,180,74,0.12)]',
    text: 'text-[var(--fc-sun-700)] dark:text-[var(--fc-sun-100)]',
    border: 'border-[var(--fc-sun-200)]/70 dark:border-[rgba(240,180,74,0.35)]'
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-slate-800/60',
    text: 'text-gray-700 dark:text-slate-200',
    border: 'border-gray-300/60 dark:border-slate-600/70'
  },
};

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  id,
  badge,
  title,
  subtitle,
  align = 'left',
  className,
  badgeTone = 'brand',
  as: Tag = 'div'
}) => {
  const tone = toneMap[badgeTone];
  const wrapperCls = clsx(
    'mb-14',
    align === 'center' && 'text-center mx-auto',
    className
  );

  const badgeCls = badge && clsx(
    'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-4 tracking-wide uppercase',
    tone.bg,
    tone.text,
    tone.border
  );

  return (
    <Tag className={wrapperCls} {...(id ? { id } : {})}>
      {badge && <span className={badgeCls}>{badge}</span>}
      <h2 className="text-3xl font-bold tracking-tight text-[var(--fc-text-primary)] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className={clsx('text-[var(--fc-text-secondary)] max-w-2xl', align === 'center' && 'mx-auto')}>
          {subtitle}
        </p>
      )}
    </Tag>
  );
};

export default SectionHeading;
