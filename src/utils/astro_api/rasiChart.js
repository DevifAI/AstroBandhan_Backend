import axios from 'axios';

export const fetchPlanetData = async (data) => {
    const API_KEY = process.env.FREE_ASTRO_API_KEY; // Replace with your actual API key
    console.log({ data })
    try {
        const response = await axios.post(
            'https://json.freeastrologyapi.com/planets',
            {
                year: data.year,
                month: data.month,
                date: data.date,
                hours: data.hours,
                minutes: data.minutes,
                seconds: data.seconds,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                config: {
                    observation_point: data.observation_point,
                    ayanamsha: data.ayanamsha,
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': "OocUE4uDezahoQVs69wLo6xM0Fvxpqkk9jDj0t1S",
                },
            }
        );

        return response.data
    } catch (error) {
        console.error('Error fetching planet data:', error.message);
    }
};
