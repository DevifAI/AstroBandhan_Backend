// models/Category.js
import mongoose from 'mongoose';

const product_categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category_id: {
    type: String,
    unique: true,
  },
});

product_categorySchema.pre('save', function (next) {
  if (!this.category_id) {
    const randomNum = Math.floor(100 + Math.random() * 900); // Generate random 3-digit number
    this.category_id = `${this.name.charAt(0).toUpperCase()}${randomNum}`;
  }
  next();
});

export const product_category = mongoose.model('product_category', product_categorySchema);
