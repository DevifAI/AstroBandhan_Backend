import express from 'express';
import { astrologerLogin, changePassword } from '../../controller/astrologer/astrologerAuthController.js';
import { editProfilePhoto } from '../../controller/admin/editAstrologerProfilePhoto.js';
import { upload } from '../../middlewares/multer.middlewre.js';
import { addPendingAstrologerRequest } from '../../controller/astrologer/createPendingRequest.js';


const router = express.Router();


router.post('/login', astrologerLogin);
router.post('/changePassword/:astrologerId', changePassword);
router.put('/editprofilephoto/:astrologerId', upload.single('avatar'), editProfilePhoto)
router.post('/create/pendingastrologer', addPendingAstrologerRequest)


export default router;
