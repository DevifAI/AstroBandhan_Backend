import mongoose from "mongoose";
import { Wallet } from "../../models/walletSchema.model.js";
import Call from "../../models/call.model.js";


export const findWalletByUserId = async (req, res) => {
    try {
        const { userId, type } = req.body
        const user_id = new mongoose.Types.ObjectId(userId);
        if (type === "user") {
            const result = await Wallet.find({
                user_id,
                credit_type: 'wallet_recharge'
            });

            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        } else {
            const result = await Wallet.find({
                astrologer_id: user_id,
            });

            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};


export const findCall_Transaction_ByUserId = async (req, res) => {
    try {
        const { userId, type } = req.body
        if (type === "user") {
            const user_id = new mongoose.Types.ObjectId(userId);

            const result = await Call.find({
                userId: user_id,
                callType: 'audio'
            });
            console.log({ result })
            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        } else {
            const user_id = new mongoose.Types.ObjectId(userId);

            const result = await Call.find({
                astrologerId: user_id,
                callType: 'audio'
            });
            console.log({ result })
            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
export const findVideo_Call_Transaction_ByUserId = async (req, res) => {
    try {
        const { userId, type } = req.body
        const user_id = new mongoose.Types.ObjectId(userId);
        if (type === "user") {
            const result = await Call.find({
                userId: user_id,
                call_type: 'video'
            });

            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        } else {
            const result = await Call.find({
                astrologerId: user_id,
                call_type: 'video'
            });

            if (result.length === 0) {
                return res.status(404).json({ message: 'No records found' });
            }
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};