import supabase from "./supabase";

export async function fetchActiveBenefits() {
  const { data, error } = await supabase
    .from("benefits")
    .select(
      `
        id,
        title,
        description,
        partner_name,
        points_cost,
        stock,
        image_url,
        valid_until
      `,
    )
    .order("points_cost", { ascending: true });

  if (error) {
    console.error("[benefits] Error trayendo beneficios:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchAvailablePoints(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("available_points")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[benefits] Error trayendo puntos:", error);
    throw error;
  }

  return data?.available_points ?? 0;
}