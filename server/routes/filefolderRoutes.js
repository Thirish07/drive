const express = require('express');
const router = express.Router();
const filefolderController = require('../controllers/filefolderController');
const protect = require('../middleware/protect');

// Routes for both file and folder operations
router.delete('/empty-trash', protect, filefolderController.emptyTrash);
router.get('/favorites', protect, filefolderController.getFavorites);
router.get('/search', protect,filefolderController.searchFilesAndFolders);
router.get('/recent',protect,filefolderController.getRecentItems);
module.exports = router;
