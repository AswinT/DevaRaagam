// C:\DevaRaagam\utils\offer-helper.js
const Offer = require("../models/offerSchema"); // Adjust path if models is not one level up
const Product = require("../models/productSchema"); // Adjust path

/**
 * Get active offer for a product
 * @param {string} productId - The product ID
 * @param {string} productCategoryId - The category ID of the product
 * @returns {Promise<Object|null>} - The offer object or null if no active offer
 */
const getActiveOfferForProduct = async (productId, productCategoryId) => {
  try {
    const now = new Date();
    let categoryToQuery = productCategoryId;

    // If categoryId is not provided directly, try to fetch it from the product
    if (!categoryToQuery && productId) {
      const productDoc = await Product.findById(productId)
        .select("category")
        .lean();
      if (productDoc && productDoc.category) {
        categoryToQuery = productDoc.category.toString();
      }
    }

    const offerQueryConditions = [];

    // Offers for "All Products"
    offerQueryConditions.push({ appliesTo: "all_products" });

    // Offers for "Specific Products"
    if (productId) {
      offerQueryConditions.push({
        appliesTo: "specific_products",
        applicableProducts: { $in: [productId] },
      });
    }

    // Offers for "All Categories" - Note: This might be too broad or less specific
    // offerQueryConditions.push({ appliesTo: "all_categories" });

    // Offers for "Specific Categories"
    if (categoryToQuery) {
      offerQueryConditions.push({
        appliesTo: "specific_categories",
        applicableCategories: { $in: [categoryToQuery] },
      });
    }

    // If no specific product or category, don't try to find specific offers for them
    if (offerQueryConditions.length === 0) return null;

    const potentialOffers = await Offer.find({
      $or: offerQueryConditions,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({
        /* Define priority: e.g., specific_products first, then discountValue desc */
      })
      .lean();

    if (!potentialOffers || potentialOffers.length === 0) {
      return null;
    }

    // Prioritize and select the best offer (simplified from your original for now)
    // Your original had more complex prioritization logic
    // This simple version takes the first applicable one based on a sort order you'd define in the query
    // Or implement your more detailed priority logic here.
    // For now, let's assume the DB sort handles some priority, or pick the one with highest discount value.

    let bestOffer = null;
    for (const offer of potentialOffers) {
      if (!bestOffer) {
        bestOffer = offer;
        continue;
      }
      // Example priority: Product-specific > Category-specific > All Products
      // Within same priority, higher discount wins.
      const priority = (o) => {
        if (o.appliesTo === "specific_products") return 1;
        if (o.appliesTo === "specific_categories") return 2;
        if (o.appliesTo === "all_products") return 3;
        return 4; // all_categories or other
      };

      if (priority(offer) < priority(bestOffer)) {
        bestOffer = offer;
      } else if (priority(offer) === priority(bestOffer)) {
        if (offer.discountValue > bestOffer.discountValue) {
          // Simple comparison
          bestOffer = offer;
        }
      }
    }
    return bestOffer;
  } catch (error) {
    console.error("Error fetching active offer for product:", error);
    return null;
  }
};

/**
 * Calculate discount amount and percentage based on offer
 * @param {Object} offer - The offer object
 * @param {number} price - The product price (base price for discount, e.g., regularPrice or salePrice)
 * @returns {Object} - Discount information { discountAmount, discountPercentage, finalPrice, title }
 */
const calculateDiscount = (offer, price) => {
  if (!offer || typeof price !== "number" || price <= 0) {
    return {
      discountAmount: 0,
      discountPercentage: 0,
      finalPrice: price,
      title: null,
    };
  }

  let discountAmount = 0;
  let discountPercentage = 0;

  if (offer.discountType === "percentage") {
    discountAmount = (price * offer.discountValue) / 100;
    discountPercentage = offer.discountValue;
  } else if (offer.discountType === "fixed") {
    discountAmount = offer.discountValue;
    // Calculate percentage for fixed discount for display consistency
    if (price > 0) {
      discountPercentage = (discountAmount / price) * 100;
    }
  }

  // Ensure discount doesn't exceed product price or make it negative
  discountAmount = Math.min(discountAmount, price);
  const finalPrice = Math.max(0, price - discountAmount);

  return {
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    discountPercentage: parseFloat(discountPercentage.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    title: offer.title, // Include offer title
  };
};

module.exports = {
  getActiveOfferForProduct,
  calculateDiscount,
};
