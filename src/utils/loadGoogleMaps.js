// Carrega o script do Google Maps JavaScript API (com a lib "places") uma
// única vez, mesmo que várias telas/instâncias peçam ao mesmo tempo.
// Retorna o objeto `window.google` já pronto para uso.
let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadGoogleMaps só pode ser usado no navegador.'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error('VITE_GOOGLE_MAPS_API_KEY não configurada. Defina essa variável no .env.')
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';

    script.onload = () => resolve(window.google);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Não foi possível carregar o Google Maps.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}