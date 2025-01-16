import axios from 'axios';
import { getCoordinates } from './get_lat&long.js';
import { parseDateTime } from './parsed_date&time.js';
import { fetchPlanetData } from './astro_api/rasiChart.js';

export const chat_with_ai_astro = async (question, astrologyType, userDetails) => {
    return await getAstrologyResponse(question, astrologyType, userDetails);
};

async function getAstrologyResponse(question, astrologyType, userDetails) {
    let astrologerPersona;

    // Extract user details (name, dateOfBirth, timeOfBirth, placeofbirth)
   
    const { dateOfBirth, timeOfBirth, name, placeOfBirth } = userDetails;
    const get_lat_long = await getCoordinates(placeOfBirth);
    const { lat, lng } = get_lat_long

    const { year, month, date, hours, minutes, seconds } = parseDateTime(
        userDetails.dateOfBirth,
        userDetails.timeOfBirth
    );

    let data = {
        year,
        month,
        date,
        hours,
        minutes,
        seconds,
        latitude: lat,
        longitude: lng,
        timezone: 5.5,
        observation_point: 'topocentric',
        ayanamsha: 'lahiri',
    }

    const kundli_chart_json = await fetchPlanetData(data)
    
    // Assuming the output is an array and we need the first object in the array
    const filteredOutput = kundli_chart_json.output[0] ?
        Object.values(kundli_chart_json.output[0]).filter(planet => planet.current_sign !== undefined).map(planet => ({
            name: planet.name,
            current_sign: planet.current_sign
        })) : [];



    // Set the astrologer persona based on astrology type
    switch (astrologyType.toLowerCase()) {
        case "vedic":
            astrologerPersona = `You are an experienced Vedic astrologer who provides deep insights based on Vedic principles. The user's name is ${name}, their date of birth is ${dateOfBirth}, and time of birth is ${timeOfBirth}.Response like a human being with good knowledge and deep insight about things.This is the user planet sign ${filteredOutput} . Respond in the same language or transliteration style as the question, and keep the response concise, no longer than 3-5 lines.`;
            break;
        case "numerology":
            astrologerPersona = `You are a numerologist who interprets life through the power of numbers. The user's name is ${name}, their date of birth is ${dateOfBirth}, and time of birth is ${timeOfBirth}.This is the user planet sign ${filteredOutput} . Respond in the same language or transliteration style as the question, and keep the response concise, no longer than 3-5 lines.`;
            break;
        case "tarot":
            astrologerPersona = `You are a tarot card reader who provides intuitive guidance. The user's name is ${name}, their date of birth is ${dateOfBirth}, and time of birth is ${timeOfBirth}.This is the user planet sign ${filteredOutput} . Respond in the same language or transliteration style as the question, and keep the response concise, no longer than 3-4 lines.`;
            break;
        default:
            astrologerPersona = `You are an experienced astrologer who answers questions in a mystical and empathetic tone. The user's name is ${name}, their date of birth is ${dateOfBirth}, and time of birth is ${timeOfBirth}. Respond in the same language or transliteration style as the question, and keep the response concise, no longer than 3-4 lines.`;
    }

    // Make the OpenAI API call
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: astrologerPersona
                    },
                    {
                        role: "user",
                        content: question // The question directly determines the language of the response
                    }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Return the AI's response in the same language or transliteration style as the question
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching AI response:", error?.response?.data || error.message);
        return "I'm unable to answer your question right now. Please try again later.";
    }
}


export const translateText = async (text, targetLanguage) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo", // Use the appropriate model
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful assistant capable of translating text into various languages. Please translate the following text into ${targetLanguage}.`
                    },
                    {
                        role: "user",
                        content: text // The text that needs to be translated
                    }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log({response})

        // Extract the translated text from the OpenAI response
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error while translating text:", error);
        throw new Error("Translation failed.");
    }
};

