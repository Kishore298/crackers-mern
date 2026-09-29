/**
 * priceUtils.js
 *
 * Single authoritative price calculation for the VCrackers frontend.
 *
 * Price field hierarchy (from Product model):
 *   - price          : MRP / base price
 *   - discountedPrice: Manually set selling price (lower than MRP)
 *   - discountPercent: Only used for combo products
 *
 * Global Discount:
 *   - A site-wide discount percentage fetched from /api/discount
 *   - When active, applies to base price of regular products
 *   - Combos use their own discountPercent instead
 *
 * Authoritative rule:
 *   Combo  → price * (1 - discountPercent/100)  if discountPercent > 0, else price
 *   Normal → if globalDiscountPct > 0: Math.round(price * (1 - globalDiscountPct/100))
 *            else if discountedPrice is set and < price: discountedPrice
 *            else: price
 */

/**
 * Calculate the effective selling price for a product.
 *
 * @param {object} product  - Product object (from API or localStorage)
 * @param {number} [globalDiscountPct=0] - Global discount percentage (0 means no active discount)
 * @returns {number} The price the customer should pay per unit
 */
export const getEffectivePrice = (product, globalDiscountPct = 0) => {
  if (!product) return 0;

  const basePrice = product.price ?? 0;

  if (product.isCombo) {
    const pct = product.discountPercent || 0;
    return pct > 0 ? Math.round(basePrice * (1 - pct / 100)) : basePrice;
  }

  // Regular product
  if (globalDiscountPct > 0) {
    return Math.round(basePrice * (1 - globalDiscountPct / 100));
  }

  // Fall back to discountedPrice if it is set and actually lower
  if (product.discountedPrice && product.discountedPrice < basePrice) {
    return product.discountedPrice;
  }

  return basePrice;
};

/**
 * Returns whether a discount badge should be shown for this product.
 */
export const hasDiscount = (product, globalDiscountPct = 0) => {
  if (!product) return false;
  if (product.isCombo) return (product.discountPercent || 0) > 0;
  if (globalDiscountPct > 0) return true;
  return !!(product.discountedPrice && product.discountedPrice < product.price);
};

/**
 * Returns the display discount percentage string for a product.
 */
export const getDiscountPct = (product, globalDiscountPct = 0) => {
  if (!product) return 0;
  if (product.isCombo) return product.discountPercent || 0;
  if (globalDiscountPct > 0) return globalDiscountPct;
  if (product.discountedPrice && product.discountedPrice < product.price) {
    return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
  }
  return 0;
};
