export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  
    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Método no permitido",
      });
    }
  
    try {
      const query = new URL(req.url, `http://${req.headers.host}`);
  
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search${query.search}`,
        {
          headers: {
            "User-Agent":
              "ViaSegura/1.0 (Proyecto escolar - Escuela Da Vinci)",
            "Accept-Language": "es",
          },
        }
      );
  
      const text = await response.text();
  
      res.status(response.status).send(text);
    } catch (err) {
      console.error(err);
  
      res.status(500).json({
        error: "No fue posible consultar Nominatim.",
      });
    }
  }