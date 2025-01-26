import mongoose from "mongoose";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import ProductCategory from "../../models/product/productCategory.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Product from "../../models/product/product.model.js";
import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import fs from "fs";

// Create Product
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      category,
      rating,
      brand,
      weight,
      material,
      originalPrice,
      displayPrice,
      isTrending,
      height,
      width,
      contains,
      imageUrl
    } = req.body;

console.log(req.body)
    // Validate required fields
    const requiredFields = [
      "productName",
      "productDescription",
      "category",
      "brand",
      "originalPrice",
      "displayPrice",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, `${field} is required`));
      }
    }

    // Check if the product already exists
    const availableProduct = await Product.findOne({ productName });
    if (availableProduct) {
      return res
        .status(409)
        .json(
          new ApiResponse(
            409,
            null,
            "This product already exists in our inventory. Please consider adding a different product."
          )
        );
    }

    // Check if the category exists
    const availableCategory = await ProductCategory.findById(category);
    if (!availableCategory) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Category not found, please add the category"
          )
        );
    }

    // // Create new product object with Cloudinary image URL
    const newProduct = new Product({
      productName,
      image: imageUrl, // Store Cloudinary image URL here
      productDescription,
      category,
      rating,
      brand,
      weight,
      material,
      originalPrice,
      displayPrice,
      isTrending,
      height,
      width,
      contains,
    });

    // // Save the product to the database
    await newProduct.save();

    // // Respond with success
    return res
      .status(201)
      .json(new ApiResponse(201, newProduct, "Product created successfully"));
  } catch (error) {
    // Handle unexpected errors
    console.error("Error creating product:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "An unexpected error occurred"));
  }
});

// Get All Products
export const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().populate("category");

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No products found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Product by ID
export const getProductById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category");

    if (!product) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Search Products
export const searchProduct = asyncHandler(async (req, res) => {
  try {
    const { productName, brand, rating, in_stock } = req.query;

    // Build the search query
    const searchQuery = {};
    if (productName) {
      searchQuery.productName = { $regex: productName, $options: "i" }; // Case-insensitive search
    }
    if (brand) {
      searchQuery.brand = { $regex: brand, $options: "i" }; // Case-insensitive search
    }
    if (rating) {
      searchQuery.rating = Number(rating); // Ensure rating is a number
    }
    if (in_stock !== undefined) {
      searchQuery.in_stock = in_stock === "true"; // Convert to boolean
    }

    // Find products based on the search query
    const products = await Product.find(searchQuery).populate("category");

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No products found matching the criteria")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findAll({ isTrending: true }).populate(
      "category"
    );

    if (!product) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Products by Category
export const getProductsByCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId, is_all } = req.params;

    let products;
    if (is_all === "true") {
      products = await Product.find({});
    } else {
      products = await Product.aggregate([
        {
          $match: {
            category: new mongoose.Types.ObjectId(categoryId),
          },
        },
        {
          $lookup: {
            from: "productcategories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $project: {
            productName: 1,
            image: 1,
            productDescription: 1,
            category: "$categoryDetails.category_name",
            rating: 1,
            brand: 1,
            weight: 1,
            originalPrice: 1,
            displayPrice: 1,
            in_stock: 1,
          },
        },
      ]);
    }

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No products found for this category")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Update Product by ID
export const updateProductById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      image,
      productDescription,
      category,
      rating,
      brand,
      weight,
      originalPrice,
      displayPrice,
      in_stock,
    } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productName,
        image,
        productDescription,
        category,
        rating,
        brand,
        weight,
        originalPrice,
        displayPrice,
        in_stock,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Delete Product by ID
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Product deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});
