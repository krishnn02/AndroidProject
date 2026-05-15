import { Router } from 'express';
import { uploadImages, deleteImage, reorderImages, uploadLogo } from '../controllers/imageController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/sections/:sectionId/images', upload.array('images', 10), uploadImages);
router.delete('/:id', deleteImage);
router.patch('/sections/:sectionId/reorder', reorderImages);
router.post('/logo', upload.single('logo'), uploadLogo);

export default router;
