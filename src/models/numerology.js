import mongoose from 'mongoose';

const Numerology = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dob: { type: String, required: true },
    name: { type: String, required: true },
    language: { type: String, required: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores the response as an object
}, { timestamps: true });

const NumerologyModel = mongoose.model('Numerology', Numerology);

export default NumerologyModel;
