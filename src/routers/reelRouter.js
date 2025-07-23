// routes/reelRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const reelController = require('../controllers/reelController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/reels'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/upload', upload.single('video'), reelController.uploadReel);
router.get('/', reelController.getAllReels);
router.get('/:id', reelController.getReelById);
router.put('/:id', upload.single('video'), reelController.updateReel);
router.delete('/:id', reelController.deleteReel);
module.exports = router;
