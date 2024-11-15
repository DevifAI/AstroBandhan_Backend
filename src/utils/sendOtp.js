import axios from 'axios';

export const sendOTP = async (phoneNumber) => {
    const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=C-7813E9FA1B89403&flowType=SMS&mobileNumber=${phoneNumber}`;

    // Replace this with your actual token
    const authToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTc4MTNFOUZBMUI4OTQwMyIsImlhdCI6MTczMTMwMjU1MywiZXhwIjoxODg4OTgyNTUzfQ.4gP9TVP4I29CkFG1uUL9uZMvcy9irRPFFO0XstWUAavOQ5vQpW1bqXYVtRJqkcrggCqVACIfLHnLqfpMrltM2Q';

    try {
        // Send the request to the API to send OTP
        const response = await axios.post(url, {}, {
            headers: {
                'authToken': authToken,  // Use actual token here
            },
        });

        // Check if the response was successful
        if (response.data.status === 'success') {
            // console.log('OTP sent successfully!');
            return { success: true, data: response.data };
        } else {
            // console.error('Failed to send OTP:', response.data.message);
            return { success: false, data: response.data };
        }
    } catch (error) {
        // Handle errors properly by checking error.response
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
        return { success: false, data: error.response ? error.response.data : error.message };
    }
};
