// NOTE: filename retained as `loadGoogleMaps.js` to avoid churning every
// import site, but this loader now loads **Leaflet + OpenStreetMap** instead
// of Google Maps. OSM tiles are free, need no API key, and have no referrer
// restrictions — which solves the GCP-key configuration headaches.
//
// Public surface stays the same:
//   - loadGoogleMaps()       → resolves with the Leaflet global (window.L)
//   - coordsForDestination() → unchanged
//   - NEPAL_CENTER           → unchanged

const LEAFLET_VERSION = '1.9.4';
const SCRIPT_ID = 'yaatri-leaflet-script';
const CSS_ID = 'yaatri-leaflet-css';
let leafletPromise = null;

const injectCSS = () => {
  if (document.getElementById(CSS_ID)) return;
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  document.head.appendChild(link);
};

const injectScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Map can only load in a browser environment.'));
      return;
    }
    if (window.L) {
      resolve(window.L);
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load from CDN.')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet loaded but window.L is missing.'));
    };
    script.onerror = () => reject(new Error('Leaflet failed to load from CDN — check internet connection.'));
    document.head.appendChild(script);
  });

// Kept the export name so existing imports (`loadGoogleMaps`) keep working.
export const loadGoogleMaps = () => {
  if (leafletPromise) return leafletPromise;
  leafletPromise = (async () => {
    injectCSS();
    return injectScript();
  })().catch((err) => {
    leafletPromise = null;
    throw err;
  });
  return leafletPromise;
};

// Region/district fallback coordinates for destinations that lack lat/lng.
const REGION_COORDS = {
  kathmandu: { lat: 27.7172, lng: 85.3240 },
  lalitpur: { lat: 27.6644, lng: 85.3188 },
  bhaktapur: { lat: 27.6710, lng: 85.4298 },
  pokhara: { lat: 28.2096, lng: 83.9856 },
  kaski: { lat: 28.2096, lng: 83.9856 },
  lamjung: { lat: 28.2769, lng: 84.3661 },
  manang: { lat: 28.6667, lng: 84.0167 },
  mustang: { lat: 28.9985, lng: 83.8447 },
  solukhumbu: { lat: 27.7026, lng: 86.7227 },
  khumbu: { lat: 27.9881, lng: 86.9250 },
  sagarmatha: { lat: 27.9881, lng: 86.9250 },
  rasuwa: { lat: 28.1080, lng: 85.3760 },
  langtang: { lat: 28.2131, lng: 85.5197 },
  dolpo: { lat: 29.0167, lng: 82.9000 },
  dolpa: { lat: 29.0167, lng: 82.9000 },
  mugu: { lat: 29.5333, lng: 82.3667 },
  humla: { lat: 30.0000, lng: 81.7500 },
  jumla: { lat: 29.2769, lng: 82.1841 },
  bajura: { lat: 29.5333, lng: 81.4833 },
  chitwan: { lat: 27.5291, lng: 84.3542 },
  rupandehi: { lat: 27.5705, lng: 83.4612 },
  lumbini: { lat: 27.4833, lng: 83.2833 },
  ilam: { lat: 26.9094, lng: 87.9282 },
  taplejung: { lat: 27.3500, lng: 87.6700 },
  sindhupalchok: { lat: 27.8042, lng: 85.7000 },
  gorkha: { lat: 28.0000, lng: 84.6333 },
  dhading: { lat: 27.8688, lng: 85.0383 },
  nuwakot: { lat: 27.9166, lng: 85.1631 },
  bardiya: { lat: 28.3000, lng: 81.4333 },
  kailali: { lat: 28.7000, lng: 80.7333 },
  dang: { lat: 28.0000, lng: 82.3000 },
  palpa: { lat: 27.8667, lng: 83.5500 },
  syangja: { lat: 28.0959, lng: 83.8744 },
  myagdi: { lat: 28.6000, lng: 83.5667 },
  parbat: { lat: 28.2333, lng: 83.6833 },
  baglung: { lat: 28.2667, lng: 83.5833 },
};

export const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };

export const coordsForDestination = (dest) => {
  if (!dest) return NEPAL_CENTER;
  const lat = Number(dest.latitude);
  const lng = Number(dest.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  const regionKey = String(dest.region || '').toLowerCase().trim();
  if (REGION_COORDS[regionKey]) return REGION_COORDS[regionKey];
  const nameKey = String(dest.name || '').toLowerCase().trim();
  for (const k of Object.keys(REGION_COORDS)) {
    if (nameKey.includes(k)) return REGION_COORDS[k];
  }
  return NEPAL_CENTER;
};
