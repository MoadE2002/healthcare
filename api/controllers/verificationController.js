const mongoose = require('mongoose');
const Verification = require('../models/Verification');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const NotificationService = require('../notificationService')



class VerificationController {
  // 1. Get Verification List with Pagination
  async getVerificationList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const verifications = await Verification.aggregate([
        { $match: { verified: false, seen: false } },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.user',
            foreignField: '_id',
            as: 'doctorUser'
          }
        },
        { $unwind: '$doctor' },
        { $unwind: '$doctorUser' },
        {
          $project: {
            verificationId: '$_id',
            doctorId: '$doctor_id',
            doctorName: '$doctorUser.username',
            doctorEmail: '$doctorUser.email',
            numberOfTimesSent: '$number_of_time_sent',
            declineReason: '$decline_reason',
            lastVerificationAttempt: '$last_verification_attempt'
          }
        },
        { $skip: skip },
        { $limit: limit }
      ]);

      const total = await Verification.countDocuments({ verified: false, seen: false });

      res.status(200).json({
        verifications,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVerifications: total
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching verification list', error: error.message });
    }
  }


  // 2. Get Verification by Verification ID
  async getVerificationById(req, res) {
    try {
      const { id } = req.params;
  
      // Aggregate to get full verification details with doctor and user info
      const verification = await Verification.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        
        // Lookup to join with Doctor model
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor_id',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        
        // Unwind doctor array
        { $unwind: '$doctor' },
  
        // Lookup to join with User model through Doctor
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.user',
            foreignField: '_id',
            as: 'doctorUser'
          }
        },
  
        // Unwind doctorUser array
        { $unwind: '$doctorUser' },
  
        // Lookup to join with Experience model
        {
          $lookup: {
            from: 'experiences',
            localField: 'doctor.experience',
            foreignField: '_id',
            as: 'doctorExperience'
          }
        },
  
        // Lookup to join with Education model
        {
          $lookup: {
            from: 'educations',
            localField: 'doctor.education',
            foreignField: '_id',
            as: 'doctorEducation'
          }
        },
  
        // Project all fields with nested doctor and user info
        {
          $project: {
            verification: {
              _id: '$_id',
              images: '$images',
              frontIdentityCard: '$front_identity_card',
              backIdentityCard: '$back_identity_card',
              description: '$description',
              lastVerificationAttempt: '$last_verification_attempt',
              numberOfTimesSent: '$number_of_time_sent',
              declineReason: '$decline_reason',
              verified: '$verified',
              verificationDate: '$verification_date'
            },
            doctor: {
              _id: '$doctor._id',
              specialty: '$doctor.speciality',
              appointmentPrice: '$doctor.appointmentPrice',
              experience: '$doctorExperience', // Include experiences
              education: '$doctorEducation'   // Include education
            },
            doctorUser: {
              _id: '$doctorUser._id',
              username: '$doctorUser.username',
              email: '$doctorUser.email',
              phone: '$doctorUser.phone',
              age: '$doctorUser.age',
              gender: '$doctorUser.gender'
            }
          }
        }
      ]);
  
      if (!verification.length) {
        return res.status(404).json({ message: 'Verification not found' });
      }
  
      const verificationData = verification[0];
  
      // Function to read image and convert to base64
      const readImageToBase64 = async (imagePath) => {
        try {
          const fullPath = path.isAbsolute(imagePath) 
            ? imagePath 
            : path.join(process.cwd(), imagePath);
          
          const imageBuffer = await fs.readFile(fullPath);
          const ext = path.extname(imagePath).toLowerCase().slice(1);
          const mimeType = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp'
          }[ext] || 'application/octet-stream';
  
          return {
            filename: path.basename(imagePath),
            base64: imageBuffer.toString('base64'),
            mimeType: mimeType
          };
        } catch (error) {
          console.error(`Error reading image ${imagePath}:`, error);
          return null;
        }
      };
  
      // Process images
      const processedImages = await Promise.all([
        ...(verificationData.verification.images || []).map(readImageToBase64),
        readImageToBase64(verificationData.verification.frontIdentityCard),
        readImageToBase64(verificationData.verification.backIdentityCard)
      ]);
  
      const validProcessedImages = processedImages.filter(img => img !== null);
  
      // Prepare response
      const responseData = {
        ...verificationData,
        verification: {
          ...verificationData.verification,
          processedImages: validProcessedImages
        }
      };
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error in getVerificationById:', error);
      res.status(500).json({ 
        message: 'Error fetching verification details', 
        error: error.message 
      });
    }
  }
  

  // 3. Verify Doctor
  async verifyDoctor(req, res) {
    try {
      const { adminId, verificationId, doctorId } = req.body;

      // Validate inputs
      if (!adminId || !verificationId || !doctorId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Find and update verification
      const verification = await Verification.findByIdAndUpdate(
        verificationId,
        {
          verified: true,
          verified_by: adminId,
          verification_date: new Date()
        },
        { new: true }
      );

      // Update doctor's acceptance status
      await Doctor.findByIdAndUpdate(
        doctorId,
        { accepted: true },
        { new: true }
      );

      // Update user's verification status
      const doctor = await Doctor.findById(doctorId);
      await User.findByIdAndUpdate(
        doctor.user,
        { isverified: true },
        { new: true }
      );

      await NotificationService.sendYouAreVerifiedNotification(doctor.user , verification._id) ;

      res.status(200).json({ 
        message: 'Doctor verified successfully', 
        verification 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying doctor', error: error.message });
    }
  }

  // 4. Decline Verification
  async declineVerification(req, res) {
    try {
      const { adminId, verificationId, declineReason } = req.body;

      if (!adminId || !verificationId || !declineReason) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const verification = await Verification.findByIdAndUpdate(
        verificationId,
        {
          verified_by: adminId,
          decline_reason: declineReason,
          seen: true,
          $inc: { number_of_time_sent: 1 },
          last_verification_attempt: new Date()
        },
        { new: true }
      );
      const doctor = await Doctor.findById(verification.doctor_id);

      await NotificationService.sendVerificationDeclinedNotification(doctor.user, declineReason , verification._id) ;

      res.status(200).json({ 
        message: 'Verification declined', 
        verification 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error declining verification', error: error.message });
    }
  }

   // 5. Create Verification
  async createVerification(req, res) {
    try {
  
      const { doctor_id, description } = req.body;
      const frontIdentityCard = req.files?.front_identity_card?.[0];
      const backIdentityCard = req.files?.back_identity_card?.[0];
      const images = req.files?.images || [];
  

  
      // Comprehensive validation
      if (!doctor_id) {
        console.error('Validation Error: No Doctor ID');
        return res.status(400).json({ 
          message: 'Doctor ID is required',
          details: { receivedBody: req.body }
        });
      }
  
      if (!frontIdentityCard) {
        console.error('Validation Error: No Front Identity Card');
        return res.status(400).json({ 
          message: 'Front identity card is required',
          details: { 
            filesReceived: Object.keys(req.files || {}),
            bodyReceived: req.body 
          }
        });
      }
  
      if (!backIdentityCard) {
        console.error('Validation Error: No Back Identity Card');
        return res.status(400).json({ 
          message: 'Back identity card is required',
          details: { 
            filesReceived: Object.keys(req.files || {}),
            bodyReceived: req.body 
          }
        });
      }
  
      if (!description) {
        console.error('Validation Error: No Description');
        return res.status(400).json({ 
          message: 'Description is required',
          details: { receivedBody: req.body }
        });
      }
  
      // Check if doctor exists
      const doctor = await Doctor.findById(doctor_id);
      if (!doctor) {
        console.error('Validation Error: Doctor Not Found');
        return res.status(404).json({ 
          message: 'Doctor not found',
          details: { doctorId: doctor_id }
        });
      }
  
      // Check for existing pending verification
      const existingVerification = await Verification.findOne({ 
        doctor_id, 
        verified: false 
      });
  
      if (existingVerification) {
        console.error('Validation Error: Existing Verification');
        return res.status(400).json({ 
          message: 'An existing verification request is already pending',
          existingVerificationId: existingVerification._id
        });
      }
  
      // Prepare verification data
      const verificationData = {
        doctor_id,
        front_identity_card: frontIdentityCard.path,
        back_identity_card: backIdentityCard.path,
        images: images.map(img => img.path),
        description,
        number_of_time_sent: 1,
        last_verification_attempt: new Date()
      };
  
      // Create and save verification
      const newVerification = new Verification(verificationData);
      
      try {
        await newVerification.save();
        
        return res.status(201).json({
          message: 'Verification request created successfully',
          verification: newVerification
        });
      } catch (saveError) {
        console.error('Save Error:', saveError);
        return res.status(500).json({ 
          message: 'Error saving verification',
          details: saveError.message 
        });
      }
  
    } catch (error) {
      console.error('CRITICAL ERROR in createVerification:', error);
      return res.status(500).json({ 
        message: 'Unexpected error creating verification request', 
        details: error.message 
      });
    }
  }

  async updateVerification(req, res) {
    try {
      const { verificationId, description, front_identity_card, back_identity_card, images } = req.body;
  
      if (!verificationId) {
        return res.status(400).json({ 
          message: 'Verification ID is required'
        });
      }
  
      const existingVerification = await Verification.findById(verificationId);
      if (!existingVerification) {
        return res.status(404).json({ 
          message: 'Verification not found'
        });
      }
  
      if (!existingVerification.seen || !existingVerification.decline_reason) {
        return res.status(400).json({ 
          message: 'Cannot update verification at this time'
        });
      }
  
      if (existingVerification.verified) {
        return res.status(400).json({ 
          message: 'Cannot update a verified verification request'
        });
      }
  
      const updateData = {
        description: description || existingVerification.description,
        front_identity_card: front_identity_card || existingVerification.front_identity_card,
        back_identity_card: back_identity_card || existingVerification.back_identity_card,
        images: images || existingVerification.images,
        number_of_time_sent: existingVerification.number_of_time_sent + 1,
        last_verification_attempt: new Date(),
        decline_reason: null,
        seen: false // Reset seen status so admin can review the updates
      };
  
      const updatedVerification = await Verification.findByIdAndUpdate(
        verificationId,
        updateData,
        { new: true }
      );
  
      res.status(200).json({ 
        message: 'Verification updated successfully', 
        verification: updatedVerification 
      });
    } catch (error) {
      console.error('Error in updateVerification:', error);
      res.status(500).json({ 
        message: 'Error updating verification', 
        error: error.message 
      });
    }
  }
}


module.exports = new VerificationController();