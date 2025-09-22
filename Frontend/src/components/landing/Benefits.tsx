const benefits = [
  {
    title: "Menos tiempo en filas",
    text: "Optimización del flujo de compra para estudiantes y personal.",
  },
  {
    title: "Control centralizado",
    text: "Toda la operación en una única plataforma coherente.",
  },
  {
    title: "Decisiones con datos",
    text: "Reportes claros para ajustar precios y stock.",
  },
  {
    title: "Escalable",
    text: "Empieza simple y agrega módulos con el crecimiento.",
  },
  {
    title: "Experiencia moderna",
    text: "UI limpia, rápida y accesible para cualquier usuario.",
  },
  {
    title: "Soporte futuro",
    text: "Base preparada para integrar pagos y más.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Beneficios clave</h2>
          <p className="text-gray-600">Resultados concretos que mejoran tu operación diaria.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map(b => (
            <div key={b.title} className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition">
              <h3 className="font-semibold text-gray-800 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
