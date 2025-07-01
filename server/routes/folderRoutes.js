const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const protect = require('../middleware/protect');
const verifyTokenOrSharedAccess = require("../middleware/verifyTokenOrSharedAccess");


// Routes for folder operations
router.post('/create', protect, folderController.createFolder);
router.put('/update/:id', protect, folderController.updateFolder);
router.get('/list', protect, folderController.getFoldersByParent);
router.delete('/permanent/:id', protect, folderController.permanentlyDeleteFolder);
router.get('/tree', protect, folderController.getFolderTree);
router.post('/share', protect, folderController.shareFolder);
router.put('/soft-delete/:id', protect, folderController.softDeleteFolder);
router.get('/trash', protect, folderController.getTrashedFolders);
router.put('/restore/:id', protect, folderController.restoreFolder);
router.post('/favorite/:id', protect, folderController.markFolderFavorite);
router.delete('/unfavorite/:id', protect, folderController.unmarkFolderFavorite);
router.get('/shared/folder/:token', verifyTokenOrSharedAccess, folderController.getSharedFolderByToken);
router.get('/:id/children', verifyTokenOrSharedAccess,folderController.getFolderChildren)


module.exports = router;
