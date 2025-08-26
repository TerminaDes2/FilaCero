const app = document.getElementById('app');
async function ping() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    if (!res.ok) throw new Error('Respuesta no ok');
    const data = await res.json();
    app.innerHTML = `
      <div class="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 class="text-2xl font-bold text-indigo-600">FilaCero</h1>
        <p class="text-gray-700">Backend status: <span class="font-semibold ${data.status === 'ok' ? 'text-green-600' : 'text-red-600'}">${data.status}</span></p>
        <p class="text-xs text-gray-400">${data.time}</p>
      </div>`;
  } catch (e) {
  app.innerHTML = '<div class="text-red-600 font-semibold">No se pudo contactar el backend.</div>';
  }
}
ping();
