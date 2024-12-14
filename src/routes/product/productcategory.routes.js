import { Router } from "express";
import { createProductCategory, deleteCategory, getAllCategories, getCategoryById, updateCategoryById } from "../../controller/product/categoryController.js";


const router = Router();

router.route("/createProductCategory/").post(createProductCategory);
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategoryById);
router.route("/update/:id").patch(updateCategoryById);
router.route("/delete/:id").delete(deleteCategory);

export default router;
