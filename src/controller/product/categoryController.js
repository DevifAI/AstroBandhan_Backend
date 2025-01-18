import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import Product from "../../models/product/product.model.js";
import ProductCategory from "../../models/product/productCategory.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fs from "fs";

// Create Product Category
export const createProductCategory = asyncHandler(async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    if (!req.file) {
      throw new ApiError(400, "Category image is required");
    }

    // Upload the image to Cloudinary
    const localFilePath = req.file.path;
    const uploadResult = await uploadOnCloudinary(localFilePath);

    // Delete the local file after uploading
    fs.unlinkSync(localFilePath);

    if (!uploadResult || !uploadResult.secure_url) {
      throw new ApiError(500, "Image upload failed");
    }

    const existingCategory = await ProductCategory.findOne({ category_name });

    if (existingCategory) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Product category already exists"));
    }

    const newCategory = new ProductCategory({
      category_name,
      image: uploadResult.secure_url,
    });

    await newCategory.save();

    const savedCategory = await ProductCategory.findById(
      newCategory._id
    ).select("-createdAt -updatedAt");

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          savedCategory,
          "Product category created successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get All Categories
export const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await ProductCategory.find();

    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No product categories found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          categories,
          "Product categories retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Category by ID
export const getCategoryById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ProductCategory.findById(id);

    if (!category) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          category,
          "Product category retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Update Category by ID
export const updateCategoryById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    // Find the existing category
    const existingCategory = await ProductCategory.findById(id);

    if (!existingCategory) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

    let updatedImageUrl = existingCategory.image;

    // If a new image is uploaded, replace the old one
    if (req.file) {
      const localFilePath = req.file.path;

      // Upload the new image to Cloudinary
      const uploadResult = await uploadOnCloudinary(localFilePath);
      fs.unlinkSync(localFilePath); // Remove the local file after uploading

      if (!uploadResult || !uploadResult.secure_url) {
        throw new ApiError(500, "Image upload failed");
      }

      updatedImageUrl = uploadResult.secure_url;

      // Optional: Delete the old image from Cloudinary
      if (existingCategory.image) {
        const publicId = existingCategory.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`astrologer-avatars/${publicId}`);
      }
    }

    // Update the category
    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      id,
      { category_name, image: updatedImageUrl },
      { new: true, runValidators: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedCategory,
          "Product category updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Delete Category
export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ProductCategory.findByIdAndDelete(id);

    if (!category) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Product category deleted successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Fetch Total Products by Category
export const fetchTotalProductByCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the category exists
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

    // Fetch products and count the total number of products in the category
    const products = await Product.find({ category: id });

    // Check if products exist in the category
    if (products.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No products found in this category"));
    }

    const totalProducts = products.length;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totalProducts, products },
          "Total products in category retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});
