import supabase from "./supabase";

function calculateGamificationUpdate(profile, { type }) {
  const currentPoints = profile?.community_points ?? 0;
  const currentActions = profile?.community_actions ?? 0;
  const currentReports = profile?.reports_created ?? 0;
  const currentSupports = profile?.supports_given ?? 0;
  const bonusUnlocked = profile?.third_contribution_bonus_unlocked ?? false;
  const firstBadgeUnlocked = profile?.first_badge_unlocked ?? false;

  let pointsToAdd = 0;
  let actionsToAdd = 1;

  if (type === "report_created") {
    // +10 por crear reporte +2 por foto válida
    pointsToAdd = 12;
  }

  if (type === "report_supported") {
    // +3 por sumarse a reclamo existente
    pointsToAdd = 3;
  }

  const nextActions = currentActions + actionsToAdd;
  let nextPoints = currentPoints + pointsToAdd;

  let nextReports = currentReports;
  let nextSupports = currentSupports;

  if (type === "report_created") {
    nextReports += 1;
  }

  if (type === "report_supported") {
    nextSupports += 1;
  }

  let nextBonusUnlocked = bonusUnlocked;
  if (!bonusUnlocked && nextActions >= 3) {
    nextPoints += 5; // bonus por 3er aporte
    nextBonusUnlocked = true;
  }

  let nextFirstBadgeUnlocked = firstBadgeUnlocked;
  if (!firstBadgeUnlocked && nextActions >= 4) {
    nextFirstBadgeUnlocked = true;
  }

  return {
    community_points: nextPoints,
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
      "id, community_points, community_actions, reports_created, supports_given, third_contribution_bonus_unlocked, first_badge_unlocked",
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[gamification] Error trayendo gamificación:", error);
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
      "id, community_points, community_actions, reports_created, supports_given, third_contribution_bonus_unlocked, first_badge_unlocked",
    )
    .single();

  if (error) {
    console.error("[gamification] Error premiando reporte:", error);
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
      "id, community_points, community_actions, reports_created, supports_given, third_contribution_bonus_unlocked, first_badge_unlocked",
    )
    .single();

  if (error) {
    console.error("[gamification] Error premiando apoyo:", error);
    throw error;
  }

  return data;
}