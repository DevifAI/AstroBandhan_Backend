import axios from "axios";

export const sendOTP = async (phoneNumber) => {
  const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=C-7BD3A60091FE4B3&flowType=SMS&mobileNumber=${phoneNumber}`;

  // Replace this with your actual token
  const authToken =
    "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTdCRDNBNjAwOTFGRTRCMyIsImlhdCI6MTczNTQxMzAyOCwiZXhwIjoxODkzMDkzMDI4fQ.PvNxYNbu01sgMIqQMvPqdaaXSksPtxIocrSzDEvVlTmcXrTyNYSrJ3Oo4bD-fFmsRyMJRem59CNUEraUxNXAxQ";

  try {
    // Send the request to the API to send OTP
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          authToken: authToken, // Use actual token here
        },
      }
    );

    // Check if the response was successful
    if (response.data.responseCode === 200) {
      console.log("OTP sent successfully!", response.data);
      return { success: true, data: response.data };
    } else {
      console.error("Failed to send OTP:", response.data);
      return { success: false, data: response.data };
    }
  } catch (error) {
    // Handle errors properly by checking error.response
    console.error(
      "Error sending OTP:",
      error.response ? error.response.data : error.message
    );
    return {
      success: false,
      data: error.response ? error.response.data : error.message,
    };
  }
};
