// api/_lib/plan-limits.js

export const PLAN_LIMITS = {
  starter: { prebuilt: 1, custom: 0, total: 1 },
  pro:     { prebuilt: 3, custom: 1, total: 3 },
  premium: { prebuilt: Infinity, custom: Infinity, total: Infinity },
};

export function canAddBasket(plan, currentCount, basketType, addOns = {}) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

  // Check if the user purchased the Extra Basket add-on
  const hasExtraBasket = addOns?.extraBasket === true;
  
  // Calculate effective limits
  const effectiveTotal = limits.total + (hasExtraBasket ? 1 : 0);
  const effectiveCustom = limits.custom + (hasExtraBasket ? 1 : 0);

  if (currentCount >= effectiveTotal) {
    return {
      allowed: false,
      reason: `Your ${plan} plan allows ${effectiveTotal} basket${effectiveTotal === 1 ? '' : 's'}. Upgrade to add more.`,
    };
  }

  if (basketType === 'custom' && effectiveCustom === 0) {
    return {
      allowed: false,
      reason: `Custom baskets are not available on the ${plan} plan. Upgrade to Pro or Premium.`,
    };
  }

  return { allowed: true };
}