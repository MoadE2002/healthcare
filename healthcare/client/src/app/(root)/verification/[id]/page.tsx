"use client";

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../../hooks/useAuthContext';
import axiosInstance from '../../../../apicalls/axiosInstance';
import { useParams } from "next/navigation"; 
import Image from 'next/image';
import path from 'path';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from "next/navigation";


// Custom toast function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  alert(message);
  console.log(`Toast (${type}):`, message);
};

interface VerificationDetails {
  verification: {
    _id: string;
    processedImages?: Array<{
      filename: string;
      base64: string;
      mimeType: string;
    }>;
    frontIdentityCard?: {
      filename: string;
      base64: string;
      mimeType: string;
    };
    backIdentityCard?: {
      filename: string;
      base64: string;
      mimeType: string;
    };
    description: string;
    verified: boolean;
    declineReason?: string;
  };
  doctor: {
    _id: string;
    specialty: string;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      graduationYear: string;
    }>;
  };
  doctorUser: {
    username: string;
    email: string;
  };
}

const VerificationDetails: React.FC = () => {
    const { id: verificationId } = useParams()
    const { user } = useAuthContext();
    const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);
    const [declineReason, setDeclineReason] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();





    useEffect(() => {
        if (!verificationId) return;

        const fetchVerificationDetails = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/verification/${verificationId}`);
                setVerificationDetails(response.data);
                setLoading(false);
            } catch (error) {
                setError('Failed to fetch verification details');
                setLoading(false);
                showToast('Failed to fetch verification details', 'error');
            }
        };

        fetchVerificationDetails();
    }, [verificationId]);

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

    const handleVerify = async () => {
        if (!user || user.role !== 'ADMIN') {
            showToast('Only admins can verify doctors', 'error');
            return;
        }

        try {
            await axiosInstance.post('/verification/verify', {
                adminId: user._id,
                verificationId: verificationDetails?.verification._id,
                doctorId: verificationDetails?.doctor._id
            });

            showToast('Doctor verified successfully');

            setVerificationDetails(prev => prev ? { 
                ...prev, 
                verification: { ...prev.verification, verified: true } 
            } : null);
        } catch (error) {
            showToast('Failed to verify doctor', 'error');
        }
    };

    const handleDecline = async () => {
        if (!user || user.role !== 'ADMIN') {
            showToast('Only admins can decline verifications', 'error');
            return;
        }

        if (!declineReason.trim()) {
            showToast('Decline reason is required', 'error');
            return;
        }

        try {
            await axiosInstance.post('/verification/decline', {
                adminId: user._id,
                verificationId: verificationDetails?.verification._id,
                declineReason
            });

            showToast('Verification declined');

            setVerificationDetails(prev => prev ? { 
                ...prev, 
                verification: { 
                    ...prev.verification, 
                    declineReason 
                } 
            } : null);
        } catch (error) {
            showToast('Failed to decline verification', 'error');
        }
    };

    const renderStatusBadge = () => {
        if (verificationDetails?.verification.verified) {
            return (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2" /> Verified
                </div>
            );
        }
        if (verificationDetails?.verification.declineReason) {
            return (
                <div className="flex items-center text-red-600">
                    <XCircle className="mr-2" /> Declined
                </div>
            );
        }
        return (
            <div className="flex items-center text-yellow-600">
                <AlertTriangle className="mr-2" /> Pending
            </div>
        );
    };

    const renderAdminActions = () => {
        if (user?.role !== 'ADMIN' || verificationDetails?.verification.verified) return null;

        return (
            <div className="flex space-x-4 mt-4">
                <Button onClick={handleVerify} variant="default">
                    Verify Doctor
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Decline</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Decline Verification</DialogTitle>
                        </DialogHeader>
                        <Textarea 
                            placeholder="Provide a reason for declining the verification"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                        />
                        <Button 
                            variant="destructive" 
                            onClick={handleDecline} 
                            disabled={!declineReason.trim()}
                        >
                            Confirm Decline
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>
        );
    };

    const renderIdentityAndOtherImages = () => {
        // Find the processed images for front and back identity cards
        const frontIdentityCardImage = verificationDetails?.verification.processedImages?.find(
            img => img.filename === path.basename(verificationDetails.verification.frontIdentityCard)
        );
        const backIdentityCardImage = verificationDetails?.verification.processedImages?.find(
            img => img.filename === path.basename(verificationDetails.verification.backIdentityCard)
        );
        
        // Find other images, excluding front and back identity card filenames
        const otherImages = verificationDetails?.verification.processedImages?.filter(
            img => 
                img.filename !== path.basename(verificationDetails.verification.frontIdentityCard) &&
                img.filename !== path.basename(verificationDetails.verification.backIdentityCard)
        ) || [];
    
        return (
            <div className="mt-4">
                {/* Identity Card Images */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {frontIdentityCardImage && (
                        <div 
                            className="cursor-pointer hover:opacity-75 transition"
                            onClick={() => setSelectedImage(frontIdentityCardImage.base64)}
                        >
                            <Image 
                                src={`data:image/png;base64,${frontIdentityCardImage.base64}`}
                                alt="Front Identity Card"
                                width={300}
                                height={200}
                                className="object-cover rounded-lg h-48 w-full"
                            />
                            <p className="text-center mt-2">Front Identity Card</p>
                        </div>
                    )}
                    
                    {backIdentityCardImage && (
                        <div 
                            className="cursor-pointer hover:opacity-75 transition"
                            onClick={() => setSelectedImage(backIdentityCardImage.base64)}
                        >
                            <Image 
                                src={`data:image/png;base64,${backIdentityCardImage.base64}`}
                                alt="Back Identity Card"
                                width={300}
                                height={200}
                                className="object-cover rounded-lg h-48 w-full"
                            />
                            <p className="text-center mt-2">Back Identity Card</p>
                        </div>
                    )}
                </div>
    
                {/* Other Images */}
                {otherImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {otherImages.map((img, index) => (
                            <div 
                                key={index} 
                                className="cursor-pointer hover:opacity-75 transition"
                                onClick={() => setSelectedImage(img.base64)}
                            >
                                <Image 
                                    src={`data:image/png;base64,${img.base64}`}
                                    alt={img.filename}
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-lg h-40 w-full"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderEducationDetails = () => {
        const education = verificationDetails?.doctor.education || [];
        const experience = verificationDetails?.doctor.experience || [];

        return (
            <div className="mt-6">
                <h3 className=" text-2xl font-extrabold  mb-4">Education & Experience</h3>
                
                {education.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xl font-bold mb-2">Education</h4>
                        {education.map((edu, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                                <p className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</p>
                                <p>{edu.institution}</p>
                                <p className="text-sm text-gray-600">Graduated: {edu.graduationYear}</p>
                            </div>
                        ))}
                    </div>
                )}

                {experience.length > 0 && (
                    <div>
                        <h4 className="text-xl font-bold mb-2">Professional Experience</h4>
                        {experience.map((exp, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                                <p className="font-semibold">{exp.position}</p>
                                <p>{exp.company}</p>
                                <p className="text-sm text-gray-600">
                                    {exp.startDate} - {exp.endDate || 'Present'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    if (!verificationDetails) {
        return <div className="text-center mt-10">No verification details found</div>;
    }

    return (
        <Card className="max-w-4xl mx-auto mt-10">
            <CardHeader>
                <CardTitle>Verification Details</CardTitle>
                <CardDescription>
                    Details for Dr. {verificationDetails.doctorUser.username}
                </CardDescription>
                {renderStatusBadge()}
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Doctor Information</h3>
                        <p>Specialty: {verificationDetails.doctor.specialty}</p>
                        <p>Email: {verificationDetails.doctorUser.email}</p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Verification Description</h3>
                        <p>{verificationDetails.verification.description}</p>
                        
                        {verificationDetails.verification.declineReason && (
                            <div className="mt-4 text-red-600">
                                <strong>Decline Reason:</strong> 
                                {verificationDetails.verification.declineReason}
                            </div>
                        )}
                    </div>
                </div>

                {renderIdentityAndOtherImages()}
                {renderEducationDetails()}
                {renderAdminActions()}
            </CardContent>

            {/* Full Image Dialog */}
            {selectedImage && (
                <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                    <DialogContent className="max-w-4xl">
                        <Image 
                            src={`data:image/png;base64,${selectedImage}`}
                            alt="Full Image"
                            width={1000}
                            height={1000}
                            className="w-full h-auto"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
};

export default VerificationDetails;