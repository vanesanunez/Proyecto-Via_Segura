
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
      estado:data.estado || "Pendiente",
      apoyos:data.apoyos ?? 0,
    })
  if (error) {
    console.error("[reports.js saveReport] Error al guardar reporte:", error);
    throw error;
  }
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
 * Usa un solo parámetro `mode` para filtrar / ordenar
 * mode: "recent" | "oldest" | "pending" | "resolved" | "most_supported" | "least_supported"
 */
export async function fetchReportsPageWithCount({
  page,
  pageSize,
  mode = "recent",
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reports")
    .select("*", { count: "exact" });

  switch (mode) {
    case "pending":
      query = query
        .eq("estado", "Pendiente")
        .order("created_at", { ascending: false });
      break;

    case "resolved":
      query = query
        .eq("estado", "Resuelto")
        .order("created_at", { ascending: false });
      break;

    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;

    case "most_supported":
      query = query
        .gt("apoyos", 0)
        .order("apoyos", { ascending: false });
      break;

    case "least_supported":
      query = query
        .gt("apoyos", 0)
        .order("apoyos", { ascending: true });
      break;

    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { data, count };
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

//Busca reportes parecidos por categoria + texto de la ubicación
export async function searchSimilarReports({ categoria, ubicacion }) {
  // si no hay datos suficientes, directamente no busco
  if (!categoria || !ubicacion || ubicacion.length < 3) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, categoria, ubicacion, apoyos, created_at")
      .eq("categoria", categoria)
      .ilike("ubicacion", `%${ubicacion}%`) 
      .order("created_at", { ascending: false })
      .limit(5); 

    if (error) {
      console.error("Error buscando reportes similares:", error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error("Fallo inesperado buscando similares:", e);
    return [];
  }
}

// Suma 1 apoyo al reporte indicado
export async function joinReport(reportId) {
  try {
    // 1) leer apoyos actuales desde la base
    const { data: current, error: readError } = await supabase
      .from("reports")
      .select("apoyos")
      .eq("id", reportId)
      .single();

    if (readError) {
      console.error("Error leyendo apoyos actuales:", readError);
      throw readError;
    }

    const currentApoyos = current?.apoyos ?? 0;

    // 2) actualizar con +1
    const { data: updated, error: updateError } = await supabase
      .from("reports")
      .update({ apoyos: currentApoyos + 1 })
      .eq("id", reportId)
      .select("apoyos")
      .single();

    if (updateError) {
      console.error("Error actualizando apoyos:", updateError);
      throw updateError;
    }

    return updated; // por si después quuiero usar el valor nuevo
  } catch (e) {
    console.error("Fallo inesperado sumando apoyo:", e);
    throw e;
  }
}
