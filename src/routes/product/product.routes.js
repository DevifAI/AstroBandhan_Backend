import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProductById, getProductsByCategory, updateProductById } from "../../controller/product/productController.js";


const router = Router();

router.route("/createProduct/").post(createProduct);
router.route("/").get(getAllProducts);
router.route("/:id").get(getProductById);
router.route("/filter/:categoryId").get(getProductsByCategory);
router.route("/update/:id").patch(updateProductById);
router.route("/delete/:id").delete(deleteProduct);

export default router;
