import express from "express";
import {
  payuFailure,
  payuSuccess,
} from "../../controller/payments/payments.js";

const router = express.Router();

router.post(
  "/payu-success",
  express.urlencoded({ extended: true }),
  payuSuccess
);
router.post(
  "/payu-failure",
  express.urlencoded({ extended: true }),
  payuFailure
);

export default router;
