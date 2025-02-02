import mongoose from 'mongoose';
import { Astrologer } from '../../models/astrologer.model.js'; // Adjust the import path as needed
import { AstrologerWithdrawalRequest } from '../../models/withdrawl_request.model.js'; // Assuming you have the Withdrawal Request model

export const ApproveWithdrawalRequest = async (req, res) => {
    const { isPaymentDone, payment_id } = req.body;

    try {
        // Validate input
        if (typeof isPaymentDone === 'undefined') {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the withdrawal request by payment_id
        const withdrawalRequest = await AstrologerWithdrawalRequest.findById(payment_id);
        if (!withdrawalRequest) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        // Update the fields based on isPaymentDone status
        const updatedFields = {
            isPaymentDone,
            isApproved: isPaymentDone ? 'true' : 'reject',
        };

        // Update the withdrawal request in the database
        const updatedRequest = await AstrologerWithdrawalRequest.findByIdAndUpdate(
            payment_id,
            updatedFields,
            { new: true }  // To return the updated document
        );

        if (!updatedRequest) {
            return res.status(500).json({ message: 'Failed to update withdrawal request' });
        }

        return res.status(200).json({
            message: 'Withdrawal request updated successfully',
            withdrawalRequest: updatedRequest
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
