// C:\DevaRaagam\controllers\userController\landingPageController.js
// const Product = require('../../models/productSchema'); // Uncomment if you fetch real products

const getLandingPage = async (req, res) => {
  try {
    // Example: Simulate fetching data. Replace with actual database calls later.
    const heroProductData = {
      category: "On-Ear Max",
      name: "DevaRaagam Pro",
      description:
        "Experience pure audio bliss with our top-of-the-line DevaRaagam Pro. Unmatched clarity, deep bass, and all-day comfort.",
      id: "DRPRO-001", // Example product ID
      price: "399",
    };

    const featuredProductsData = [
      {
        id: "DRSTYLE1",
        name: "Style One",
        price: "249",
        imagePath: "/images/home-page/product1.png",
      },
      {
        id: "DRSTYLE2",
        name: "Style Two",
        price: "279",
        imagePath: "/images/home-page/product2.png",
      },
      {
        id: "DRSTYLE3",
        name: "Style Three",
        price: "299",
        imagePath: "/images/home-page/product3.png",
      },
      // Add more products if your template uses them (product4.png, product5.png)
      {
        id: "DRSTYLE4",
        name: "Style Four",
        price: "259",
        imagePath: "/images/home-page/product4.png",
      },
      {
        id: "DRSTYLE5",
        name: "Style Five",
        price: "269",
        imagePath: "/images/home-page/product5.png",
      },
    ];

    // Simulate cart count (replace with your actual cart logic)
    let currentCartCount = 0;
    if (req.session.cart && Array.isArray(req.session.cart.items)) {
      currentCartCount = req.session.cart.items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    } else if (req.session.user_id && !req.session.cart) {
      // Placeholder if user is logged in but cart logic isn't fully integrated yet
      // You might fetch cart count from DB here for logged-in users
    }

    res.render("user/landing", {
      title: "DevaRaagam Headphones - Immerse Yourself", // Pass title to EJS
      isAuthenticated: !!req.session.user_id,
      user: req.session.user_id
        ? { id: req.session.user_id, email: req.session.user_email }
        : null,
      cartCount: currentCartCount, // Ensure cartCount is always a number
      heroProduct: heroProductData,
      featuredProducts: featuredProductsData,
    });
  } catch (error) {
    console.error("Error rendering landing page:", error);
    res.status(500).send("Error loading page. Please try again later.");
  }
};

module.exports = {
  getLandingPage,
};
