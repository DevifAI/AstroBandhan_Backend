import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productCategorySchema = new Schema(
  {
    category_name: {
      type: String,
      trim: true,
      required: [true, "Category name is required"],
    },
    image: {
      type: String,
      required: [true, "Category image is required"],
    },
  },
  {
    timestamps: true,
  }
);

const ProductCategory = model("ProductCategory", productCategorySchema);

export default ProductCategory;
