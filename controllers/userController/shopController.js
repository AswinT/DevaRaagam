// C:\DevaRaagam\controllers\userController\shopController.js
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema"); // For category filter
// Make sure you have this offer-helper.js utility if you plan to use product/category offers
// If not, you can remove the offer-related lines for now.
const {
  getActiveOfferForProduct,
  calculateDiscount,
} = require("../../utils/offer-helper");

const getShopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9; // 9 products per page (3x3 grid)
    const skip = (page - 1) * limit;

    // --- Filter Criteria ---
    let query = { isListed: true, isDeleted: false };

    // Category Filter
    const categoryName = req.query.category; // Assuming category name is passed in query
    if (categoryName) {
      const category = await Category.findOne({
        name: categoryName,
        isListed: true,
      });
      if (category) {
        query.category = category._id;
      } else {
        // Category not found, so no products will match this part of query if name is invalid
        // Or handle as an error / "category not found" message
        console.warn(
          `Category filter: Category named "${categoryName}" not found or not listed.`
        );
      }
    }

    // Brand Filter
    if (req.query.brand) {
      const brands = Array.isArray(req.query.brand)
        ? req.query.brand
        : [req.query.brand];
      query.brand = {
        $in: brands.map(
          (b) =>
            new RegExp(
              `^<span class="math-inline">\{b\.replace\(/\[\-\\/\\\\^</span>*+?.()|[\]{}]/g, '\\<span class="math-inline">&'\)\}</span>`,
              "i"
            )
        ),
      }; // Case-insensitive exact match
    }

    // Headphone Type Filter
    if (req.query.type) {
      const types = Array.isArray(req.query.type)
        ? req.query.type
        : [req.query.type];
      query.headphoneType = { $in: types };
    }

    // Connectivity Filter
    if (req.query.connectivity) {
      const connectivities = Array.isArray(req.query.connectivity)
        ? req.query.connectivity
        : [req.query.connectivity];
      query.connectivity = { $in: connectivities };
    }

    // Search Query Filter
    if (req.query.search) {
      const searchRegex = new RegExp(
        req.query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
        "i"
      );
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        // Add other fields you want to search by, like category name if you populate it before search
      ];
    }

    // Price Filter needs to be applied AFTER fetching and calculating effective prices due to offers
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    // --- Sorting Options ---
    const sortOption = req.query.sort || "newest";
    let sortQuery = {};
    // Initial sort before offer calculation (can be refined if sorting by price)
    switch (sortOption) {
      case "price-asc":
        sortQuery = { salePrice: 1 }; // Base price sort
        break;
      case "price-desc":
        sortQuery = { salePrice: -1 }; // Base price sort
        break;
      case "name-asc":
        sortQuery = { title: 1 };
        break;
      case "name-desc":
        sortQuery = { title: -1 };
        break;
      case "newest":
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    let allMatchingProducts = await Product.find(query)
      .populate("category", "name")
      .sort(sortQuery)
      .lean();

    const productsWithOffersAndPriceFilter = [];
    for (const product of allMatchingProducts) {
      const offer = await getActiveOfferForProduct(
        product._id,
        product.category ? product.category._id : null
      );
      // Use salePrice as the base for applying offers, or regularPrice if salePrice isn't intended as a pre-discounted price
      const {
        finalPrice,
        discountPercentage,
        discountAmount,
        title: offerTitle,
      } = calculateDiscount(offer, product.salePrice);

      product.effectivePrice = finalPrice;
      product.offerDetails = offer
        ? { discountPercentage, discountAmount, title: offerTitle }
        : null;

      if (
        product.effectivePrice >= minPrice &&
        product.effectivePrice <= maxPrice
      ) {
        productsWithOffersAndPriceFilter.push(product);
      }
    }

    // If sorting by price, re-sort now based on effectivePrice
    if (sortOption === "price-asc") {
      productsWithOffersAndPriceFilter.sort(
        (a, b) => a.effectivePrice - b.effectivePrice
      );
    } else if (sortOption === "price-desc") {
      productsWithOffersAndPriceFilter.sort(
        (a, b) => b.effectivePrice - a.effectivePrice
      );
    }

    const totalProducts = productsWithOffersAndPriceFilter.length;
    const paginatedProducts = productsWithOffersAndPriceFilter.slice(
      skip,
      skip + limit
    );
    const totalPages = Math.ceil(totalProducts / limit);

    // --- Data for Filters UI ---
    const categories = await Category.find({ isListed: true })
      .select("name")
      .lean(); // Only fetch names
    const brands = await Product.distinct("brand", {
      isListed: true,
      isDeleted: false,
    });
    const headphoneTypes = await Product.distinct("headphoneType", {
      isListed: true,
      isDeleted: false,
    });
    const connectivities = await Product.distinct("connectivity", {
      isListed: true,
      isDeleted: false,
    });

    let queryParams = { ...req.query };
    delete queryParams.page;
    const queryString = new URLSearchParams(queryParams).toString();

    // Cart count from session (example)
    let currentCartCount = 0;
    if (req.session.cart && Array.isArray(req.session.cart.items)) {
      currentCartCount = req.session.cart.items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }

    res.render("user/products", {
      title: "Our Headphones Collection",
      products: paginatedProducts,
      categories,
      brands,
      headphoneTypes,
      connectivities,
      currentPage: page,
      totalPages,
      totalProducts,
      limit,
      currentFilters: {
        category: categoryName || "",
        brand: Array.isArray(req.query.brand)
          ? req.query.brand
          : req.query.brand
          ? [req.query.brand]
          : [],
        type: Array.isArray(req.query.type)
          ? req.query.type
          : req.query.type
          ? [req.query.type]
          : [],
        connectivity: Array.isArray(req.query.connectivity)
          ? req.query.connectivity
          : req.query.connectivity
          ? [req.query.connectivity]
          : [],
        minPrice: req.query.minPrice || "",
        maxPrice: req.query.maxPrice || "",
        sort: sortOption,
        search: req.query.search || "",
      },
      queryString,
      isAuthenticated: !!req.session.user_id,
      user: req.session.user_id
        ? { id: req.session.user_id, email: req.session.user_email }
        : null,
      cartCount: currentCartCount,
    });
  } catch (error) {
    console.error("Error in rendering shop page:", error);
    res.status(500).render("user/error-page", {
      // Assuming you have an error page
      message: "Could not load products at this time. Please try again later.",
      errorStatus: 500,
      isAuthenticated: !!req.session.user_id,
      user: req.session.user_id
        ? { id: req.session.user_id, email: req.session.user_email }
        : null,
    });
  }
};

module.exports = { getShopPage };
