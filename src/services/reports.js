
import supabase from './supabase'

/**
 * Sube una imagen al bucket y devuelve la URL pública
 */
export async function uploadImage(file) {
  const fileName = `${Date.now()}_${file.name}`
  const { error } = await supabase.storage
    .from('report-images')
    .upload(fileName, file)
  if (error) throw error

  const { data: publicData } = supabase
    .storage
    .from('report-images')
    .getPublicUrl(fileName)

  return publicData.publicUrl
}

/**
 * Guarda un nuevo reporte
 */
export async function saveReport(data) {
  const { error } = await supabase
    .from('reports')
    .insert({
      categoria: data.categoria,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      latitud: data.latitud,
      longitud: data.longitud,
      imagen: data.imagen,
      user_id: data.user_id,
      email: data.email,
    })
  if (error) throw error
}

/**
 * Trae todos los reportes (sin paginar)
 */
export async function fetchAllReports() {
  const { data, error } = await supabase.from('reports').select('*')
  if (error) throw error
  return data
}

/**
 * Realtime: nuevos reportes
 */
export function subscribeToNewReports(callback) {
  return supabase
    .channel('realtime:public:reports')
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => callback(payload.new))
    .subscribe()
}

/**
 * Página de reportes + total (todos los usuarios)
 * Orden: más nuevos primero
 */
export async function fetchReportsPageWithCount({ page = 1, pageSize = 5 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

/**
 * Página de reportes + total (SOLO del usuario)
 */
export async function fetchUserReportsPageWithCount({ userId, page = 1, pageSize = 2 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: false })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}