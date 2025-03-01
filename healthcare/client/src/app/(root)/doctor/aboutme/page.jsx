"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../../apicalls/axiosInstance";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import ProfileHeader from "../../../../components/ProfileHeader";
import AboutSection from "../../../../components/AboutSection";
import ExperienceSection from "../../../../components/ExperienceSection";
import EducationSection from "../../../../components/EducationSection";

const ProfilePage = ({ doctorId }) => {
  const { user } = useAuthContext();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isOwnProfile = true;

  useEffect(() => {
    if (!user) {
      router.push("/user/login");
      return;
    }

    if (!user.doctorId && user.role !== "DOCTOR" && user.role !== "ADMIN") {
      router.push("/home"); 
      return;
    }

    fetchDoctorData();
  }, [user, doctorId, router]);

  const fetchDoctorData = async () => {
    try {
      const response = await axiosInstance.get(`/doctor/doc/${user.doctorId}`);
      setDoctorData(response.data);
    } catch (error) {
      console.error("Error fetching doctor data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await axiosInstance.put(`/doctor/${user.doctorId}`, updatedData);
      if (response.data.updatedDoctor) {
        setDoctorData(response.data.updatedDoctor);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!user) return null;
  if (loading) return <div>Loading...</div>;
  if (!doctorData) return <div>Doctor data not available</div>;

  return (
    <div className="container mx-auto p-4 w-4/5">
      <ProfileHeader
        userData={doctorData}
        onSave={handleProfileUpdate}
        isOwnProfile={isOwnProfile}
      />
      <AboutSection userData={doctorData} 
        isOwnProfile={isOwnProfile}
        doctorId={user.doctorId}
        onUpdateSuccess={handleProfileUpdate}
      />
      <ExperienceSection
        userData={doctorData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedExperiences) =>
          setDoctorData((prevData) => ({
            ...prevData,
            experiences: updatedExperiences,
          }))
        }
        doctorId={user.doctorId}
      />
      <EducationSection
        userData={doctorData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedEducation) =>
          setDoctorData((prevData) => ({
            ...prevData,
            education: updatedEducation,
          }))
        }
        doctorId={user.doctorId}
      />
    </div>
  );
};

export default ProfilePage;
