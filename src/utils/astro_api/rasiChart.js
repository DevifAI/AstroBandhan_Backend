import axios from 'axios';

export const fetchPlanetData = async (data) => {
    console.log({ data })
    const payload = {
        dob: `${data.date}/${data.month}/${data.year}`,
        tob: `${data.hours}/${data.minutes}/${data.seconds}`,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        lang: "en",
        api_key: process.env.VEDIC_ASTRO_API_KEY, // API key from environment variables
    }
    const encodedParams = Object.keys(payload).reduce((acc, key) => {
        if (key === 'dob' || key === 'tob') {
            acc[key] = payload[key]; // Keep date and time as they are
        } else {
            acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
        }
        return acc;
    }, {});
    try {
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/panchang/monthly-panchang', { params: encodedParams });
        console.log({ apiResponse })

        return response.data
    } catch (error) {
        console.error('Error fetching planet data:', error.message);
    }
};
