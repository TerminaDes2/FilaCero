const app = document.getElementById('app');
async function ping() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    if (!res.ok) throw new Error('Respuesta no ok');
    const data = await res.json();
    app.innerHTML = `<h1>FilaCero</h1><p>Backend status: <strong>${data.status}</strong></p><small>${data.time}</small>`;
  } catch (e) {
    app.innerHTML = '<p style="color:red">No se pudo contactar el backend.</p>';
  }
}
ping();
