import express from 'express';
import { astrologerLogin, astrologerLogout, changePassword, forgetPassword, updatePassword, validateOtp } from '../../controller/astrologer/astrologerAuthController.js';
import { editProfilePhoto } from '../../controller/admin/editAstrologerProfilePhoto.js';
import { upload } from '../../middlewares/multer.middlewre.js';
import { addPendingAstrologerRequest, deletePendingAstrologerRequestById } from '../../controller/astrologer/createPendingRequest.js';
import { update_availability } from '../../controller/astrologer/updateAvailability.js';
import { getActiveById } from '../../controller/user/getAllAstrologersController.js';
import { checkAstrologerSocketStatus, getAstrologerById, toggle_Offline_Online, updateAstrologerById } from '../../controller/astrologer/AstrologerController.js';
import { createWithdrawalRequest, getAllWithdrawalRequests } from '../../controller/astrologer/withdrawl.js';
import { authenticateAstrologer } from '../../middlewares/auth.middleware.js';


const router = express.Router();


router.post('/login', astrologerLogin);
router.post('/logout', authenticateAstrologer, astrologerLogout);
router.get('/profile/:astrologerId', getAstrologerById);
router.get('/status', checkAstrologerSocketStatus);
router.patch('/update/profile/:astrologerId', updateAstrologerById);
router.post('/changePassword/:astrologerId', changePassword);
router.put('/editprofilephoto/:astrologerId', upload.single('avatar'), editProfilePhoto)
router.post('/create/pendingastrologer', addPendingAstrologerRequest)
router.delete('/delete/pendingastrologer/:id', deletePendingAstrologerRequestById)
router.post('/send/otp', forgetPassword)
router.post('/validate/otp', validateOtp)
router.post('/update/password', updatePassword)
router.post('/update/availability/:astrologerId', update_availability)
router.post('/activechatroom', getActiveById);
router.post('/toggle/status', toggle_Offline_Online);
router.post('/create/withdrawl', createWithdrawalRequest);
router.get('/get/withdrawl', getAllWithdrawalRequests);


export default router;
