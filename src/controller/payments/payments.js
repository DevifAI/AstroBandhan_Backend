// import { User } from "../../models/user.model.js"; // Uncomment and adjust model name/path accordingly
import axios from "axios";
import crypto from "crypto";
import { Admin } from "../../models/adminModel.js";
import { AdminWallet } from "../../models/adminWallet.js";
import { User } from "../../models/user.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const payuSuccess = asyncHandler(async (req, res) => {
  const {
    key,
    txnid,
    amount,
    status,
    firstname,
    email,
    phone,
    productinfo,
    udf1, // userId
    hash,
  } = req.body;

  console.log("✅ Payment Success Payload:", req.body);
  const salt = "be69FGy54g7iLgRmOo0aWr89AoYSFZuF";
  try {
    // 1. Verify the payment with PayU
    const verificationResponse = await verifyPayuPayment(
      txnid,
      key,
      salt,
      false
    ); // true = test env

    const txnDetails = verificationResponse?.transaction_details?.[txnid];
    console.log({ txnDetails });

    if (!txnDetails || txnDetails.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // 2. Update user wallet (using your existing function)
    await addWalletBalance({
      phone: phone,
      transaction_id: txnid,
      amount: parseFloat(amount),
      amount_type: "credit",
    }); // Pass res for proper response handling

    // 3. Prepare deep link with all necessary parameters
    const deepLink = `astrobandhan://payment-success?txnid=${txnid}&amount=${amount}&status=verified`;

    // 4. Send success response with redirect
    return res.status(200).set("Cache-Control", "no-store").send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Success</title>
          <meta http-equiv="refresh" content="5;url=${deepLink}">
          <script>
            let countdown = 5;
            const interval = setInterval(() => {
              document.getElementById("timer").innerText = countdown;
              countdown--;
              if (countdown < 0) {
                clearInterval(interval);
                window.location.href = "${deepLink}";
              }
            }, 1000);
            
            // Immediate redirect for mobile apps that can handle it
            if (navigator.userAgent.match(/(Android|iPhone|iPad|iPod)/i)) {
              window.location.href = "${deepLink}";
            }
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 100px;
              background-color: #f0fff4;
            }
            h2 { color: green; }
            .loader {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #34d399;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <h2>✅ Payment Successful!</h2>
          <p>Transaction ID: <b>${txnid}</b></p>
          <p>Amount: <b>₹${amount}</b></p>
          <p>Status: <b>Verified</b></p>
          <p>Redirecting to app in <span id="timer">5</span> seconds...</p>
          <p><a href="${deepLink}">Click here if not redirected</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Payment processing error:", error);

    // Fallback deep link for failure cases
    const errorDeepLink = `astrobandhan://payment-failure?txnid=${txnid}&reason=verification_failed`;

    return res.status(200).set("Cache-Control", "no-store").send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="5;url=${errorDeepLink}">
          <title>Payment Error</title>
        </head>
        <body style="text-align:center; margin-top:100px; background-color:#fff0f0;">
          <h2 style="color:red;">❌ Payment Processing Error</h2>
          <p>We encountered an issue verifying your payment.</p>
          <p>Redirecting you back to the app...</p>
          <p><a href="${errorDeepLink}">Click here to return now</a></p>
        </body>
      </html>
    `);
  }
});

export const payuFailure = asyncHandler(async (req, res) => {
  console.log("❌ Payment Failure Payload:", req.body);

  return res.status(200).set("Cache-Control", "no-store").send(`
    <html>
      <head>
        <title>Payment Failed</title>
        <meta charset="utf-8" />
        <script>
          // Redirect to app after 2 seconds
          setTimeout(function() {
            window.location.href = "astrobandhan://payment-failure";
          }, 2000);
        </script>
      </head>
      <body style="text-align:center; margin-top:100px; font-family:Arial;">
        <h2>❌ Payment Failed!</h2>
        <p>Redirecting you back to the app...</p>
      </body>
    </html>
  `);
});

//helper function to verify payment with PayU
// PayU Verification Function
const verifyPayuPayment = async (txnid, key, salt, isTestEnv = false) => {
  const command = "verify_payment";
  const stringToHash = `${key}|${command}|${txnid}|${salt}`;
  console.log("🔐 Raw String to Hash:", `"${stringToHash}"`);
  const hash = crypto.createHash("sha512").update(stringToHash).digest("hex");
  console.log("🔍 Verifying PayU Payment:", hash);
  console.log("key:", key);
  console.log("command:", command);
  console.log("txnid:", txnid);
  console.log("salt:", salt);
  const url = isTestEnv
    ? "https://test.payu.in/merchant/postservice.php?form=2"
    : "https://info.payu.in/merchant/postservice.php?form=2";

  const formData = new URLSearchParams();
  formData.append("key", key);
  formData.append("command", command);
  formData.append("var1", txnid);
  formData.append("hash", hash);

  try {
    const response = await axios.post(url, formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data; // You can drill into response as needed
  } catch (error) {
    console.error(
      "❌ PayU verification failed:",
      error.response?.data || error.message
    );
    throw new Error("PayU verification failed");
  }
};

//helper function to add wallet balance
// utils/walletService.js

const addWalletBalance = async (
  { phone, transaction_id, amount, amount_type },
  io = null,
  activeUsers = {}
) => {
  // Validate input parameters
  if (!phone || !transaction_id || !amount || !amount_type) {
    throw new Error("All fields are required");
  }

  // Check if user exists
  const user = await User.find({ phone });
  if (!user) {
    throw new Error("User not found");
  }

  // Check for duplicate transaction
  const transactionExist = await Wallet.findOne({ transaction_id });
  if (transactionExist) {
    throw new Error("Transaction ID already exists");
  }

  // Update user wallet if credit
  if (amount_type === "credit") {
    await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: amount } });
  }

  // Create wallet transaction record
  const walletDoc = new Wallet({
    user_id: user._id,
    amount,
    transaction_id,
    transaction_type: amount_type,
    credit_type: "wallet_recharge",
  });

  // Create admin wallet record
  const adminWalletDoc = new AdminWallet({
    service_id: transaction_id,
    userId: user._id,
    amount,
    transaction_id,
    transaction_type: amount_type,
    credit_type: "wallet_recharge",
  });

  // Update admin balance
  const admins = await Admin.find({});
  const admin = admins[0];
  admin.adminWalletBalance += amount;
  await admin.save();

  // Save both documents
  await Promise.all([walletDoc.save(), adminWalletDoc.save()]);

  // // Send realtime notification if socket is available
  // const userSocketId = activeUsers[user._id];
  // if (io && userSocketId) {
  //   const message = `Your wallet has been ${amount_type === "credit" ? "credited" : "debited"} with ${amount}.`;
  //   io.to(userSocketId).emit("notification", { message });
  // }

  // Create and save notification
  const notification = new Notification({
    userId: user._id,
    message: [
      {
        title: amount_type === "credit" ? "Coin Credited" : "Coin Debited",
        desc: `${amount} has been ${amount_type === "credit" ? "credited to" : "debited from"} your wallet`,
      },
    ],
  });
  await notification.save();

  return {
    wallet: walletDoc,
    adminWallet: adminWalletDoc,
  };
};
