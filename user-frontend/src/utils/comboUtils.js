/**
 * Utilities for Combo products to maintain UI consistency across the app.
 */

/**
 * Returns a filtered list of combo products, removing any self-referencing entries.
 * @param {Object} product The product/combo object
 * @returns {Array} Filtered array of combo products
 */
export const getValidComboProducts = (product) => {
  if (!product?.isCombo || !product.comboProducts?.length) return [];
  return product.comboProducts.filter(
    (cp) => cp.product && typeof cp.product === 'object' && cp.product._id !== product._id && cp.product.name !== product.name
  );
};

/**
 * Returns the number of unique products included in a combo.
 * @param {Object} product The product/combo object
 * @returns {number} The count of unique products
 */
export const getComboProductCount = (product) => {
  return getValidComboProducts(product).length;
};

/**
 * Formats the combo name by appending the product count.
 * Returns the regular product name if it's not a combo.
 * @param {Object} product The product/combo object
 * @returns {string} Formatted name (e.g., "Festival Combo (5 Products)")
 */
export const formatComboName = (product) => {
  if (product?.isCombo && product.comboProducts?.length) {
    const count = getComboProductCount(product);
    return `${product.name} (${count} Products)`;
  }
  return product?.name || "";
};

/**
 * Calculates the original value, savings, and discount percentage for a combo.
 * @param {Object} product The product/combo object
 * @param {number} discountPct Global discount percentage fetched from the server
 * @returns {Object} { originalValue, sellingPrice, savings, discountPercentage, showDiscount }
 */
export const calculateComboStats = (product, discountPct = 0) => {
  const validProducts = getValidComboProducts(product);
  
  if (validProducts.length === 0) {
    return {
      originalValue: product?.price || 0,
      sellingPrice: product?.effectivePrice ?? product?.discountedPrice ?? product?.price ?? 0,
      savings: 0,
      discountPercentage: 0,
      showDiscount: false,
    };
  }

  let totalOriginalValue = validProducts.reduce((sum, cp) => {
    const pData = cp.product;
    if (!pData) return sum;
    const base = pData.price || 0;
    return sum + (base * (cp.quantity || 1));
  }, 0);

  const sellingPrice = product.price || 0;
  const originalValue = totalOriginalValue > sellingPrice ? totalOriginalValue : sellingPrice;
  const savings = originalValue - sellingPrice;
  const discountPercentage = originalValue > 0 ? Math.round((savings / originalValue) * 100) : 0;
  const showDiscount = savings > 0;

  return {
    originalValue,
    sellingPrice,
    savings,
    discountPercentage,
    showDiscount,
  };
};
