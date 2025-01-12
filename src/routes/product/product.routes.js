import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getTrendingProducts,
  searchProduct,
  updateProductById,
} from "../../controller/product/productController.js";

const router = Router();

// Define routes
router.route("/createProduct/").post(createProduct);
router.route("/trendingproducts").get(getTrendingProducts);
router.route("/search").get(searchProduct); // Place this before `/:id`
router.route("/filter/:categoryId/:is_all").get(getProductsByCategory);
router.route("/update/:id").patch(updateProductById);
router.route("/delete/:id").delete(deleteProduct);
router.route("/:id").get(getProductById); // Dynamic route must come last
router.route("/").get(getAllProducts);

export default router;
