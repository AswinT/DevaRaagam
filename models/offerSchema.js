// C:\DevaRaagam\models\offerSchema.js
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Offer title is required."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: [true, "Discount type is required."],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required."],
      min: 0,
    },
    appliesTo: {
      type: String,
      enum: [
        "all_products",
        "specific_products",
        "all_categories",
        "specific_categories",
      ],
      required: [true, "Offer applicability type is required."],
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Ensure your Product model is named 'Product'
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Ensure your Category model is named 'Category'
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required."],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required."],
      validate: [
        function (value) {
          // End date must be after start date
          return this.startDate <= value;
        },
        "End date must be after start date.",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdByAdmin: {
      // Optional: if you track who created the offer
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your admin users are also in the 'User' collection with an isAdmin flag
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for searching and sorting
offerSchema.index({ title: "text" });
offerSchema.index({ isActive: 1, endDate: 1, startDate: 1 });
offerSchema.index({ appliesTo: 1 });

// Custom validation (from your Chapterless project, slightly adapted)
offerSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    //This was already in your schema. endDate should be greater than or equal to startDate.
    //If strictly after: this.startDate > this.endDate
  }

  if (
    this.discountType === "percentage" &&
    (this.discountValue <= 0 || this.discountValue > 100)
  ) {
    return next(new Error("Percentage discount must be between 1 and 100."));
  }
  if (this.discountType === "fixed" && this.discountValue <= 0) {
    return next(new Error("Fixed discount must be greater than 0."));
  }

  if (
    this.appliesTo === "specific_products" &&
    (!this.applicableProducts || this.applicableProducts.length === 0)
  ) {
    return next(
      new Error(
        "Please select at least one product for a product-specific offer."
      )
    );
  }
  if (
    this.appliesTo === "specific_categories" &&
    (!this.applicableCategories || this.applicableCategories.length === 0)
  ) {
    return next(
      new Error(
        "Please select at least one category for a category-specific offer."
      )
    );
  }

  // Clear irrelevant arrays based on appliesTo
  if (
    this.appliesTo === "all_products" ||
    this.appliesTo === "all_categories"
  ) {
    this.applicableProducts = [];
    this.applicableCategories = [];
  } else if (this.appliesTo === "specific_products") {
    this.applicableCategories = [];
  } else if (this.appliesTo === "specific_categories") {
    this.applicableProducts = [];
  }

  next();
});

module.exports = mongoose.model("Offer", offerSchema);
