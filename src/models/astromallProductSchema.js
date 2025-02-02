import mongoose from 'mongoose';

// Schema definition for AstroMallProduct
onClose();st astroMallProductSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category', // Assuming you have a Category model for different product categories
      required: true 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discountPrice: { 
      type: Number, 
      min: 0, 
      default: null // Optional discount price
    },
    stockQuantity: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    images: [{ 
      type: String, // URLs to product images
      required: true 
    }],
    isFeatured: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductReviews', // Referencing the Review collection
    }],
  },
  { timestamps: true }
);

// Creating the model for AstroMallProduct
const AstroMallProduct = mongoose.model('AstroMallProduct', astroMallProductSchema);

export default AstroMallProduct;
