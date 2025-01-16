import axios from 'axios';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import DailyHoroscope from '../../../models/horroscope.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import { translateText } from '../../../utils/chat_with_ai_astro.js';
import { User } from "../../../models/user.model.js";
import { getCoordinates } from '../../../utils/get_lat&long.js';

// Controller to fetch daily horoscope
export const getDailyHoroscope = asyncHandler(async (req, res) => {
    try {
        const { userId, zodiacSign, language } = req.body;

        if (!userId || !zodiacSign) {
            return res.status(400).json(
                new ApiResponse(400, {}, "UserId and Zodiac Sign are required.")
            );
        }
        // Fetch user details
        const userDetails = await User.findById(userId).select('dateOfBirth timeOfBirth placeOfBirth');
        // Ensure user details are found
        if (!userDetails) {
            return res.status(404).json(
                new ApiResponse(404, {}, "User not found.")
            );
        }

        const { dateOfBirth, timeOfBirth, placeOfBirth } = userDetails;
        const get_lat_long = await getCoordinates(placeOfBirth);
        const { lat, lng } = get_lat_long
        // Extract date and time components
        const dob = dateOfBirth.split("-").reverse().join();
        // Convert timeOfBirth from 12-hour format (AM/PM) to 24-hour format
        const [time, modifier] = timeOfBirth.split(' ');
        let [hours, minutes] = time.split(':');

        if (modifier === 'PM' && hours !== '12') {
            hours = (parseInt(hours) + 12).toString(); // Convert PM hours to 24-hour format
        } else if (modifier === 'AM' && hours === '12') {
            hours = '00'; // Convert 12 AM to 00 in 24-hour format
        }

        const tob = `${hours}/${minutes}/00`
        const payload = {
            dob,
            tob, // Ensure seconds are added as 00 if needed
            latitude: lat,
            longitude: lng,
            timezone: 5.5,
            lang: language,
            api_key: process.env.VEDIC_ASTRO_API_KEY, // API key from environment variables
        };

        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key === 'dob' || key === 'tob') {
                acc[key] = payload[key]; // Keep date and time as they are
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/panchang/monthly-panchang', { params: encodedParams });
        console.log({ apiResponse })
        // Fetch horoscope from external API

        // const { status, sun_sign, prediction_date, prediction } = apiResponse.data;

        // if (!status || !prediction) {
        //     return res.status(400).json(
        //         new ApiResponse(400, {}, "Error fetching daily horoscope.")
        //     );
        // }

        let translatedPrediction;


        // Save horoscope to the database
        // const dailyHoroscope = new DailyHoroscope({
        //     userId,
        //     zodiacSign: sun_sign,
        //     predictionDate: prediction_date,
        //     prediction: {
        //         personal_life: translatedPrediction.personal_life,
        //         profession: translatedPrediction.profession,
        //         health: translatedPrediction.health,
        //         emotions: translatedPrediction.emotions,
        //         travel: translatedPrediction.travel,
        //         luck: translatedPrediction.luck,
        //     },
        // });

        // await dailyHoroscope.save();

        // Return the prediction response
        return res.status(200).json(
            new ApiResponse(200, {
                prediction: apiResponse
            }, "Daily Horoscope fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while fetching the daily horoscope.")
        );
    }
});

export const getTommHoroscope = asyncHandler(async (req, res) => {
    try {
        const { userId, zodiacSign, language } = req.body;

        if (!userId || !zodiacSign) {
            return res.status(400).json(
                new ApiResponse(400, {}, "UserId and Zodiac Sign are required.")
            );
        }

        // Fetch horoscope from external API
        const apiResponse = await axios({
            method: 'post',
            url: `https://json.astrologyapi.com/v1/sun_sign_prediction/daily/next/${zodiacSign}`,
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.HORROSCOPE_DAILY_USER_ID}:${process.env.HORROSCOPE_DAILY_API_KEY}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            data: {} // Empty data body unless API documentation specifies otherwise
        });

        const { status, sun_sign, prediction_date, prediction } = apiResponse.data;

        if (!status || !prediction) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Error fetching daily horoscope.")
            );
        }

        // Save horoscope to the database
        let translatedPrediction;

        if (language) {
            translatedPrediction = {
                personal_life: await translateText(prediction.personal_life, language),
                profession: await translateText(prediction.profession, language),
                health: await translateText(prediction.health, language),
                emotions: await translateText(prediction.emotions, language),
                travel: await translateText(prediction.travel, language),
                luck: await translateText(prediction.luck, language)
            };
        }

        // Save horoscope to the database
        const dailyHoroscope = new DailyHoroscope({
            userId,
            zodiacSign: sun_sign,
            predictionDate: prediction_date,
            prediction: {
                personal_life: translatedPrediction.personal_life,
                profession: translatedPrediction.profession,
                health: translatedPrediction.health,
                emotions: translatedPrediction.emotions,
                travel: translatedPrediction.travel,
                luck: translatedPrediction.luck,
            },
        });

        await dailyHoroscope.save();

        // Return the prediction response
        return res.status(200).json(
            new ApiResponse(200, {
                prediction: translatedPrediction
            }, "Daily Horoscope fetched successfully.")
        );


    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching the daily horoscope.")
        );
    }
});
export const getPrevHoroscope = asyncHandler(async (req, res) => {
    try {
        const { userId, zodiacSign } = req.body;

        if (!userId || !zodiacSign) {
            return res.status(400).json(
                new ApiResponse(400, {}, "UserId and Zodiac Sign are required.")
            );
        }

        // Fetch horoscope from external API
        const apiResponse = await axios({
            method: 'post',
            url: `https://json.astrologyapi.com/v1/sun_sign_prediction/previous/${zodiacSign}`,
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.HORROSCOPE_DAILY_USER_ID}:${process.env.HORROSCOPE_DAILY_API_KEY}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            data: {} // Empty data body unless API documentation specifies otherwise
        });

        const { status, sun_sign, prediction_date, prediction } = apiResponse.data;

        if (!status || !prediction) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Error fetching daily horoscope.")
            );
        }

        // Save horoscope to the database
        let translatedPrediction;

        if (language) {
            translatedPrediction = {
                personal_life: await translateText(prediction.personal_life, language),
                profession: await translateText(prediction.profession, language),
                health: await translateText(prediction.health, language),
                emotions: await translateText(prediction.emotions, language),
                travel: await translateText(prediction.travel, language),
                luck: await translateText(prediction.luck, language)
            };
        }

        // Save horoscope to the database
        const dailyHoroscope = new DailyHoroscope({
            userId,
            zodiacSign: sun_sign,
            predictionDate: prediction_date,
            prediction: {
                personal_life: translatedPrediction.personal_life,
                profession: translatedPrediction.profession,
                health: translatedPrediction.health,
                emotions: translatedPrediction.emotions,
                travel: translatedPrediction.travel,
                luck: translatedPrediction.luck,
            },
        });

        await dailyHoroscope.save();

        // Return the prediction response
        return res.status(200).json(
            new ApiResponse(200, {
                prediction: translatedPrediction
            }, "Daily Horoscope fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, error.message || error, "An error occurred while fetching the daily horoscope.")
        );
    }
});
