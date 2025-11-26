"use client";
import { SectionHeading } from "../../components/SectionHeading";
import { useTranslation } from "../../hooks/useTranslation";

type Step = {
  number: number;
  title: string;
  text: string;
  colors: {
    primary: string;
    dark: string;
    light: string;
  };
};

const steps: Step[] = [
  {
    number: 1,
    title: "landing.process.steps.1.title",
    text: "landing.process.steps.1.text",
    colors: { primary: "#895814", dark: "#382000", light: "#FCE8B7" },
  },
  {
    number: 2,
    title: "landing.process.steps.2.title",
    text: "landing.process.steps.2.text",
    colors: { primary: "#891414", dark: "#2F0000", light: "#FCB7B7" },
  },
  {
    number: 3,
    title: "landing.process.steps.3.title",
    text: "landing.process.steps.3.text",
    colors: { primary: "#148987", dark: "#002E2F", light: "#B7FCFB" },
  },
  {
    number: 4,
    title: "landing.process.steps.4.title",
    text: "landing.process.steps.4.text",
    colors: { primary: "#318914", dark: "#002F02", light: "#E2FCB7" },
  },
];

const StepIcon = ({ step }: { step: number }) => {
  if (step === 1) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M4 5l2 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l2-14" />
        <rect x="7" y="9" width="10" height="6" rx="1" />
        <path strokeLinecap="round" d="M9 3h6" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path strokeLinecap="round" d="M8 12h8M8 16h6" />
      </svg>
    );
  }
  if (step === 3) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path strokeLinecap="round" d="M7 20h10" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />
    </svg>
  );
};

export function Process() {
  const { t } = useTranslation();
  return (
    <section
      id="process"
      className="relative overflow-hidden py-24 bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)] dark:bg-[color:rgba(5,9,20,0.96)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(15,23,42,0.16)_1px,transparent_0)] [background-size:18px_18px] dark:opacity-[0.18] dark:[background-image:radial-gradient(rgba(203,213,225,0.12)_1px,transparent_0)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/20 to-transparent dark:from-[color:rgba(5,9,20,0.9)] dark:via-[color:rgba(5,9,20,0.55)] dark:to-[color:rgba(5,9,20,0.92)]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-50/18 via-transparent to-teal-50/18 mix-blend-overlay opacity-80 dark:from-brand-500/12 dark:via-transparent dark:to-teal-500/12" aria-hidden />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          badge={t("landing.process.badge")}
          badgeTone="sun"
          title={t("landing.process.title")}
          subtitle={t("landing.process.subtitle")} />
        <ol className="flex gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible snap-x snap-mandatory" aria-label="Pasos del flujo">
          {steps.map(s => (
            <li
              key={s.number}
              className="relative group min-w-[240px] snap-center md:min-w-0"
            >
              <div
                className="relative flex flex-col h-full p-6 rounded-xl transition will-change-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: s.colors.light,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1 opacity-40 group-hover:opacity-70 transition" style={{ background: `linear-gradient(90deg, ${s.colors.primary}22, ${s.colors.primary})` }} />
                <div className="mb-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: s.colors.primary }}
                    aria-hidden
                  >
                    <StepIcon step={s.number} />
                  </div>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: s.colors.dark }}>{t(s.title)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: s.colors.dark + 'CC' }}>{t(s.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
