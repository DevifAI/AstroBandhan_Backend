// import { User } from "../../models/user.model.js"; // Uncomment and adjust model name/path accordingly
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const payuSuccess = asyncHandler(async (req, res) => {
  const {
    txnid,
    amount,
    status,
    firstname,
    email,
    phone,
    productinfo,
    udf1, // This will contain userId
    hash,
  } = req.body;

  console.log("✅ Payment Success Payload:", req.body);
  // This forces no cache and returns a clean response

  return res.status(200).set("Cache-Control", "no-store").send(`
    <html>
      <body style="text-align:center; margin-top:100px;">
        <h2>✅ Payment Successful!</h2>
        <p>Transaction ID: ${req.query.txnid || "N/A"}</p>
      </body>
    </html>
  `);
});

export const payuFailure = asyncHandler(async (req, res) => {
  console.log("❌ Payment Failure Payload:", req.body);

  return res.status(200).set("Cache-Control", "no-store").send(`
    <html>
      <body style="text-align:center; margin-top:100px;">
        <h2>❌ Payment Failed!</h2>
        
      </body>
    </html>
  `);
});
