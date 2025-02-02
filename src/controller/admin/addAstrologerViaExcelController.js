import xlsx from 'xlsx';
import { Astrologer } from '../../models/astrologer.model.js'; // Import your Astrologer model
import fs from 'fs';
import { Language } from '../../models/language.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

// Define your expected headers (schema fields)
const expectedHeaders = [
    'name',
    'gender',
    'phone',
    'experience',
    'specialities',
    'pricePerCallMinute',
    'pricePerVideoCallMinute',
    'pricePerChatMinute',
    'password',
    'languages',
    'chatCommission',
    'callCommission',
    'videoCallCommission',
    'isVerified',
    'isFeatured',
];

// Helper function to get language IDs from language names
async function getLanguageIds(names) {
    const languages = await Language.find({ name: { $in: names } });
    return languages.map((lang) => lang._id);
}

// Controller to handle the upload and process Excel file
export const uploadAstrologerData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Parse the Excel file from the buffer
        const fileBuffer = fs.readFileSync(req.file.path);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

        // Loop through all sheets in the workbook
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet to JSON (rows)
            const rows = xlsx.utils.sheet_to_json(worksheet);

            if (rows.length > 0) {
                // Get headers from the first row of data (keys)
                const headers = Object.keys(rows[0]).map((header) => header.trim())

                // Check if headers match the expected schema
                const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
                const invalidHeaders = headers.filter((header) => !expectedHeaders.includes(header));

                if (missingHeaders.length > 0 || invalidHeaders.length > 0) {
                    fs.unlinkSync(req.file.path); // Delete the uploaded file
                    let errorMsg = '';
                    if (missingHeaders.length > 0) {
                        errorMsg += `Missing headers: ${missingHeaders.join(', ')}. `;
                    }
                    if (invalidHeaders.length > 0) {
                        errorMsg += `Invalid headers: ${invalidHeaders.join(', ')}.`;
                    }
                    return res.status(400).json(new ApiResponse(400, {}, `Invalid headers in sheet ${sheetName}: ${errorMsg}`));
                }

                // Insert rows into the database for this sheet
                for (const row of rows) {
                    const languageNames = row.languages ? row.languages.split(',') : [];
                    const languageIds = await getLanguageIds(languageNames); // Get language IDs

                    const astrologerData = {
                        name: row.name,
                        gender: row.gender,
                        phone: row.phone,
                        experience: row.experience,
                        specialities: row.specialities ? row.specialities.split(',') : [],
                        pricePerCallMinute: row.pricePerCallMinute,
                        pricePerVideoCallMinute: row.pricePerVideoCallMinute,
                        pricePerChatMinute: row.pricePerChatMinute,
                        password: row.password,
                        languages: languageIds,
                        chatCommission: row.chatCommission,
                        callCommission: row.callCommission,
                        videoCallCommission: row.videoCallCommission,
                        isVerified: row.isVerified === 'true', // Convert string to boolean
                        isFeatured: row.isFeatured === 'true', // Convert string to boolean
                        available: {
                            isAvailable: true,
                            isCallAvailable: true,
                            isChatAvailable: true,
                            isVideoCallAvailable: true,
                        },
                    };

                    // Insert the astrologer data into the database
                    await Astrologer.create(astrologerData);
                }

                fs.unlinkSync(req.file.path); // Delete the uploaded file after processing
                return res.status(200).json(new ApiResponse(200, {}, 'Excel sheet uploaded successfully.'));
            }
        }

        fs.unlinkSync(req.file.path); // Delete the uploaded file if no valid sheets are found
        return res.status(400).json(new ApiResponse(400, {}, 'No valid sheets found'));
    } catch (error) {
        console.error(error);
        if (req.file) {
            fs.unlinkSync(req.file.path); // Delete the uploaded file in case of an error
        }
        return res.status(500).json(new ApiResponse(500, {}, error.errorResponse.errmsg));
    }
};
