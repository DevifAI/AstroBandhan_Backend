import { Router } from "express";
import { createProductCategory, deleteCategory, fetchTotalProductByCategory, getAllCategories, getCategoryById, updateCategoryById } from "../../controller/product/categoryController.js";


const router = Router();

router.route("/createProductCategory/").post(createProductCategory);
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategoryById);
router.route("/update/:id").patch(updateCategoryById);
router.route("/totalProducts/:id").get(fetchTotalProductByCategory);
router.route("/delete/:id").delete(deleteCategory);

export default router;
