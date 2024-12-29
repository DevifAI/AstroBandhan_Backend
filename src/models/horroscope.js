import mongoose from 'mongoose';

const dailyHoroscopeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',  // assuming there's a User model that stores user details
    },
    zodiacSign: {
        type: String,
        required: true,
    },
    predictionDate: {
        type: String,  // "DD-MM-YYYY" format
        required: true,
    },
    prediction: {
        personal_life: String,
        profession: String,
        health: String,
        emotions: String,
        travel: String,
        luck: String,
    },
});

const DailyHoroscope = mongoose.model('DailyHoroscope', dailyHoroscopeSchema);

export default DailyHoroscope;
