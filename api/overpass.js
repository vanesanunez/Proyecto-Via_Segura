const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  
  export default async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método no permitido",
      });
    }
  
    const body =
      typeof req.body === "string"
        ? req.body
        : new URLSearchParams(req.body).toString();
  
    let ultimoError = null;
  
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent":
              "ViaSegura/1.0 (Proyecto escolar - Escuela Da Vinci)",
          },
          body,
        });
  
        if (!response.ok) {
          ultimoError = new Error(
            `Servidor respondió ${response.status}`
          );
          continue;
        }
  
        const json = await response.json();
  
        return res.status(200).json(json);
      } catch (err) {
        ultimoError = err;
      }
    }
  
    console.error("Overpass:", ultimoError);
  
    return res.status(500).json({
      error: "No fue posible consultar el servicio de búsqueda.",
    });
  }