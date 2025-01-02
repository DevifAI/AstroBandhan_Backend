import ProductCategory from "../../models/product/productCategory.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create Product Category
export const createProductCategory = asyncHandler(async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    // if (!image) {
    //   throw new ApiError(400, "Category image is required");
    // }

    const existingCategory = await ProductCategory.findOne({ category_name });

    if (existingCategory) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Product category already exists"));
    }

    const newCategory = new ProductCategory({
      category_name,
      // image,
    });

    // Save the new category
    await newCategory.save();

    // Fetch the newly saved category and select only `createdAt` and `updatedAt`
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
    const { category_name, image } = req.body;

    if (!category_name) {
      throw new ApiError(400, "Category name is required");
    }

    if (!image) {
      throw new ApiError(400, "Category image is required");
    }

    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      id,
      { category_name, image },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Product category not found"));
    }

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
