"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  TextField, 
  Typography, 
  Box, 
  IconButton, 
  Grid 
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  X as XIcon, 
  FileImage as FileImageIcon 
} from 'lucide-react';
import axiosInstance from "../../../apicalls/axiosInstance";
import { useAuthContext } from "../../../hooks/useAuthContext";

// Define types for form data and validation
interface FormData {
  frontIdentityCard: File | null;
  backIdentityCard: File | null;
  proofImages: File[];
  description: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof FormData, string>>;
}

const validateForm = (data: FormData): ValidationResult => {
  const errors: Partial<Record<keyof FormData, string>> = {};

  if (!data.frontIdentityCard) {
    errors.frontIdentityCard = "Front identity card is required.";
  }

  if (!data.backIdentityCard) {
    errors.backIdentityCard = "Back identity card is required.";
  }

  if (data.proofImages.length === 0) {
    errors.proofImages = "At least one proof image is required.";
  } else if (data.proofImages.length > 9) {
    errors.proofImages = "You can upload a maximum of 9 proof images.";
  }

  if (data.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters long.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const DoctorVerificationPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [frontIdentityPreview, setFrontIdentityPreview] = useState<string | null>(null);
  const [backIdentityPreview, setBackIdentityPreview] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofImagePreviews, setProofImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    frontIdentityCard: null,
    backIdentityCard: null,
    proofImages: [],
    description: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    return () => {
      // Cleanup previews to avoid memory leaks
      proofImagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [proofImagePreviews]);

  useEffect(() => {
      // Redirect to login page if user is not logged in
      if (!user) {
        router.push("/user/login");
        return;
      }

      if (!user.doctorId && user.role !== "DOCTOR" && user.role !== "ADMIN") {
        router.push("/home"); 
        return;
      }
  }, [user, router]);

  if (!user) {
      return null;
    }

  const handleIdentityCardUpload = (
    event: React.ChangeEvent<HTMLInputElement>, 
    type: 'front' | 'back'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setFrontIdentityPreview(reader.result as string);
          setFormData(prev => ({ ...prev, frontIdentityCard: file }));
        } else {
          setBackIdentityPreview(reader.result as string);
          setFormData(prev => ({ ...prev, backIdentityCard: file }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProofImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newProofImages = [...proofImages, ...files].slice(0, 9);

    const newPreviews = newProofImages.map(file => URL.createObjectURL(file));

    setProofImages(newProofImages);
    setProofImagePreviews(newPreviews);
    setFormData(prev => ({ ...prev, proofImages: newProofImages }));
  };

  const removeProofImage = (indexToRemove: number) => {
    const updatedImages = proofImages.filter((_, index) => index !== indexToRemove);
    const updatedPreviews = proofImagePreviews.filter((_, index) => index !== indexToRemove);

    setProofImages(updatedImages);
    setProofImagePreviews(updatedPreviews);
    setFormData(prev => ({ ...prev, proofImages: updatedImages }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    if (!user?.doctorId) {
      alert("Doctor ID is missing. Please log in again.");
      return;
    }
  
    const validation = validateForm(formData);
  
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const submitFormData = new FormData();
  
      submitFormData.append('doctor_id', user.doctorId);      

      if (formData.frontIdentityCard) {
        submitFormData.append('front_identity_card', formData.frontIdentityCard);
      }
      
      if (formData.backIdentityCard) {
        submitFormData.append('back_identity_card', formData.backIdentityCard);
      }
      
      proofImages.forEach((file, index) => {
        submitFormData.append('images', file);
      });
      
      submitFormData.append('description', formData.description);
      
      const response = await axiosInstance.post('/verification/create', submitFormData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
      });

      alert('Verification request submitted successfully');
      router.push('/home');
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Full error object:', error);
        
        const axiosError = error as { response?: { data?: { message: string }, message: string } };
        alert(
          axiosError.response?.data?.message || 
          axiosError.response?.message || 
          "An unexpected error occurred during verification submission."
        );
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxWidth="lg" sx={{ mx: 'auto', p: 3 }}>
      <Card>
        <CardHeader title="send your Verification" />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Front Identity Card */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Front of Identity Card
                </Typography>
                <Box 
                  sx={{ 
                    border: 2, 
                    borderStyle: 'dashed', 
                    borderColor: errors.frontIdentityCard ? 'error.main' : 'grey.300', 
                    borderRadius: 2, 
                    p: 2 
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="frontIdentityCard"
                    onChange={(e) => handleIdentityCardUpload(e, 'front')}
                  />
                  {frontIdentityPreview ? (
                    <img 
                      src={frontIdentityPreview} 
                      alt="Front Identity Card" 
                      style={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ) : (
                    <label 
                      htmlFor="frontIdentityCard" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer' 
                      }}
                    >
                      <UploadIcon color="gray" size={40} />
                      <Typography color="textSecondary">Upload Front of Identity Card</Typography>
                    </label>
                  )}
                </Box>
                {errors.frontIdentityCard && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {errors.frontIdentityCard}
                  </Typography>
                )}
              </Grid>

              {/* Back Identity Card */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Back of Identity Card
                </Typography>
                <Box 
                  sx={{ 
                    border: 2, 
                    borderStyle: 'dashed', 
                    borderColor: errors.backIdentityCard ? 'error.main' : 'grey.300', 
                    borderRadius: 2, 
                    p: 2 
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="backIdentityCard"
                    onChange={(e) => handleIdentityCardUpload(e, 'back')}
                  />
                  {backIdentityPreview ? (
                    <img 
                      src={backIdentityPreview} 
                      alt="Back Identity Card" 
                      style={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ) : (
                    <label 
                      htmlFor="backIdentityCard" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer' 
                      }}
                    >
                      <UploadIcon color="gray" size={40} />
                      <Typography color="textSecondary">Upload Back of Identity Card</Typography>
                    </label>
                  )}
                </Box>
                {errors.backIdentityCard && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {errors.backIdentityCard}
                  </Typography>
                )}
              </Grid>

              {/* Proof Images Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Proof Images
                </Typography>
                <Box 
                  sx={{ 
                    border: 2, 
                    borderStyle: 'dashed', 
                    borderColor: errors.proofImages ? 'error.main' : 'grey.300', 
                    borderRadius: 2, 
                    p: 2 
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    id="proofImages"
                    onChange={handleProofImagesUpload}
                  />
                  {proofImages.length === 0 ? (
                    <label 
                      htmlFor="proofImages" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer' 
                      }}
                    >
                      <FileImageIcon color="gray" size={40} />
                      <Typography color="textSecondary">Upload Proof Images (Max 9)</Typography>
                    </label>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                      {proofImagePreviews.map((preview, index) => (
                        <Box key={index} sx={{ position: 'relative' }}>
                          <img 
                            src={preview} 
                            alt={`Proof ${index + 1}`} 
                            style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeProofImage(index)}
                            sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              right: 0, 
                              bgcolor: 'error.main', 
                              color: 'white', 
                              '&:hover': { bgcolor: 'error.dark' } 
                            }}
                          >
                            <XIcon size={16} />
                          </IconButton>
                        </Box>
                      ))}
                      {proofImages.length < 5 && (
                        <label 
                          htmlFor="proofImages" 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            border: '2px dashed #ccc', 
                            borderRadius: 8, 
                            height: 96, 
                            cursor: 'pointer' 
                          }}
                        >
                          <UploadIcon color="gray" size={24} />
                        </label>
                      )}
                    </Box>
                  )}
                </Box>
                {errors.proofImages && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {errors.proofImages}
                  </Typography>
                )}
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <TextField 
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide additional details about your verification"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Verification Request'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DoctorVerificationPage;