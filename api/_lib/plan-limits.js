// api/_lib/plan-limits.js

export const PLAN_LIMITS = {
  starter: { prebuilt: 1, custom: 0, total: 1 },
  pro:     { prebuilt: 3, custom: 1, total: 3 },
  premium: { prebuilt: Infinity, custom: Infinity, total: Infinity },
};

export function canAddBasket(plan, currentCount, basketType) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

  if (currentCount >= limits.total) {
    return {
      allowed: false,
      reason: `Your ${plan} plan allows ${limits.total} basket${limits.total === 1 ? '' : 's'}. Upgrade to add more.`,
    };
  }

  if (basketType === 'custom' && limits.custom === 0) {
    return {
      allowed: false,
      reason: `Custom baskets are not available on the ${plan} plan. Upgrade to Pro or Premium.`,
    };
  }

  return { allowed: true };
}