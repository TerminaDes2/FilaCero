import type { CSSProperties } from "react";
import { SectionHeading } from "../../components/SectionHeading";

type StepPalette = {
  surface: string;
  border: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  glow: string;
};

type Step = {
  number: number;
  title: string;
  text: string;
  palette: {
    light: StepPalette;
    dark: StepPalette;
  };
};

const steps: Step[] = [
  {
    number: 1,
    title: "Escanea el QR.",
    text: "El cliente accede a la app web escaneando un QR en la cafetería.",
    palette: {
      light: {
        surface: "linear-gradient(135deg, #fff2d5, #f8dfb1)",
        border: "rgba(195, 122, 42, 0.28)",
        accent: "#c37a2a",
        accentSoft: "rgba(195, 122, 42, 0.22)",
        text: "#3e2600",
        muted: "rgba(62, 38, 0, 0.78)",
        glow: "rgba(240, 174, 82, 0.3)",
      },
      dark: {
        surface: "linear-gradient(135deg, rgba(56, 36, 9, 0.45), rgba(24, 14, 4, 0.82))",
        border: "rgba(246, 192, 124, 0.26)",
        accent: "#f2b35c",
        accentSoft: "rgba(242, 179, 92, 0.26)",
        text: "#f9ead0",
        muted: "rgba(249, 234, 208, 0.72)",
        glow: "rgba(242, 179, 92, 0.22)",
      },
    },
  },
  {
    number: 2,
    title: "Realiza el pedido.",
    text: "Selecciona productos del menú digital y confirma el pago.",
    palette: {
      light: {
        surface: "linear-gradient(135deg, #ffd9d9, #ffb7b7)",
        border: "rgba(233, 74, 111, 0.26)",
        accent: "#e94a6f",
        accentSoft: "rgba(233, 74, 111, 0.22)",
        text: "#420008",
        muted: "rgba(66, 0, 8, 0.75)",
        glow: "rgba(233, 74, 111, 0.25)",
      },
      dark: {
        surface: "linear-gradient(135deg, rgba(101, 14, 33, 0.58), rgba(36, 5, 12, 0.85))",
        border: "rgba(255, 100, 134, 0.28)",
        accent: "#ff6486",
        accentSoft: "rgba(255, 100, 134, 0.26)",
        text: "#fdebec",
        muted: "rgba(253, 234, 236, 0.74)",
        glow: "rgba(255, 100, 134, 0.24)",
      },
    },
  },
  {
    number: 3,
    title: "Equipo lo prepara.",
    text: "El pedido entra al panel operativo listo para producirse sin pasos extra.",
    palette: {
      light: {
        surface: "linear-gradient(135deg, #cbfff7, #b7fcfb)",
        border: "rgba(24, 153, 148, 0.24)",
        accent: "#1e918f",
        accentSoft: "rgba(30, 145, 143, 0.2)",
        text: "#003234",
        muted: "rgba(0, 50, 52, 0.74)",
        glow: "rgba(30, 145, 143, 0.22)",
      },
      dark: {
        surface: "linear-gradient(135deg, rgba(7, 64, 67, 0.65), rgba(4, 40, 42, 0.78))",
        border: "rgba(56, 226, 223, 0.28)",
        accent: "#38e2df",
        accentSoft: "rgba(56, 226, 223, 0.22)",
        text: "#e4faf9",
        muted: "rgba(228, 250, 249, 0.72)",
        glow: "rgba(56, 226, 223, 0.2)",
      },
    },
  },
  {
    number: 4,
    title: "Recoge sin filas.",
    text: "El cliente recibe su pedido cuando aparece como “Listo”.",
    palette: {
      light: {
        surface: "linear-gradient(135deg, #f0ffcb, #ddfcaa)",
        border: "rgba(70, 152, 35, 0.24)",
        accent: "#469823",
        accentSoft: "rgba(70, 152, 35, 0.22)",
        text: "#063200",
        muted: "rgba(6, 50, 0, 0.72)",
        glow: "rgba(88, 198, 54, 0.24)",
      },
      dark: {
        surface: "linear-gradient(135deg, rgba(19, 59, 18, 0.62), rgba(12, 38, 12, 0.88))",
        border: "rgba(126, 217, 98, 0.26)",
        accent: "#7ed962",
        accentSoft: "rgba(126, 217, 98, 0.24)",
        text: "#e7fbe2",
        muted: "rgba(231, 251, 226, 0.72)",
        glow: "rgba(126, 217, 98, 0.22)",
      },
    },
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
          badge="¿Cómo funciona?"
          badgeTone="sun"
          title={<span>Cómo funciona nuestra <span className="text-gradient">FilaCero</span></span> as any}
          subtitle="Un flujo sencillo para que empieces a operar en minutos."
        />
        <ol
          className="snap-mandatory flex gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible"
          aria-label="Pasos del flujo"
        >
          {steps.map((step) => {
            const cardStyle = {
              "--step-card-surface": step.palette.light.surface,
              "--step-card-surface-dark": step.palette.dark.surface,
              "--step-card-border": step.palette.light.border,
              "--step-card-border-dark": step.palette.dark.border,
              "--step-card-text": step.palette.light.text,
              "--step-card-text-dark": step.palette.dark.text,
              "--step-card-muted": step.palette.light.muted,
              "--step-card-muted-dark": step.palette.dark.muted,
              "--step-card-accent": step.palette.light.accent,
              "--step-card-accent-dark": step.palette.dark.accent,
              "--step-card-accent-soft": step.palette.light.accentSoft,
              "--step-card-accent-soft-dark": step.palette.dark.accentSoft,
              "--step-card-glow": step.palette.light.glow,
              "--step-card-glow-dark": step.palette.dark.glow,
              background: "var(--step-card-surface)",
              borderColor: "var(--step-card-border)",
              color: "var(--step-card-text)",
            } as CSSProperties;

            return (
              <li key={step.number} className="group relative min-w-[240px] snap-center md:min-w-0">
                <div
                  data-step-card
                  className="relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm transition will-change-transform hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-transparent dark:[--step-card-surface:var(--step-card-surface-dark)] dark:[--step-card-border:var(--step-card-border-dark)] dark:[--step-card-text:var(--step-card-text-dark)] dark:[--step-card-muted:var(--step-card-muted-dark)] dark:[--step-card-accent:var(--step-card-accent-dark)] dark:[--step-card-accent-soft:var(--step-card-accent-soft-dark)] dark:[--step-card-glow:var(--step-card-glow-dark)]"
                  style={cardStyle}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1 opacity-50 transition group-hover:opacity-80"
                    style={{ background: "linear-gradient(90deg, var(--step-card-accent-soft), var(--step-card-accent))" }}
                  />
                  <div
                    className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl blur-xl opacity-0 transition duration-500 group-hover:opacity-80"
                    style={{ background: "var(--step-card-glow)" }}
                  />
                  <div className="mb-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                      style={{ background: "var(--step-card-accent)" }}
                      aria-hidden
                    >
                      <StepIcon step={step.number} />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold tracking-tight" style={{ color: "var(--step-card-text)" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--step-card-muted)" }}>
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
