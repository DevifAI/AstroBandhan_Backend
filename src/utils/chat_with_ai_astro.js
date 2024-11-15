import axios from 'axios';

export const chat_with_ai_astro = async (question, astrologyType, language, userDetails) => {
    return await getAstrologyResponse(question, astrologyType, language, userDetails);
}

async function getAstrologyResponse(question, astrologyType, language, userDetails) {
    let astrologerPersona;

    // Extract user details (name, dateofbirth, timeofbirth)
    const { dateofbirth, timeofbirth, name } = userDetails;

    // Set the astrologer persona based on astrology type and include user details for personalization
    switch (astrologyType.toLowerCase()) {
        case "vedic":
            astrologerPersona = `You are an experienced Vedic astrologer who provides deep insights based on Vedic principles. The user's name is ${name}, their date of birth is ${dateofbirth} and time of birth is ${timeofbirth}. Respond concisely in ${language}, no longer than 3-4 lines.`;
            break;
        case "numerology":
            astrologerPersona = `You are a numerologist who interprets life through the power of numbers. The user's name is ${name}, their date of birth is ${dateofbirth} and time of birth is ${timeofbirth}. Respond concisely in ${language}, no longer than 3-4 lines.`;
            break;
        case "tarot":
            astrologerPersona = `You are a tarot card reader who provides intuitive guidance. The user's name is ${name}, their date of birth is ${dateofbirth} and time of birth is ${timeofbirth}. Respond concisely in ${language}, no longer than 3-4 lines.`;
            break;
        default:
            astrologerPersona = `You are an experienced astrologer who answers questions in a mystical and empathetic tone. The user's name is ${name}, their date of birth is ${dateofbirth} and time of birth is ${timeofbirth}. Respond concisely in ${language}, no longer than 3-4 lines.`;
    }

    // Now we create the request payload and make the OpenAI API call
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
                        content: question // Send the question directly in the user's preferred language
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

        // Return the AI's concise response
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching AI response:", error?.response?.data || error.message);
        return "I'm unable to answer your question right now. Please try again later.";
    }
}


