import mongoose from "mongoose";

const { Schema, model } = mongoose;

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    city: {
      type: String,
      trim: true,
      required: [true, "City name is required"],
    },
    state: {
      type: String,
      trim: true,
      required: [true, "State description is required"],
    },
    address: {
      type: String,
      trim: true,
      required: [true, "Address is required"]
    },
    phone: {
      type: String,
      // required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    order_details: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product id is required"],
    },
    delivery_date: {
      type: Date,
    },
    is_order_complete: {
      type: Boolean,
      default: false,
    },
    // cancel_order: {
    //   isCancel: {
    //     type: Boolean,
    //     default: false,
    //   },
    //   cancel_date_time: {
    //     type: Date,
    //     default: null,
    //   },
    // },
    quantity: {
      type: Number,
      default: 1,
    },
    total_price: {
      type: Number,
    },
    payment_method: {
      type: String,
      default: "wallet",
      // required: [true, "Payment method is required"],
    },
    is_payment_done: {
      type: Boolean,
      default: false,
    },
    delivery_status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered"],
      default: "Pending",
    },
    transaction_id: {
      type: String,
      unique: true,
      required: function () {
        return this.is_payment_done;
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", orderSchema);

export default Order;
