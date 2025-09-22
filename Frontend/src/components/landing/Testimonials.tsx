const testimonials = [
  {
    name: "Coordinadora Escolar",
    quote: "Reducimos el tiempo de espera y ahora los recreos son más tranquilos.",
    role: "Colegio Aurora",
  },
  {
    name: "Administrador",
    quote: "El control de inventario nos permitió evitar pérdidas y planificar mejor.",
    role: "Instituto Central",
  },
  {
    name: "Encargada Cafetería",
    quote: "La interfaz es tan simple que el equipo se adaptó en un día.",
    role: "Escuela Horizonte",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Testimonios</h2>
          <p className="text-gray-600">Experiencias reales de equipos que organizaron su cafetería.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map(t => (
            <figure key={t.quote} className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col">
              <blockquote className="text-gray-700 italic leading-relaxed mb-4">“{t.quote}”</blockquote>
              <figcaption className="mt-auto">
                <div className="font-semibold text-gray-800">{t.name}</div>
                <div className="text-sm text-gray-500">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
