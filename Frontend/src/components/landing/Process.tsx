type Step = {
  number: number;
  title: string;
  text: string;
  colors: {
    primary: string; // circle/accent
    dark: string;    // text fuerte / borde
    light: string;   // fondo suave
  };
};

const steps: Step[] = [
  {
    number: 1,
    title: "Escanea el QR.",
    text: "El cliente accede a la app web escaneando un QR en la cafetería.",
    colors: { primary: "#895814", dark: "#382000", light: "#FCE8B7" },
  },
  {
    number: 2,
    title: "Realiza el pedido.",
    text: "Selecciona productos del menú digital y confirma el pago.",
    colors: { primary: "#891414", dark: "#2F0000", light: "#FCB7B7" },
  },
  {
    number: 3,
    title: "POS lo recibe.",
    text: "El pedido llega al sistema POS donde el personal lo gestiona.",
    colors: { primary: "#148987", dark: "#002E2F", light: "#B7FCFB" },
  },
  {
    number: 4,
    title: "Recoge sin filas.",
    text: "El cliente recibe su pedido cuando aparece como “Listo”.",
    colors: { primary: "#318914", dark: "#002F02", light: "#E2FCB7" },
  },
];

export function Process() {
  return (
    <section id="process" className="relative py-24 bg-gradient-to-b from-white via-brand-50/30 to-white dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14 text-center mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 mb-3">¿Cómo funciona?</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Cómo funciona nuestra <span style={{ color: '#D55D7B' }}>Fila</span><span style={{ color: '#4CC1AD' }}>Cero</span></h2>
          <p className="text-gray-600 dark:text-slate-300">Un flujo sencillo para que empieces a operar en minutos.</p>
        </div>
        <ol className="grid gap-8 md:grid-cols-4">
          {steps.map(s => (
            <li key={s.number} className="relative group">
              <div
                className="relative flex flex-col h-full p-6 rounded-xl transition will-change-transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: s.colors.light,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1 opacity-40 group-hover:opacity-70 transition" style={{ background: `linear-gradient(90deg, ${s.colors.primary}22, ${s.colors.primary})` }} />
                {/* Per-card colored hover glow */}
                <div
                  className="pointer-events-none absolute -z-10 -inset-1 rounded-xl blur-md opacity-0 group-hover:opacity-[0.18] transition duration-300"
                  style={{ background: s.colors.primary }}
                />
                <div className="mb-4">
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: s.colors.primary }}
                    aria-hidden
                  >
                    {/* Icon per step */}
                    {s.number === 1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M4 5l2 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l2-14" />
                        <rect x="7" y="9" width="10" height="6" rx="1" />
                        <path strokeLinecap="round" d="M9 3h6" />
                      </svg>
                    )}
                    {s.number === 2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18" />
                        <rect x="4" y="7" width="16" height="13" rx="2" />
                        <path strokeLinecap="round" d="M8 12h8M8 16h6" />
                      </svg>
                    )}
                    {s.number === 3 && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                        <rect x="3" y="4" width="18" height="14" rx="2" />
                        <path strokeLinecap="round" d="M7 20h10" />
                        <circle cx="12" cy="11" r="3" />
                      </svg>
                    )}
                    {s.number === 4 && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: s.colors.dark }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: s.colors.dark + 'CC' }}>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
