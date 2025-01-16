import express from 'express';
import { astrologerLogin, changePassword, forgetPassword, updatePassword, validateOtp } from '../../controller/astrologer/astrologerAuthController.js';
import { editProfilePhoto } from '../../controller/admin/editAstrologerProfilePhoto.js';
import { upload } from '../../middlewares/multer.middlewre.js';
import { addPendingAstrologerRequest } from '../../controller/astrologer/createPendingRequest.js';
import { update_availability } from '../../controller/astrologer/updateAvailability.js';
import { getActiveById } from '../../controller/user/getAllAstrologersController.js';
import { toggle_Offline_Online } from '../../controller/astrologer/AstrologerController.js';
import { createWithdrawalRequest } from '../../controller/astrologer/withdrawl.js';


const router = express.Router();


router.post('/login', astrologerLogin);
router.post('/changePassword/:astrologerId', changePassword);
router.put('/editprofilephoto/:astrologerId', upload.single('avatar'), editProfilePhoto)
router.post('/create/pendingastrologer', addPendingAstrologerRequest)
router.post('/send/otp', forgetPassword)
router.post('/validate/otp', validateOtp)
router.post('/update/password', updatePassword)
router.post('/update/availability/:astrologerId', update_availability)
router.post('/activechatroom', getActiveById);
router.post('/toggle/status', toggle_Offline_Online);
router.post('/create/withdrawl', createWithdrawalRequest);


export default router;
