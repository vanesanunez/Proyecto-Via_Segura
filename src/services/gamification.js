import supabase from "./supabase";

function calculateGamificationUpdate(profile, { type }) {
  const currentPoints = profile?.community_points ?? 0;
  const currentAvailablePoints = profile?.available_points ?? 0;
  const currentActions = profile?.community_actions ?? 0;
  const currentReports = profile?.reports_created ?? 0;
  const currentSupports = profile?.supports_given ?? 0;

  const bonusUnlocked =
    profile?.third_contribution_bonus_unlocked ?? false;

  const firstBadgeUnlocked =
    profile?.first_badge_unlocked ?? false;

  let pointsEarned = 0;
  const actionsToAdd = 1;

  // Premio por crear un reporte completo
  if (type === "report_created") {
    // +10 por crear el reporte
    // +2 porque incluye una fotografía válida
    pointsEarned = 12;
  }

  // Premio por apoyar un reporte existente
  if (type === "report_supported") {
    pointsEarned = 3;
  }

  const nextActions = currentActions + actionsToAdd;

  let nextReports = currentReports;
  let nextSupports = currentSupports;

  if (type === "report_created") {
    nextReports += 1;
  }

  if (type === "report_supported") {
    nextSupports += 1;
  }

  // Bonus único por alcanzar el tercer aporte
  let nextBonusUnlocked = bonusUnlocked;

  if (!bonusUnlocked && nextActions >= 3) {
    pointsEarned += 5;
    nextBonusUnlocked = true;
  }

  // Primera insignia al alcanzar cuatro acciones
  let nextFirstBadgeUnlocked = firstBadgeUnlocked;

  if (!firstBadgeUnlocked && nextActions >= 4) {
    nextFirstBadgeUnlocked = true;
  }

  return {
    // Total histórico: nunca se descuenta
    community_points: currentPoints + pointsEarned,

    // Saldo disponible: se podrá gastar en beneficios
    available_points: currentAvailablePoints + pointsEarned,

    community_actions: nextActions,
    reports_created: nextReports,
    supports_given: nextSupports,
    third_contribution_bonus_unlocked: nextBonusUnlocked,
    first_badge_unlocked: nextFirstBadgeUnlocked,
  };
}

export async function fetchUserGamification(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      `
        id,
        community_points,
        available_points,
        community_actions,
        reports_created,
        supports_given,
        third_contribution_bonus_unlocked,
        first_badge_unlocked
      `,
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error(
      "[gamification] Error trayendo gamificación:",
      error,
    );

    throw error;
  }

  return data;
}

export async function rewardUserForReport(userId) {
  const profile = await fetchUserGamification(userId);

  const updatePayload = calculateGamificationUpdate(profile, {
    type: "report_created",
  });

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select(
      `
        id,
        community_points,
        available_points,
        community_actions,
        reports_created,
        supports_given,
        third_contribution_bonus_unlocked,
        first_badge_unlocked
      `,
    )
    .single();

  if (error) {
    console.error(
      "[gamification] Error premiando reporte:",
      error,
    );

    throw error;
  }

  return data;
}

export async function rewardUserForSupport(userId) {
  const profile = await fetchUserGamification(userId);

  const updatePayload = calculateGamificationUpdate(profile, {
    type: "report_supported",
  });

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select(
      `
        id,
        community_points,
        available_points,
        community_actions,
        reports_created,
        supports_given,
        third_contribution_bonus_unlocked,
        first_badge_unlocked
      `,
    )
    .single();

  if (error) {
    console.error(
      "[gamification] Error premiando apoyo:",
      error,
    );

    throw error;
  }

  return data;
}