import supabase from "./supabase";

/**
 * Sube una imagen al bucket y devuelve la URL pública
 */
export async function uploadImage(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("report-images")
    .upload(fileName, file);
  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from("report-images")
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}

/**
 * Guarda un nuevo reporte
 */
export async function saveReport(data) {
  const { error } = await supabase.from("reports").insert({
    categoria: data.categoria,
    descripcion: data.descripcion,
    ubicacion: data.ubicacion,
    latitud: data.latitud,
    longitud: data.longitud,
    imagen: data.imagen,
    user_id: data.user_id,
    email: data.email,
    estado: data.estado || "Pendiente",
    apoyos: data.apoyos ?? 0,
  });
  if (error) {
    console.error("[reports.js saveReport] Error al guardar reporte:", error);
    throw error;
  }
}

/**
 * Trae todos los reportes (sin paginar)
 */
export async function fetchAllReports() {
  const { data, error } = await supabase.from("reports").select("*");
  if (error) throw error;
  return data;
}

/**
 * Realtime: nuevos reportes
 */
export function subscribeToNewReports(callback) {
  return supabase
    .channel("realtime:public:reports")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reports" },
      (payload) => callback(payload.new)
    )
    .subscribe();
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

  let query = supabase.from("reports").select("*", { count: "exact" });

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
      query = query.gt("apoyos", 0).order("apoyos", { ascending: false });
      break;

    case "least_supported":
      query = query.gt("apoyos", 0).order("apoyos", { ascending: true });
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
export async function fetchUserReportsPageWithCount({
  userId,
  page = 1,
  pageSize = 2,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: false })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
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
export async function joinReport(reportId, userId) {
  try {
    // 1) verifico si ya existe el apoyo
    const { data: existingSupport, error: existingError } = await supabase
      .from("report_supports")
      .select("id")
      .eq("report_id", reportId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("Error verificando apoyo existente:", existingError);
      throw existingError;
    }

    // 2) si ya existe, no vuelvo a insertar
    if (existingSupport) {
      const { count, error: countError } = await supabase
        .from("report_supports")
        .select("*", { count: "exact", head: true })
        .eq("report_id", reportId);

      if (countError) {
        console.error("Error contando apoyos:", countError);
        throw countError;
      }

      return {
        status: "already_supported",
        apoyos: count ?? 0,
      };
    }

    // 3) inserto el apoyo
    const { error: insertError } = await supabase
      .from("report_supports")
      .insert({
        report_id: reportId,
        user_id: userId,
      });

    if (insertError) {
      console.error("Error registrando apoyo:", insertError);
      throw insertError;
    }

    // 4) cuento apoyos reales
    const { count, error: countError } = await supabase
      .from("report_supports")
      .select("*", { count: "exact", head: true })
      .eq("report_id", reportId);

    if (countError) {
      console.error("Error contando apoyos:", countError);
      throw countError;
    }

    const totalApoyos = count ?? 0;

    // 5) sincronizo reports.apoyos con el total real
    const { error: updateError } = await supabase
      .from("reports")
      .update({ apoyos: totalApoyos })
      .eq("id", reportId);

    if (updateError) {
      console.error("Error actualizando apoyos en reports:", updateError);
      throw updateError;
    }

    return {
      status: "supported",
      apoyos: totalApoyos,
    };
  } catch (e) {
    console.error("Fallo inesperado sumando apoyo:", e);
    throw e;
  }
}

export async function fetchUserSupportedReportIds(userId, reportIds = []) {
  if (!userId || reportIds.length === 0) return [];

  const { data, error } = await supabase
    .from("report_supports")
    .select("report_id")
    .eq("user_id", userId)
    .in("report_id", reportIds);

  if (error) {
    console.error("[reports.js fetchUserSupportedReportIds] Error:", error);
    throw error;
  }

  return (data ?? []).map((item) => item.report_id);
}

export async function fetchAdminReports({
  limit = 10,
  orderBy = "recent",
  status = "all",
} = {}) {
  let query = supabase
    .from("reports")
    .select("id, categoria,descripcion, ubicacion, estado, apoyos, email, created_at");

  if (status === "pending") {
    query = query.eq("estado", "Pendiente");
  }

  if (status === "resolved") {
    query = query.eq("estado", "Resuelto");
  }

  switch (orderBy) {
    case "most_supported":
      query = query.order("apoyos", { ascending: false });
      break;

    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("[reports.js fetchAdminReports] Error al traer reportes admin:", error);
    throw error;
  }

  return data ?? [];
}

export async function updateReportStatus(reportId, newStatus) {
  const { data, error } = await supabase
    .from("reports")
    .update({ estado: newStatus })
    .eq("id", reportId)
    .select("id, estado")
    .single();

  if (error) {
    console.error("[reports.js updateReportStatus] Error al actualizar estado:", error);
    throw error;
  }

  return data;
}

export async function deleteReport(reportId) {
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    console.error("[reports.js deleteReport] Error al eliminar reporte:", error);
    throw error;
  }
}

export async function fetchReportById(reportId) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    console.error("[reports.js fetchReportById] Error al traer reporte:", error);
    throw error;
  }

  return data;
}

export async function updateReport(reportId, reportData) {
  const { data, error } = await supabase
    .from("reports")
    .update({
      categoria: reportData.categoria,
      descripcion: reportData.descripcion,
      ubicacion: reportData.ubicacion,
      estado: reportData.estado,
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) {
    console.error("[reports.js updateReport] Error al actualizar reporte:", error);
    throw error;
  }

  return data;
}

// Reportes activos con coordenadas, para calcular riesgo en la ruta
export async function fetchActiveReportsWithCoords() {
  const { data, error } = await supabase
    .from("reports")
    .select("id, categoria, estado, ubicacion, latitud, longitud")
    .neq("estado", "Resuelto")
    .not("latitud", "is", null)
    .not("longitud", "is", null);

  if (error) {
    console.error("[reports.js fetchActiveReportsWithCoords] Error:", error);
    throw error;
  }

  return data ?? [];
}