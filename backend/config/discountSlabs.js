/**
 * Automatic Discount Slab Configuration
 *
 * Discounts are applied automatically based on cart subtotal.
 * The backend recalculates independently and never trusts frontend values.
 *
 * Slabs (sorted highest-first for efficient lookup):
 *   ₹12,500+        → ₹1,000 OFF
 *   ₹10,000–₹12,499 → ₹600 OFF
 *   ₹8,000–₹9,999   → ₹400 OFF
 *   ₹6,000–₹7,999   → ₹300 OFF
 *   ₹4,000–₹5,999   → No discount
 *   Below ₹4,000     → Not eligible (blocked by MIN_CART_VALUE)
 */

const MIN_CART_VALUE = 4000;

const DISCOUNT_SLABS = [
  { min: 12500, max: Infinity, discount: 1000, label: "₹12,500 & above" },
  { min: 10000, max: 12499,   discount: 600,  label: "₹10,000 – ₹12,499" },
  { min: 8000,  max: 9999,    discount: 400,  label: "₹8,000 – ₹9,999" },
  { min: 6000,  max: 7999,    discount: 300,  label: "₹6,000 – ₹7,999" },
  { min: 4000,  max: 5999,    discount: 0,    label: "₹4,000 – ₹5,999" },
];

/**
 * Calculate the slab discount for a given subtotal.
 * @param {number} subtotal – cart subtotal (sum of item prices × quantities)
 * @returns {{ discount: number, label: string, nextSlab: { threshold: number, savings: number } | null }}
 */
const calculateSlabDiscount = (subtotal) => {
  const slab = DISCOUNT_SLABS.find((s) => subtotal >= s.min && subtotal <= s.max);
  const discount = slab ? slab.discount : 0;
  const label = slab ? slab.label : "";

  // Find the next higher slab for "add more to save" hint
  let nextSlab = null;
  if (slab) {
    const currentIdx = DISCOUNT_SLABS.indexOf(slab);
    if (currentIdx > 0) {
      const higher = DISCOUNT_SLABS[currentIdx - 1];
      nextSlab = {
        threshold: higher.min,
        savings: higher.discount,
        addMore: higher.min - subtotal,
      };
    }
  } else if (subtotal < 4000) {
    // Below minimum — next slab is the first eligible one
    nextSlab = {
      threshold: 6000,
      savings: 300,
      addMore: 6000 - subtotal,
    };
  }

  return { discount, label, nextSlab };
};

module.exports = { DISCOUNT_SLABS, MIN_CART_VALUE, calculateSlabDiscount };
