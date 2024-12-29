import Order from "../../models/product/order.model.js";
import Product from "../../models/product/product.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AdminWallet } from "../../models/adminWallet.js";
import { Admin } from "../../models/adminModel.js";

// Create Order
export const createOrder = asyncHandler(async (req, res) => {
  try {
    const {
      userId,
      name,
      city,
      state,
      phone,
      order_details,
      delivery_date,
      quantity,
      total_price,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      { name: "name", message: "Name is required" },
      { name: "city", message: "City name is required" },
      { name: "state", message: "State description is required" },
      {
        name: "order_details",
        message: "Order details(Product id) are required",
      },
      { name: "total_price", message: "Total price is required" },
    ];

    const missingFields = requiredFields
      .filter((field) => !req.body[field.name])
      .map((field) => field.message);

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }

    // Fetch user, admin and product details
    const user = await User.findById(userId);
    const product = await Product.findById(order_details);
    const admin = await Admin.findOne();
    console.log(admin)

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Ensure sufficient wallet balance
    if (user.walletBalance < total_price) {
      throw new ApiError(
        400,
        "Insufficient wallet balance. Please add funds to your wallet."
      );
    }

    // Deduct balance from user's wallet
    user.walletBalance -= total_price;
    await user.save();

    // Create a wallet transaction for the user
    const userTransaction = new Wallet({
      user_id: userId,
      amount: total_price,
      transaction_id: `TXN_${Date.now()}`,
      transaction_type: "debit",
      debit_type: "Ecom",
    });

    await userTransaction.save();

    // Add the total price to the admin wallet
    const adminTransaction = new AdminWallet({
      amount: total_price,
      transaction_id: `ADMIN_TXN_${Date.now()}`,
      transaction_type: "credit",
      credit_type: "service_commission",
    });

    await adminTransaction.save();

    // Add the amount to the admin wallet balance
    admin.adminWalletBalance += total_price;
    await admin.save();

    // Create the order
    const newOrder = new Order({
      userId,
      name,
      city,
      state,
      phone: phone || user.phone,
      order_details,
      delivery_date,
      quantity,
      total_price,
      is_payment_done: true,
      transaction_id: userTransaction.transaction_id,
    });

    await newOrder.save();

    // Respond with success
    return res
      .status(201)
      .json(new ApiResponse(201, newOrder, "Order created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get All Orders
export const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("order_details")
      .populate("userId");

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No orders found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Order by ID
export const getOrderById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("order_details")
      .populate("userId");

    if (!order) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Orders by User ID
export const getOrdersByUserId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find orders for the given userId
    const orders = await Order.find({ userId: id })
      .populate("order_details")
      .populate("userId");

    // Check if no orders found
    if (orders.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No orders found for this user"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Update Order by ID
export const updateOrderById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      city,
      state,
      phone,
      delivery_date,
      quantity,
      total_price,
      payment_method,
      is_order_complete,
      is_payment_done,
      transaction_id,
    } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        city,
        state,
        phone,
        delivery_date,
        quantity,
        total_price,
        payment_method,
        is_order_complete,
        is_payment_done,
        transaction_id,
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedOrder, "Order updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Cancel Order
export const cancelOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }

    if (order.is_order_complete) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Cannot cancel a completed order"));
    }

    order.cancel_order.isCancel = true;
    order.cancel_order.cancel_date_time = new Date();
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order canceled successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Delete Order
export const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Order deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});
