const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const protect = require('../middleware/protect');
const verifyTokenOrSharedAccess = require('../middleware/verifyTokenOrSharedAccess'); 

router.post('/upload', protect, fileController.uploadFile);
router.get('/list', protect, fileController.getFilesByFolder);
router.get('/all', protect, fileController.getAllFiles);
router.get('/unorganized', protect, fileController.getUnorganizedFiles);
router.put('/soft-delete/:id', protect, fileController.softDeleteFile);
router.get('/trash', protect, fileController.getTrashedFiles);
router.put('/restore/:id', protect, fileController.restoreFile);
router.delete('/permanent/:id', protect, fileController.permanentlyDeleteFile);
router.post('/favorite/:id', protect, fileController.markFileFavorite);
router.delete('/unfavorite/:id', protect, fileController.unmarkFileFavorite);
router.put('/update/:id', protect, fileController.updateFile);
router.post('/share', protect, fileController.shareFile); 

router.get('/shared/file/:token', verifyTokenOrSharedAccess, fileController.getSharedFileByToken);
router.get('/:id/download', verifyTokenOrSharedAccess, fileController.downloadFile);
module.exports = router;
