import axios from 'axios';

export const validateOTP = async (phoneNumber, verificationId, code) => {
    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${phoneNumber}&verificationId=${verificationId}&customerId=C-7BD3A60091FE4B3&code=${code}`;

    // Replace with the actual token you use for authorization
    const authToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTdCRDNBNjAwOTFGRTRCMyIsImlhdCI6MTczNTQxMzAyOCwiZXhwIjoxODkzMDkzMDI4fQ.PvNxYNbu01sgMIqQMvPqdaaXSksPtxIocrSzDEvVlTmcXrTyNYSrJ3Oo4bD-fFmsRyMJRem59CNUEraUxNXAxQ';

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
