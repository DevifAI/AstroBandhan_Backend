import axios from 'axios';
import { asyncHandler } from "../../../utils/asyncHandler.js";
import AshtakootScore from '../../../models/matchMaking.js';
import { ApiResponse } from '../../../utils/apiResponse.js';

// Helper function to fetch geo details
const fetchGeoDetails = async (location) => {
    try {
        const geoResponse = await axios.post(
            'https://json.apiastro.com/geo-details',
            { location },
            { headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.FREE_ASTRO_API_KEY } }
        );
        return geoResponse.data[0];
    } catch (error) {
        // console.log(error);
        throw new Error('Failed to fetch geo details');
    }
};

export const getAshtakootScore = asyncHandler(async (req, res) => {
    try {
        const { female, male, userId, language } = req.body;

        if (!female || !male || !female.location || !male.location) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Female and Male birth details with locations are required.")
            );
        }

        async function fetchGeoDetailsWithDelay() {
            // Fetch female geo details
            const femaleGeoDetails = await fetchGeoDetails(female.location);
            // console.log('Female Geo Details:', femaleGeoDetails);

            // Delay for 3 seconds (for demonstration, consider removing delay if not needed)
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Fetch male geo details
            const maleGeoDetails = await fetchGeoDetails(male.location);
            // console.log('Male Geo Details:', maleGeoDetails);

            // Return both details
            return { femaleGeoDetails, maleGeoDetails };
        }

        // Fetch geo details
        let maleGeo, femaleGeo;
        try {
            const { femaleGeoDetails, maleGeoDetails } = await fetchGeoDetailsWithDelay();
            maleGeo = maleGeoDetails;
            femaleGeo = femaleGeoDetails;
        } catch (geoError) {
            return res.status(500).json(
                new ApiResponse(500, {}, "Error fetching geo details.")
            );
        }

        const payload = {
            api_key: process.env.VEDIC_ASTRO_API_KEY, // Use your actual API key here
            boy_dob: `${male.date}/${male.month}/${male.year}`,
            boy_tob: `${male.hours}:${male.minutes}`,
            boy_tz: maleGeo.timezone_offset,
            boy_lat: maleGeo.latitude,
            boy_lon: maleGeo.longitude,
            girl_dob: `${female.date}/${female.month}/${female.year}`,
            girl_tob: `${female.hours}:${female.minutes}`,
            girl_tz: femaleGeo.timezone_offset,
            girl_lat: femaleGeo.latitude,
            girl_lon: femaleGeo.longitude,
            lang: language,
        };

        const formatDate = (date) => {
            const [day, month, year] = date.split('/');
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        };

        // Format the time to hh:mm
        const formatTime = (hours, minutes) => {
            const paddedHours = String(hours).padStart(2, '0'); // Pad hours to 2 digits
            const paddedMinutes = String(minutes).padStart(2, '0'); // Pad minutes to 2 digits
            return `${paddedHours}:${paddedMinutes}`; // Return time in hh:mm format
        };

        // Format the `dob` parameters
        payload.boy_dob = formatDate(payload.boy_dob);
        payload.girl_dob = formatDate(payload.girl_dob);

        // Format the `tob` parameters
        payload.boy_tob = formatTime(male.hours, male.minutes);
        payload.girl_tob = formatTime(female.hours, female.minutes);




        // Encoding parameters, keeping dob and tob in their original format
        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key.includes('dob') || key.includes('tob')) {
                acc[key] = payload[key]; // Keep dob and tob in their original form
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});

        // console.log({ encodedParams })
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/matching/ashtakoot', { params: encodedParams });
        // console.log(apiResponse)
        // // Extract relevant parts from the API response
        const { status, response } = apiResponse.data; // Assuming 'response' holds the matching details

        // // // Check if the response is valid
        if (status !== 200 || !response || !response.score) {
            return res.status(400).json(
                new ApiResponse(400, { response }, "Error fetching Ashtakoot Score.")
            );
        }

        // // Save the Ashtakoot score to the database (if needed)
        const ashtakootScore = new AshtakootScore({
            userId,
            female: {
                year: female.year,
                month: female.month,
                date: female.date,
                hours: female.hours,
                minutes: female.minutes,
                seconds: female.seconds || 0,
                latitude: femaleGeo.latitude,
                longitude: femaleGeo.longitude,
                timezone: femaleGeo.timezone_offset,
            },
            male: {
                year: male.year,
                month: male.month,
                date: male.date,
                hours: male.hours,
                minutes: male.minutes,
                seconds: male.seconds || 0,
                latitude: maleGeo.latitude,
                longitude: maleGeo.longitude,
                timezone: maleGeo.timezone_offset,
            },
            response: {
                total_score: 36, // Assuming total score is fixed at 36 (change if needed)
                score: response.score,
                desc: response.bot_response,
            },
            language
        });

        await ashtakootScore.save();

        // Send the response with only the relevant data
        // console.log(response)
        return res.status(200).json(
            new ApiResponse(200, { response_ashtakoot: { total_score: 36, score: response.score, desc: response.bot_response } }, "Ashtakoot Score fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching Ashtakoot Score.")
        );
    }
});

export const getAshtakootScore_PDF = asyncHandler(async (req, res) => {
    try {
        const { female, male, userId, language } = req.body;

        if (!female || !male || !female.location || !male.location) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Female and Male birth details with locations are required.")
            );
        }

        async function fetchGeoDetailsWithDelay() {
            // Fetch female geo details
            const femaleGeoDetails = await fetchGeoDetails(female.location);
            // console.log('Female Geo Details:', femaleGeoDetails);

            // Delay for 3 seconds (for demonstration, consider removing delay if not needed)
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Fetch male geo details
            const maleGeoDetails = await fetchGeoDetails(male.location);
            // console.log('Male Geo Details:', maleGeoDetails);

            // Return both details
            return { femaleGeoDetails, maleGeoDetails };
        }

        // Fetch geo details
        let maleGeo, femaleGeo;
        try {
            const { femaleGeoDetails, maleGeoDetails } = await fetchGeoDetailsWithDelay();
            maleGeo = maleGeoDetails;
            femaleGeo = femaleGeoDetails;
        } catch (geoError) {
            return res.status(500).json(
                new ApiResponse(500, {}, "Error fetching geo details.")
            );
        }

        const payload = {
            api_key: process.env.VEDIC_ASTRO_API_KEY, // Use your actual API key here
            boy_name: male.name,
            boy_dob: `${male.date}/${male.month}/${male.year}`,
            boy_tob: `${male.hours}:${male.minutes}`,
            boy_tz: maleGeo.timezone_offset,
            boy_pob: male.location,
            boy_lat: maleGeo.latitude,
            boy_lon: maleGeo.longitude,
            girl_name: female.name,
            girl_dob: `${female.date}/${female.month}/${female.year}`,
            girl_pob: female.location,
            girl_tob: `${female.hours}:${female.minutes}`,
            girl_tz: femaleGeo.timezone_offset,
            girl_lat: femaleGeo.latitude,
            girl_lon: femaleGeo.longitude,
            lang: language,
            style: 'north', // Hardcoded style
            color: '140'    // Hardcoded color
        };

        const formatDate = (date) => {
            const [day, month, year] = date.split('/');
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        };

        // Format the time to hh:mm
        const formatTime = (hours, minutes) => {
            const paddedHours = String(hours).padStart(2, '0'); // Pad hours to 2 digits
            const paddedMinutes = String(minutes).padStart(2, '0'); // Pad minutes to 2 digits
            return `${paddedHours}:${paddedMinutes}`; // Return time in hh:mm format
        };

        // Format the `dob` parameters
        payload.boy_dob = formatDate(payload.boy_dob);
        payload.girl_dob = formatDate(payload.girl_dob);

        // Format the `tob` parameters
        payload.boy_tob = formatTime(male.hours, male.minutes);
        payload.girl_tob = formatTime(female.hours, female.minutes);




        // Encoding parameters, keeping dob and tob in their original format
        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key.includes('dob') || key.includes('tob')) {
                acc[key] = payload[key]; // Keep dob and tob in their original form
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});

        // console.log({ encodedParams })
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/pdf/matching', { params: encodedParams });
        // console.log(apiResponse)
        // // Extract relevant parts from the API response
        const { status, response } = apiResponse.data; // Assuming 'response' holds the matching details
        console.log({ response })
        console.log(apiResponse)
        // // // Check if the response is valid
        if (!response) {
            return res.status(400).json(
                new ApiResponse(400, { response }, "Error fetching Ashtakoot Score.")
            );
        }

        // // Save the Ashtakoot score to the database (if needed)
        const ashtakootScore = new AshtakootScore({
            userId,
            female: {
                year: female.year,
                month: female.month,
                date: female.date,
                hours: female.hours,
                minutes: female.minutes,
                seconds: female.seconds || 0,
                latitude: femaleGeo.latitude,
                longitude: femaleGeo.longitude,
                timezone: femaleGeo.timezone_offset,
            },
            male: {
                year: male.year,
                month: male.month,
                date: male.date,
                hours: male.hours,
                minutes: male.minutes,
                seconds: male.seconds || 0,
                latitude: maleGeo.latitude,
                longitude: maleGeo.longitude,
                timezone: maleGeo.timezone_offset,
            },
            response: {
                total_score: 36, // Assuming total score is fixed at 36 (change if needed)
                score: response.score,
                desc: response.bot_response,
            },
            language
        });

        await ashtakootScore.save();

        // Send the response with only the relevant data
        // console.log(response)
        return res.status(200).json(
            new ApiResponse(200, { response_ashtakoot: { total_score: 36, score: response.score, desc: response.bot_response } }, "Ashtakoot Score fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching Ashtakoot Score.")
        );
    }
});
