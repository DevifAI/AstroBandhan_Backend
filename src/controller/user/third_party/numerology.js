import axios from 'axios';
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from '../../../utils/apiResponse.js';
import PanchangModel from '../../../models/panchangModel.js';
import NumerologyModel from '../../../models/numerology.js';


export const get_numerology = asyncHandler(async (req, res) => {
    try {
        const { language, userId, name, dob } = req.body;
        if (!language) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Language is required.")
            );
        }

        let api_key = process.env.VEDIC_ASTRO_API_KEY

        const payload = {
            api_key,// API key from environment variables
            date: dob, // Format the male's DOB as dd/mm/yyyy
            name, // Male's timezone offset
            lang: language, // Language for the response
        };
        
        console.log({ api_key })
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
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/prediction/numerology', { params: encodedParams });
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
        const numerology = new NumerologyModel({
            userId,
            dob,
            name,
            language,
            response
        });

        await numerology.save();

        // // Send the response with only the relevant data
        // // console.log(response)
        return res.status(200).json(
            new ApiResponse(200, { response }, "Numerology fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching Numerology .")
        );
    }
});
