import Order from "../../models/product/order.model.js";
import Product from "../../models/product/product.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { User } from "../../models/user.model.js";
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
      address,
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
      { name: "address", message: "Address  is required" },
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
      return res
        .status(400)
        .json(new ApiResponse(400, null, `Missing required fields: ${missingFields.join(", ")}`));

    }

    // Fetch user, admin and product details
    const user = await User.findById(userId);
    const product = await Product.findById(order_details);
    const admin = await Admin.findOne();

    if (!admin) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Admin not found"));
    }

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not found ."));
    }

    if (!product) {

      return res
        .status(400)
        .json(new ApiResponse(400, null, "Product not found ."));
    }

    // Ensure sufficient wallet balance
    if (user.walletBalance < total_price) {

      return res
        .status(400)
        .json(new ApiResponse(400, null, "Insufficient wallet balance. Please add funds to your wallet."));
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
      userId,
    });

    await adminTransaction.save();

    // Add the amount to the admin wallet balance
    // admin.adminWalletBalance += total_price;
    // await admin.save();

    // Create the order
    const newOrder = new Order({
      userId,
      name,
      city,
      state,
      address,
      phone: phone || user.phone,
      order_details,
      delivery_date,
      quantity,
      total_price,
      is_payment_done: true,
      delivery_status: "Pending",
      transaction_id: userTransaction.transaction_id,
    });

    await newOrder.save();

    // Respond with success
    return res
      .status(201)
      .json(new ApiResponse(201, newOrder, "Order created successfully"));
  } catch (error) {
    return res
      .status(201)
      .json(new ApiResponse(201, null, "Something went wrong"));

  }
});

// Get All Orders
// Get All Orders with Optional Date Range Filtering
export const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let dateFilter = {};

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate );
      to.setHours(23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: from,
          $lte: to,
        },
      };
    }

    const orders = await Order.find(dateFilter)
      .populate("order_details")
      .populate("userId");

    if (!orders || orders.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No orders found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Something went wrong"));
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
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Something went wrong"));
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
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Something went wrong"));
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
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Something went wrong"));
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
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Something went wrong"));
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
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Something went wrong"));
  }
});


// Update delivery status by transaction ID
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { txnId } = req.params; // Extract transaction ID from the URL
    const { delivery_status } = req.body; // Extract the new delivery status from the request body

    // Validate the delivery status
    if (!["Pending", "Shipped", "Delivered"].includes(delivery_status)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    // Find the order by transaction ID and update its delivery status
    const updatedOrder = await Order.findOneAndUpdate(
      { transaction_id: txnId }, // Find order by transaction ID
      { delivery_status }, // Update delivery status
      { new: true } // Return the updated order
    );

    // If no order is found
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return the updated order
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
