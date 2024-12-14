import { product_category } from '../../models/addProductCategory.model.js';
import {ApiResponse} from '../../utils/apiResponse.js'; // Assuming ApiResponse is a utility class for standardized responses

// Add a new product category
export const addProductCategory = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json(new ApiResponse(400, {}, "Category name is required."));
    }

    try {
        // Check if the category already exists by name
        const existingCategory = await product_category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json(new ApiResponse(400, {}, "Category with this name already exists."));
        }

        // Generate unique category_id
        const randomNum = Math.floor(100 + Math.random() * 900);
        const category_id = `${name.charAt(0).toUpperCase()}${randomNum}`;

        // Create and save the new category
        const category = new product_category({ name, category_id });
        await category.save();

        return res.status(200).json(new ApiResponse(200, category, "Category added successfully."));
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json(new ApiResponse(500, error.message, "Error adding category."));
    }
};

// Edit a product category
export const editProductCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json(new ApiResponse(400, {}, "Category name is required."));
    }

    try {
        // Find and update the category by ID
        const updatedCategory = await product_category.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json(new ApiResponse(404, {}, "Category not found."));
        }

        return res.status(200).json(new ApiResponse(200, updatedCategory, "Category updated successfully."));
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json(new ApiResponse(500, error.message, "Error updating category."));
    }
};

// Delete a product category
export const deleteProductCategory = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the category by ID
        const deletedCategory = await product_category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json(new ApiResponse(404, {}, "Category not found."));
        }

        return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully."));
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json(new ApiResponse(500, error.message, "Error deleting category."));
    }
};
