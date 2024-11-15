import axios from 'axios';

export const validateOTP = async (phoneNumber, verificationId, code) => {
    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${phoneNumber}&verificationId=${verificationId}&customerId=C-7813E9FA1B89403&code=${code}`;

    // Replace with the actual token you use for authorization
    const authToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTc4MTNFOUZBMUI4OTQwMyIsImlhdCI6MTczMTMwMjU1MywiZXhwIjoxODg4OTgyNTUzfQ.4gP9TVP4I29CkFG1uUL9uZMvcy9irRPFFO0XstWUAavOQ5vQpW1bqXYVtRJqkcrggCqVACIfLHnLqfpMrltM2Q';

    try {
        const response = await axios.get(url, {
            headers: {
                'authToken': authToken,
            },
        });

        if (response.data.status === 'success') {
            console.log('OTP validated successfully!');
            return { success: true, data: response.data };
        } else {
            console.error('Failed to validate OTP:', response.data.message);
            return { success: false, data: response.data };
        }
    } catch (error) {
        console.error('Error validating OTP:', error.response ? error.response.data : error.message);
        return { success: false, data: error.response ? error.response.data : error.message };
    }
};
