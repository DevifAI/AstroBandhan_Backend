import axios from 'axios';

export const getCoordinates = async (location) => {
   
    try {
        // Make a POST request to OpenCage API (or GET if that's the case)
        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
                q: location,
                key: process.env.OPENCAGE_API_KEY // Make sure to store your API key in the .env file
            }
        });

        // Extract latitude and longitude from the response
        if (response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry;
         
            return { lat, lng };
        } else {
            console.log('Location not found.');
            return null;
        }
    } catch (error) {
        console.error('Error while getting coordinates:', error);
        throw error;
    }
};

// Example usage:
// const location = 'Kalyani, West Bengal';
// getCoordinates(location).then((coordinates) => {
//     if (coordinates) {
//         console.log(`Coordinates:`, coordinates);
//     }
// });
