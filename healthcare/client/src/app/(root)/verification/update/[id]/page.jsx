"use client"
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../../../hooks/useAuthContext';
import axiosInstance from '../../../../../apicalls/axiosInstance';
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, XCircle, Upload, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UpdateVerificationDetails = () => {
  const { id: verificationId } = useParams();
  const { user } = useAuthContext();
  const router = useRouter();
  
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [description, setDescription] = useState('');
  const [frontIdentityCard, setFrontIdentityCard] = useState(null);
  const [backIdentityCard, setBackIdentityCard] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (!verificationId) return;

    const fetchVerificationDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/verification/${verificationId}`);
        const { verification } = response.data;
        
        setVerificationDetails(response.data);
        setDescription(verification.description);
        
        // Handle processed images from the response
        const processedImages = verification.processedImages || [];
        const frontImage = processedImages.find(img => img.filename === verification.frontIdentityCard);
        const backImage = processedImages.find(img => img.filename === verification.backIdentityCard);
        const additionalImgs = processedImages.filter(img => 
          img.filename !== verification.frontIdentityCard && 
          img.filename !== verification.backIdentityCard
        );

        // Set existing images with proper data URLs
        setExistingImages(additionalImgs.map(img => 
          `data:${img.mimeType};base64,${img.base64}`
        ));

        // Set ID card images
        if (frontImage) {
          setFrontIdentityCard(`data:${frontImage.mimeType};base64,${frontImage.base64}`);
        }
        if (backImage) {
          setBackIdentityCard(`data:${backImage.mimeType};base64,${backImage.base64}`);
        }

        setLoading(false);
      } catch (error) {
        setError('Failed to fetch verification details');
        setLoading(false);
      }
    };

    fetchVerificationDetails();
  }, [verificationId]);

  const handleImageChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        switch (type) {
          case 'front':
            setFrontIdentityCard(reader.result);
            break;
          case 'back':
            setBackIdentityCard(reader.result);
            break;
          case 'additional':
            setAdditionalImages(prev => [...prev, reader.result]);
            break;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    


    const formData = new FormData();
    formData.append('verificationId', verificationId);
    formData.append('description', description);

    // Convert base64 back to files for upload
    if (frontIdentityCard && frontIdentityCard.startsWith('data:')) {
      const frontFile = await fetch(frontIdentityCard)
        .then(res => res.blob())
        .then(blob => new File([blob], 'front_id.jpg', { type: 'image/jpeg' }));
      formData.append('front_identity_card', frontFile);
    }

    if (backIdentityCard && backIdentityCard.startsWith('data:')) {
      const backFile = await fetch(backIdentityCard)
        .then(res => res.blob())
        .then(blob => new File([blob], 'back_id.jpg', { type: 'image/jpeg' }));
      formData.append('back_identity_card', backFile);
    }

    // Handle additional images
    await Promise.all(additionalImages.map(async (image, index) => {
      if (image.startsWith('data:')) {
        const file = await fetch(image)
          .then(res => res.blob())
          .then(blob => new File([blob], `additional_${index}.jpg`, { type: 'image/jpeg' }));
        formData.append('images', file);
      }
    }));

    try {
      await axiosInstance.put('/verification/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Verification updated successfully');
      setIsEditing(false);
      router.push(`/verification/${verificationId}`);
    } catch (error) {
      alert('Failed to update verification');
    }
  };

  const renderStatusBadge = () => {
    if (verificationDetails?.verification.verified) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-2" /> Verified
        </div>
      );
    }
    if (verificationDetails?.verification.declineReason) {
      return (
        <div className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-2" /> Declined
        </div>
      );
    }
    return (
      <div className="flex items-center text-yellow-600">
        <AlertTriangle className="w-4 h-4 mr-2" /> Pending
      </div>
    );
  };

  const renderImage = (src, alt) => {
    if (!src) return null;
    return (
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto mt-10">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Verification Details</CardTitle>
            <CardDescription>
              View and update your verification details
            </CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Front Identity Card</h3>
                {renderImage(frontIdentityCard, "Front ID")}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Back Identity Card</h3>
                {renderImage(backIdentityCard, "Back ID")}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Images</h3>
              <div className="grid grid-cols-3 gap-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative">
                    {renderImage(img, `Additional Image ${index + 1}`)}
                  </div>
                ))}
              </div>
            </div>

            {verificationDetails?.verification.declineReason && (
              <Alert variant="destructive">
                <AlertDescription>
                  Decline Reason: {verificationDetails.verification.declineReason}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => setIsEditing(true)}
              className="w-full"
              disabled={verificationDetails?.verification.verified}
            >
              Edit Verification
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitUpdate} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Update your verification description"
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Front Identity Card
                  </label>
                  <Input
                    type="file"
                    onChange={(e) => handleImageChange(e, 'front')}
                    accept="image/*"
                    className="mt-1"
                  />
                  {frontIdentityCard && renderImage(frontIdentityCard, "Front ID Preview")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Back Identity Card
                  </label>
                  <Input
                    type="file"
                    onChange={(e) => handleImageChange(e, 'back')}
                    accept="image/*"
                    className="mt-1"
                  />
                  {backIdentityCard && renderImage(backIdentityCard, "Back ID Preview")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Images
                </label>
                <Input
                  type="file"
                  onChange={(e) => handleImageChange(e, 'additional')}
                  accept="image/*"
                  multiple
                  className="mt-1"
                />
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      {renderImage(img, `Additional Image ${index + 1}`)}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={verificationDetails?.verification.verified || !verificationDetails?.verification.seen}
              >
                <Upload className="w-4 h-4 mr-2" />
                Update Verification
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdateVerificationDetails;