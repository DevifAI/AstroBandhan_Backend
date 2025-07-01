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
import { upload } from "../../middlewares/multer.middlewre.js";

const router = Router();

// Define routes
router.route("/createProduct/").post(upload.single("image"), createProduct);
router.route("/trendingproducts").get(getTrendingProducts);
router.route("/search").get(searchProduct); // Place this before `/:id`
router.route("/filter/:categoryId/:is_all").get(getProductsByCategory);
router.route("/update/:id").put(upload.single("image"), updateProductById);
router.route("/delete/:id").delete(deleteProduct);
router.route("/:id").get(getProductById); // Dynamic route must come last
router.route("/").get(getAllProducts);


export default router;
