import express from "express";
import {
  payuFailure,
  payuSuccess,
} from "../../controller/payments/payments.js";

const router = express.Router();

router.get(
  "/payu-success",
  express.urlencoded({ extended: true }),
  payuSuccess
);
router.get(
  "/payu-failure",
  express.urlencoded({ extended: true }),
  payuFailure
);

export default router;
