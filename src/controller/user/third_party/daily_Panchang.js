import axios from 'axios';
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from '../../../utils/apiResponse.js';
import PanchangModel from '../../../models/panchangModel.js';



export const getDailyPanchang = asyncHandler(async (req, res) => {
    try {
        const { language, userId, formattedDate } = req.body;
        console.log(formattedDate);
        if (!language) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Language is required.")
            );
        }

        const currentDate = new Date();

        // Format the current date as DD/MM/YYYY
        // const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        // console.log({formattedDate});
        // Get the current time and format it as HH:MM
        const hours = currentDate.getHours().toString().padStart(2, '0'); // Ensure two digits
        const minutes = currentDate.getMinutes().toString().padStart(2, '0'); // Ensure two digits
        const formattedTime = `${hours}:${minutes}`;


        const payload = {
            api_key: process.env.VEDIC_ASTRO_API_KEY, // API key from environment variables
            date: formattedDate, // Format the male's DOB as dd/mm/yyyy
            tz: '5.5', // Male's timezone offset
            lat: "22.966200", // Male's latitude
            lon: "88.389359", // Male's longitude
            time: formattedTime, // Male's time of birth (hours:minutes), encoded as '%3A'
            lang: language, // Language for the response
        };

        // Encoding parameters, keeping dob and tob in their original format
        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key === 'date' || key === 'time') {
                acc[key] = payload[key]; // Keep date and time as they are
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});


        // console.log({ encodedParams })
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/panchang/panchang', { params: encodedParams });
        console.log({ apiResponse })
        // // Extract relevant parts from the API response
        const { status, response } = apiResponse.data; // Assuming 'response' holds the matching details

        // // Check if the response is valid
        if (!response) {
            return res.status(400).json(
                new ApiResponse(400, { response }, "Error fetching Panchang.")
            );
        }

        // // Save the Ashtakoot score to the database (if needed)
        const panchang = new PanchangModel({
            userId,
            date: formattedDate,
            language,
            response
        });

        await panchang.save();

        // // Send the response with only the relevant data
        // // console.log(response)
        return res.status(200).json(
            new ApiResponse(200, { response }, "Daily Panchang fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching Panchang.")
        );
    }
});

export const getMonthlyPanchang = asyncHandler(async (req, res) => {
    try {
        const { language, userId } = req.body;
        if (!language) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Language is required.")
            );
        }

        const currentDate = new Date();

        // Format the current date as DD/MM/YYYY
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

        // Get the current time and format it as HH:MM
        const hours = currentDate.getHours().toString().padStart(2, '0'); // Ensure two digits
        const minutes = currentDate.getMinutes().toString().padStart(2, '0'); // Ensure two digits
        const formattedTime = `${hours}:${minutes}`;
        const payload = {
            api_key: process.env.VEDIC_ASTRO_API_KEY, // API key from environment variables
            date: formattedDate, // Format the male's DOB as dd/mm/yyyy
            tz: '5.5', // Male's timezone offset
            lat: "22.966200", // Male's latitude
            lon: "88.389359", // Male's longitude
            time: formattedTime, // Male's time of birth (hours:minutes), encoded as '%3A'
            lang: language, // Language for the response
        };

        // Encoding parameters, keeping dob and tob in their original format
        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key === 'date' || key === 'time') {
                acc[key] = payload[key]; // Keep date and time as they are
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});


        // console.log({ encodedParams })
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/panchang/monthly-panchang', { params: encodedParams });
        console.log({ apiResponse })
        // // Extract relevant parts from the API response
        const { status, response } = apiResponse.data; // Assuming 'response' holds the matching details

        // // Check if the response is valid
        if (!response) {
            return res.status(400).json(
                new ApiResponse(400, { response }, "Error fetching Panchang.")
            );
        }

        // // Save the Ashtakoot score to the database (if needed)
        const panchang = new PanchangModel({
            userId,
            date: formattedDate,
            language,
            response
        });

        await panchang.save();

        // // Send the response with only the relevant data
        // // console.log(response)
        return res.status(200).json(
            new ApiResponse(200, { response }, "Monthly Panchang fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching Panchang .")
        );
    }
});

