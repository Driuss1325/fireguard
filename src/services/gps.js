let cache = null; // { lat, lng, accuracy, ts }

export function getGeo(options = { enableHighAccuracy: true, timeout: 8000 }) {
  if (cache && Date.now() - cache.ts < 60_000) return Promise.resolve(cache); // 1 min

  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords || {};
        cache = { lat: latitude, lng: longitude, accuracy, ts: Date.now() };
        resolve(cache);
      },
      () => resolve(null),
      options
    );
  });
}
