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

export async function redeemBenefit(benefitId) {
  const { data, error } = await supabase.rpc("redeem_benefit", {
    p_benefit_id: benefitId,
  });

  if (error) {
    console.error("[benefits] Error canjeando beneficio:", error);
    throw error;
  }

  return data?.[0] ?? null;
}