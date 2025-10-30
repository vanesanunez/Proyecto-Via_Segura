const BASE = 'https://nominatim.openstreetmap.org'

//const BASE = '/nominatim' 

const headers={
    
    'Accept':'application/json',
    'User-Agent': 'ViaSeguraApp/1.0 (Proyecto escolar - Escuela Da Vinci)'    
}

// Texto → coordenadas (sugerencias)
export async function nominatimSearch(
  query,
  { countrycodes = 'ar', limit = 10, lang = 'es', viewbox = null, bounded = 0, layer = 'address', dedupe = 0 } = {}
) {
  const url = new URL(`${BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('accept-language', lang)
  if (countrycodes) url.searchParams.set('countrycodes', countrycodes)
  if (viewbox) url.searchParams.set('viewbox', viewbox)          // lon1,lat1,lon2,lat2
  if (bounded) url.searchParams.set('bounded', String(bounded))   // 0 = sesgo, 1 = filtro duro
  if (layer) url.searchParams.set('layer', layer)                 // 'address' prioriza calles/alturas
  url.searchParams.set('dedupe', String(dedupe))                  // 0 = NO deduplicar (queremos varias "Las Flores")

  const res = await fetch(url, { headers, referrer: 'ViaSeguraApp/1.0 (Proyecto escolar - Escuela Da Vinci)'})
  if (!res.ok) throw new Error('Nominatim search error')
  return res.json()
}

// Coordenadas → dirección
export async function nominatimReverse(lat, lon, { lang = 'es' } = {}) {
  const url = new URL(`${BASE}/reverse`)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', lang)

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error('Nominatim reverse error')
  return res.json() // { display_name, address:{...}, lat, lon }
}

// Formato legible
export function composeAddress(addr = {}) {
  const calle = [addr.road, addr.pedestrian, addr.footway, addr.cycleway, addr.path, addr.residential].find(Boolean)
  const altura = addr.house_number
  const calleAltura = [calle, altura].filter(Boolean).join(' ')

  const barrio = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter

  const rawCity = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.state
  const ciudad = rawCity && /autónoma.*buenos aires|caba|ciudad de buenos aires/i.test(rawCity) ? 'CABA' : rawCity

  const partes = []
  if (calleAltura) partes.push(calleAltura)
  if (barrio) partes.push(barrio)
  if (ciudad) partes.push(ciudad)
  return partes.length ? partes.join(', ') : (addr.state || '')
}
