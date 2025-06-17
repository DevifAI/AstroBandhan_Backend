import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateInvoiceStatus,
  updateOrderById,
} from "./../../controller/product/order.controller.js";

const router = Router();

router.route("/createOrder").post(createOrder);
router.route("/").get(getAllOrders);
router.route("/:id").get(getOrderById);
router.route("/user/:id").get(getOrdersByUserId);
router.route("/update/:id").patch(updateOrderById);
router.route("/cancel/:id").patch(cancelOrder);
router.route('/updateInvoiceStatus/:txnId').put(updateInvoiceStatus);
router.route("/delete/:id").delete(deleteOrder);

export default router;
