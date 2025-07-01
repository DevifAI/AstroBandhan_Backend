import { Router } from "express";
import { createProductCategory, deleteCategory, fetchTotalProductByCategory, getAllCategories, getCategoryById, updateCategoryById } from "../../controller/product/categoryController.js";
import { upload } from "../../middlewares/multer.middlewre.js";


const router = Router();

router.post("/create", upload.single("image"), createProductCategory);
router.put("/update/:id", upload.single("image"), updateCategoryById);
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategoryById);
router.route("/totalProducts/:id").get(fetchTotalProductByCategory);
router.route("/delete/:id").delete(deleteCategory);

export default router;
