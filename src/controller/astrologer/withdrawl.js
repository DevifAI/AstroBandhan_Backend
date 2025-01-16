import { Astrologer } from '../../models/astrologer.model.js';  // Adjust the import path as needed
import { AstrologerWithdrawalRequest } from '../../models/withdrawl_request.model.js'; // Assuming you have the Withdrawal Request model

export const createWithdrawalRequest = async (req, res) => {
    const { astrologerId, amount, withdrawalType, upiId, bankDetails } = req.body;

    try {
        // Validate input
        if (!astrologerId || !amount || !withdrawalType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Fetch the astrologer from the database
        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json({ message: 'Astrologer not found' });
        }

        // Validate amount against the astrologer's wallet balance
        if (amount < 100) {
            return res.status(400).json({ message: 'Amount must be greater than or equal to 100' });
        }

        if (amount > astrologer.walletBalance) {
            return res.status(400).json({ message: 'Insufficient balance in wallet' });
        }

        // Create a withdrawal request
        const withdrawalRequestData = {
            astrologerId,
            amount,
            withdrawalType,
            isPaymentDone: false,  // Default value
            isApproved: 'false',   // Default value
        };

        if (withdrawalType === 'upi') {
            if (!upiId) {
                return res.status(400).json({ message: 'UPI ID is required for UPI withdrawal' });
            }
            withdrawalRequestData.upiId = upiId;
        } else if (withdrawalType === 'bank') {
            if (!bankDetails) {
                return res.status(400).json({ message: 'Bank details are required for bank withdrawal' });
            }
            withdrawalRequestData.bankDetails = bankDetails;
        } else {
            return res.status(400).json({ message: 'Invalid withdrawal type' });
        }

        // Save the withdrawal request
        const newWithdrawalRequest = new AstrologerWithdrawalRequest(withdrawalRequestData);
        await newWithdrawalRequest.save();

        return res.status(201).json({
            message: 'Withdrawal request created successfully',
            withdrawalRequest: newWithdrawalRequest
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
