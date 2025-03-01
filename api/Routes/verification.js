const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// Create the multer instance
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});


// 1. Get Verification List (Admin Only)
router.get('/list', 
  verificationController.getVerificationList
);

// 2. Get Verification by ID (Admin Only)
router.get('/:id', 
  verificationController.getVerificationById
);

// 3. Verify Doctor (Admin Only)
router.post('/verify', 
  verificationController.verifyDoctor
);

// 4. Decline Verification (Admin Only)
router.post('/decline', 
  verificationController.declineVerification
);

// Route configuration
router.post('/create', upload.fields([
    { name: 'front_identity_card', maxCount: 1 },
    { name: 'back_identity_card', maxCount: 1 },
    { name: 'images', maxCount: 9 }
  ]), verificationController.createVerification);
  
  // 6. Update Verification (Doctor Only)
  router.put('/update', upload.fields([
    { name: 'front_identity_card', maxCount: 1 },
    { name: 'back_identity_card', maxCount: 1 },
    { name: 'images', maxCount: 9 }
  ]) ,  verificationController.updateVerification
  );

module.exports = router;