const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

const RISK_WEIGHT = {
  Seguridad: 3,
  Iluminación: 2,
  Infraestructura: 1,
};

const RISK_RADIUS_METERS = 120;

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function scoreRoute(coords, activeReports) {
  let risk = 0;
  const hazardsFound = new Map();

  // muestreamos la ruta para no comparar cada punto contra cada reporte
  const step = Math.max(1, Math.floor(coords.length / 200));

  for (let i = 0; i < coords.length; i += step) {
    const point = coords[i];

    for (const report of activeReports) {
      const dist = haversineMeters(
        point.lat,
        point.lng,
        report.latitud,
        report.longitud
      );

      if (dist <= RISK_RADIUS_METERS) {
        const weight = RISK_WEIGHT[report.categoria] ?? 1;
        risk += weight;
        hazardsFound.set(report.id, report);
      }
    }
  }

  return { risk, hazards: Array.from(hazardsFound.values()) };
}

/**
 * Pide rutas alternativas a OSRM y devuelve la de menor riesgo,
 * junto con la lista de reportes ("hazards") cercanos a esa ruta.
 */
export async function fetchSafeRoute(from, to, activeReports = []) {
  const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=true&steps=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No se encontró una ruta disponible.");
  }

  const scored = data.routes.map((route) => {
    const coords = route.geometry.coordinates.map((c) => ({
      lat: c[1],
      lng: c[0],
    }));
    const { risk, hazards } = scoreRoute(coords, activeReports);

    return {
      coords,
      distance: route.distance,
      duration: route.duration,
      risk,
      hazards,
    };
  });

  // menor riesgo primero; a igual riesgo, la más rápida
  scored.sort((a, b) => (a.risk !== b.risk ? a.risk - b.risk : a.duration - b.duration));

  return scored[0];
}