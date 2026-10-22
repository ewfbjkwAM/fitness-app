// Brand search and barcode lookup using Open Food Facts (free, no account).
// https://world.openfoodfacts.org — crowd-sourced; Australian coverage is
// good for big brands and supermarket own brands, patchier for small ones.

const FIELDS = 'code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments';
const HOSTS = ['https://au.openfoodfacts.org', 'https://world.openfoodfacts.org'];

const num = (v) => (v === undefined || v === null || v === '' || isNaN(+v) ? null : +v);

function kcalPer100(n) {
  const k = num(n['energy-kcal_100g']);
  if (k !== null) return k;
  const kj = num(n['energy-kj_100g']) ?? num(n.energy_100g);
  return kj !== null ? kj / 4.184 : null;
}

function clean(p) {
  const n = p.nutriments || {};
  const k100 = kcalPer100(n);
  const p100 = num(n.proteins_100g);
  if (k100 === null) return null;
  const servingG = num(p.serving_quantity);
  let kServ = num(n['energy-kcal_serving']);
  if (kServ === null && servingG) kServ = (k100 * servingG) / 100;
  let pServ = num(n.proteins_serving);
  if (pServ === null && servingG && p100 !== null) pServ = (p100 * servingG) / 100;
  return {
    code: p.code || '',
    name: (p.product_name_en || p.product_name || 'Unnamed product').trim(),
    brand: (p.brands || '').split(',')[0].trim(),
    size: p.quantity || '',
    servingLabel: p.serving_size || (servingG ? `${servingG} g` : ''),
    servingG,
    kcal100: k100,
    p100: p100 ?? 0,
    kcalServing: kServ,
    pServing: pServ,
  };
}

async function getJSON(url, ms = 9000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function searchFoods(q) {
  const term = encodeURIComponent(q.trim());
  let lastErr = null;
  for (const host of HOSTS) {
    try {
      const data = await getJSON(`${host}/cgi/search.pl?search_terms=${term}&search_simple=1&action=process&json=1&page_size=24&fields=${FIELDS}`);
      const list = (data.products || []).map(clean).filter(Boolean);
      if (list.length) return list;
    } catch (e) { lastErr = e; }
  }
  if (lastErr) throw lastErr;
  return [];
}

export async function lookupBarcode(code) {
  const c = String(code).replace(/\D/g, '');
  if (!c) return null;
  const data = await getJSON(`https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=${FIELDS}`);
  if (data.status !== 1 || !data.product) return null;
  return clean({ ...data.product, code: c });
}

// amount: { mode: 'serving', count } or { mode: 'grams', grams }
export function nutritionFor(food, amount) {
  if (amount.mode === 'serving' && food.kcalServing !== null) {
    return { kcal: Math.round(food.kcalServing * amount.count), p: Math.round((food.pServing ?? 0) * amount.count) };
  }
  const g = amount.grams || 0;
  return { kcal: Math.round((food.kcal100 * g) / 100), p: Math.round((food.p100 * g) / 100) };
}

export const canScan = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

// Opens the back camera in `videoEl` and resolves with the first barcode seen.
export async function scanBarcode(videoEl, { signal } = {}) {
  const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  videoEl.srcObject = stream;
  await videoEl.play();
  const stop = () => stream.getTracks().forEach((t) => t.stop());
  try {
    while (!signal?.aborted) {
      try {
        const codes = await detector.detect(videoEl);
        if (codes.length) return codes[0].rawValue;
      } catch (e) { /* frame not ready */ }
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  } finally { stop(); }
}
