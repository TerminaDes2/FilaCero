const app = document.getElementById('app');

function html(strings, ...vals) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');
}

async function getHealth() {
  const res = await fetch('http://localhost:3000/api/health');
  return res.ok ? res.json() : { status: 'error' };
}

async function fetchProducts() {
  const res = await fetch('http://localhost:3000/api/products');
  return res.ok ? res.json() : [];
}

async function createProduct(fd) {
  const body = Object.fromEntries(fd.entries());
  body.price = parseFloat(body.price);
  body.stock = parseInt(body.stock, 10);
  const res = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al crear');
  return res.json();
}

async function load() {
  try {
    const [health, products] = await Promise.all([getHealth(), fetchProducts()]);
    app.innerHTML = html`
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow p-6 space-y-2">
          <h1 class="text-2xl font-bold text-indigo-600">FilaCero POS</h1>
          <p class="text-gray-700">Backend: <span class="font-semibold ${health.status === 'ok' ? 'text-green-600' : 'text-red-600'}">${health.status}</span></p>
          <p class="text-xs text-gray-400">${health.time || ''}</p>
        </div>
        <div class="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 class="text-lg font-semibold">Nuevo producto</h2>
          <form id="product-form" class="grid gap-3 md:grid-cols-4 items-end">
            <label class="flex flex-col text-left text-sm col-span-2">
              Nombre
              <input required name="name" class="border rounded px-2 py-1" />
            </label>
            <label class="flex flex-col text-left text-sm">
              Precio
              <input required name="price" type="number" step="0.01" min="0" class="border rounded px-2 py-1" />
            </label>
            <label class="flex flex-col text-left text-sm">
              Stock
              <input required name="stock" type="number" min="0" class="border rounded px-2 py-1" />
            </label>
            <button class="md:col-span-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2" type="submit">Guardar</button>
          </form>
        </div>
        <div class="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 class="text-lg font-semibold">Inventario (${products.length})</h2>
          <table class="w-full text-sm">
            <thead><tr class="text-left border-b"><th>Nombre</th><th>Precio</th><th>Stock</th><th>Activo</th></tr></thead>
            <tbody>
              ${products
                .map(
                  (p) => html`<tr class="border-b last:border-none"><td class="py-1">${p.name}</td><td>$${p.price?.toFixed?.(2)}</td><td>${p.stock}</td><td>${p.active ? '✅' : '❌'}</td></tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    const form = document.getElementById('product-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      form.querySelector('button').disabled = true;
      try {
        await createProduct(fd);
        form.reset();
        load();
      } catch (err) {
        alert('Error guardando producto');
      } finally {
        form.querySelector('button').disabled = false;
      }
    });
  } catch (e) {
    app.innerHTML = '<div class="text-red-600 font-semibold">Fallo cargando datos.</div>';
  }
}

load();
