const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Get unseen feedbacks
router.get('/unseen', feedbackController.getUnseenFeedbacks);

//Get feedback by doctorid 

router.get('/:doctor_id', feedbackController.getFeedbacksBydoctor);

// Mark feedbacks as seen
router.patch('/mark-seen', feedbackController.markFeedbackAsSeen);

// Create a new feedback
router.post('/', feedbackController.createFeedback);

// Approve feedbacks
router.patch('/approve', feedbackController.approveFeedback);

router.delete('/:id', feedbackController.deleteFeedback);


module.exports = router;