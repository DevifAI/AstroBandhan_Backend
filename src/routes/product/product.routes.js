import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProductById, getProductsByCategory, getTrendingProducts, updateProductById } from "../../controller/product/productController.js";


const router = Router();

router.route("/createProduct/").post(createProduct);
router.route("/trendingproducts").get(getTrendingProducts);
router.route("/").get(getAllProducts);
router.route("/:id").get(getProductById);
router.route("/filter/:categoryId/:is_all").get(getProductsByCategory);
router.route("/update/:id").patch(updateProductById);
router.route("/delete/:id").delete(deleteProduct);

export default router;
