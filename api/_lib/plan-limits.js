// api/_lib/plan-limits.js

export const PLAN_LIMITS = {
  free:    { total: 1,        custom: 0,        dailyDca: false, rebalance: false, instantBuy: false },
  starter: { total: 2,        custom: 0,        dailyDca: false, rebalance: false, instantBuy: false },
  pro:     { total: 3,        custom: 1,        dailyDca: false, rebalance: true,  instantBuy: false },
  premium: { total: Infinity, custom: Infinity, dailyDca: true,  rebalance: true,  instantBuy: true  },
};

export function canAddBasket(plan, currentCount, basketType, addOns = {}) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

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