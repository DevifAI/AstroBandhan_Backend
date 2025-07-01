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
    const { category_name, imageUrl } = req.body;

    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    // Check for existing category
    const existingCategory = await ProductCategory.findOne({ category_name });
    if (existingCategory) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Product category already exists"));
    }

    let finalImageUrl = imageUrl;

    // If file is uploaded (via multipart/form-data), upload to Cloudinary
    if (req.file) {
      const cloudinaryResult = await uploadOnCloudinary(req.file.path);
      if (!cloudinaryResult?.secure_url) {
        throw new ApiError(500, "Cloudinary upload failed");
      }
      finalImageUrl = cloudinaryResult.secure_url;
    }

    if (!finalImageUrl) {
      throw new ApiError(400, "Category image is required");
    }

    const newCategory = await ProductCategory.create({
      category_name,
      imageUrl: finalImageUrl,
    });

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
    throw new ApiError(500, error.message || "Internal server error");
  }
});

// Get All Categories with Product Count
export const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await ProductCategory.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $addFields: {
          totalItems: { $size: "$products" },
        },
      },
      {
        $project: {
          products: 0,
        },
      },
    ]);

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
    const { category_name, imageUrl } = req.body;

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    const existingCategory = await ProductCategory.findById(id);
    if (!existingCategory) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

    let finalImageUrl = imageUrl || existingCategory.imageUrl;

    // If a new file is uploaded via multipart/form-data
    if (req.file) {
      const cloudinaryResult = await uploadOnCloudinary(req.file.path);
      if (!cloudinaryResult?.secure_url) {
        throw new ApiError(500, "Cloudinary upload failed");
      }
      finalImageUrl = cloudinaryResult.secure_url;
    }

    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      id,
      { category_name, imageUrl: finalImageUrl },
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
    throw new ApiError(500, error.message || "Internal server error");
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
