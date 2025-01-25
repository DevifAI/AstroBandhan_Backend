import axios from 'axios';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import DailyHoroscope from '../../../models/horroscope.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import { translateText } from '../../../utils/chat_with_ai_astro.js';
import { User } from "../../../models/user.model.js";
import { getCoordinates } from '../../../utils/get_lat&long.js';


const zodiacValue = {
    Aries: 1,
    Tauras: 2,
    Gemini: 3,
    Cancer: 4,
    Leo: 5,
    Virgo: 6,
    Libra: 7,
    Scorpio: 8,
    Sagittarius: 9,
    Capricorn: 10,
    Aquarius: 11,
    Pisces: 12
}

// Controller to fetch daily horoscope
export const getDailyHoroscope = asyncHandler(async (req, res) => {
    try {
        const { userId, zodiacSign, language, date } = req.body;

        if (!userId || !zodiacSign) {
            return res.status(400).json(
                new ApiResponse(400, {}, "UserId and Zodiac Sign are required.")
            );
        }
        // Fetch user details
        const userDetails = await User.findById(userId)
        // Ensure user details are found
        if (!userDetails) {
            return res.status(404).json(
                new ApiResponse(404, {}, "User not found.")
            );
        }


        const payload = {
            date,
            type: "small",
            zodiac: zodiacValue[zodiacSign],
            lang: language,
            api_key: process.env.VEDIC_ASTRO_API_KEY, // API key from environment variables
        };

        const encodedParams = Object.keys(payload).reduce((acc, key) => {
            if (key === 'date') {
                acc[key] = payload[key]; // Keep date and time as they are
            } else {
                acc[key] = encodeURIComponent(payload[key]); // Encode other parameters
            }
            return acc;
        }, {});
        const apiResponse = await axios.get('https://api.vedicastroapi.com/v3-json/prediction/daily-sun', { params: encodedParams });
        // Extract only the `data` property from the Axios response
        const { response, status, data } = apiResponse;
        // Return the prediction response
        return res.status(200).json(
            new ApiResponse(200, {
                response, status, data
            }, "Daily Horoscope fetched successfully.")
        );

    } catch (error) {
        console.error(error);
        return res.status(200).json(
            new ApiResponse(200, {}, "An error occurred while fetching the daily horoscope.")
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
