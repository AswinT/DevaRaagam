const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      // Name of the headphone model, e.g., "DevaRaagam Pro X"
      type: String,
      required: [true, "Product title is required."],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      trim: true,
    },
    brand: {
      // e.g., "Sony", "Bose", "Sennheiser", "DevaRaagam"
      type: String,
      required: [true, "Brand is required."],
      trim: true,
      index: true,
    },
    modelNumber: {
      // Optional: Specific model number from the manufacturer
      type: String,
      trim: true,
      index: true,
      sparse: true, // Allows it to be unique if present, but also allows multiple nulls/absences
    },
    category: {
      // e.g., "Gaming", "Studio", "Wireless", "Sports"
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required."],
    },
    headphoneType: {
      // e.g., "Over-Ear", "On-Ear", "In-Ear", "True Wireless"
      type: String,
      required: [true, "Headphone type is required."],
      enum: ["Over-Ear", "On-Ear", "In-Ear", "True Wireless", "Neckband"],
      index: true,
    },
    connectivity: {
      // e.g., "Wireless", "Wired", "Hybrid" (both)
      type: String,
      required: [true, "Connectivity type is required."],
      enum: ["Wireless", "Wired", "Hybrid"],
      index: true,
    },
    color: {
      type: String,
      trim: true,
    },
    features: [String], // e.g., ["Noise Cancelling", "Water Resistant", "Mic Included", "Foldable"]

    regularPrice: {
      // The normal price before any discounts or sales
      type: Number,
      required: [true, "Regular price is required."],
      min: [0, "Price cannot be negative."],
    },
    salePrice: {
      // The current selling price (could be same as regularPrice or discounted)
      type: Number,
      required: [true, "Sale price is required."],
      min: [0, "Price cannot be negative."],
      validate: [
        function (value) {
          // Sale price should not be greater than regular price
          return value <= this.regularPrice;
        },
        "Sale price cannot be greater than regular price.",
      ],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock cannot be negative."],
      default: 0,
    },
    sku: {
      // Stock Keeping Unit - Optional, but good for inventory management
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple nulls if not all products have SKU
    },

    // Technical Specifications (examples, add more as needed)
    driverSize: { type: String, trim: true }, // e.g., "40mm"
    frequencyResponse: { type: String, trim: true }, // e.g., "20Hz - 20kHz"
    impedance: { type: String, trim: true }, // e.g., "32 Ohms"
    sensitivity: { type: String, trim: true }, // e.g., "105dB"
    batteryLife: { type: String, trim: true }, // e.g., "Up to 40 hours" (for wireless)
    weight: { type: String, trim: true }, // e.g., "250g"

    mainImage: {
      // URL to the main product image
      type: String,
      required: [true, "Main image is required."],
    },
    subImages: [{ type: String }], // Array of URLs to additional product images

    isListed: {
      // Whether the product is visible to customers
      type: Boolean,
      default: true,
    },
    isDeleted: {
      // For soft deletes
      type: Boolean,
      default: false,
    },
    isFeatured: {
      // To mark products for special display (e.g., on landing page)
      type: Boolean,
      default: false,
    },

    // Placeholder for future enhancements
    // averageRating: { type: Number, default: 0, min: 0, max: 5 },
    // numberOfReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Auto-update 'updatedAt' timestamp before saving
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequently queried fields to improve performance
productSchema.index({ title: "text", description: "text", brand: "text" }); // For text search
productSchema.index({
  category: 1,
  brand: 1,
  headphoneType: 1,
  connectivity: 1,
});
productSchema.index({ salePrice: 1, regularPrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, isListed: 1 });

module.exports = mongoose.model("Product", productSchema);
