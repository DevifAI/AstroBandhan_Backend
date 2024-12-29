import mongoose from 'mongoose';

const Panchang = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    language: { type: String, required: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores the response as an object
}, { timestamps: true });

const PanchangModel = mongoose.model('Panchang', Panchang);

export default PanchangModel;
