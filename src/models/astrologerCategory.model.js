import mongoose from 'mongoose';

// Define the Category schema
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Ensure category names are unique
        },
        astrologers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Astrologer', // Reference to the Astrologer model
            default: [], // Default is an empty array if no astrologers are assigned
        }],
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the Category model from the schema
const Category = mongoose.model('Category', categorySchema);

export default Category;
