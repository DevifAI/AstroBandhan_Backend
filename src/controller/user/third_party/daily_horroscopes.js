import axios from 'axios';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import DailyHoroscope from '../../../models/horroscope.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import { translateText } from '../../../utils/chat_with_ai_astro.js';

// Controller to fetch daily horoscope
export const getDailyHoroscope = asyncHandler(async (req, res) => {
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
            url: `https://json.astrologyapi.com/v1/sun_sign_prediction/daily/${zodiacSign}`,
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
