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
      image,
      contains,
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const requiredFields = [
      "productName",
      "productDescription",
      "category",
      "brand",
      "originalPrice",
      "displayPrice",
      "image"
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, `${field} is required`));
      }
    }

    // Check duplicate product
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
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

    // Check valid category
    const categoryExists = await ProductCategory.findById(category);
    if (!categoryExists) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Category not found. Please add category first."
          )
        );
    }


    // Save product
    const newProduct = new Product({
      productName,
      image,
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

    await newProduct.save();

    return res
      .status(201)
      .json(new ApiResponse(201, newProduct, "Product created successfully"));
  } catch (error) {
    console.error("Product Creation Error:", error);
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
      productDescription,
      category,
      rating,
      brand,
      weight,
      material,
      originalPrice,
      displayPrice,
      in_stock,
      isTrending,
    } = req.body;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product not found"));
    }

    // Check if new category exists (if category is being changed)
    if (category && category !== existingProduct.category.toString()) {
      const categoryExists = await ProductCategory.findById(category);
      if (!categoryExists) {
        return res
          .status(404)
          .json(new ApiResponse(404, null, "Provided category does not exist"));
      }
    }

    // Handle new image upload if provided
    let updatedImageUrl = existingProduct.image; // Default to current
    if (req.file && req.file.path) {
      try {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        updatedImageUrl = uploadResult?.url || updatedImageUrl;
        fs.unlinkSync(req.file.path); // Remove local file
      } catch (uploadErr) {
        console.error("Cloudinary Upload Failed:", uploadErr);
        return res
          .status(500)
          .json(new ApiResponse(500, null, "Image upload failed"));
      }
    }

    // Update product fields
    existingProduct.productName = productName ?? existingProduct.productName;
    existingProduct.productDescription =
      productDescription ?? existingProduct.productDescription;
    existingProduct.category = category ?? existingProduct.category;
    existingProduct.rating = rating ?? existingProduct.rating;
    existingProduct.brand = brand ?? existingProduct.brand;
    existingProduct.weight = weight ?? existingProduct.weight;
    existingProduct.material = material ?? existingProduct.material;
    existingProduct.originalPrice =
      originalPrice ?? existingProduct.originalPrice;
    existingProduct.displayPrice = displayPrice ?? existingProduct.displayPrice;
    existingProduct.in_stock = in_stock ?? existingProduct.in_stock;
    existingProduct.isTrending = isTrending ?? existingProduct.isTrending;
    existingProduct.image = updatedImageUrl;

    await existingProduct.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, existingProduct, "Product updated successfully")
      );
  } catch (error) {
    console.error("Product Update Error:", error);
    throw new ApiError(500, error.message || "Internal Server Error");
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
