// Servicio para obtener la ruta recomendada entre dos puntos
// Usando OSRM (Open Source Routing Machine)

export async function getRoute(lat1, lon1, lat2, lon2) {
    const url = `https://router.project-osrm.org/route/v1/foot/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
  
    try {
      const res = await fetch(url);
      const data = await res.json();
  
      if (!data.routes || !data.routes.length) {
        throw new Error("No se pudo obtener una ruta recomendada");
      }
  
      // Convertir [lng, lat] → [lat, lng] para Leaflet
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch (err) {
      console.error("[directions] Error obteniendo ruta:", err);
      return null;
    }
  }
  