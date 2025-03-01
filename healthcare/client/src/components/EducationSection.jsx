"use client";
import { School, X } from "lucide-react";
import { useState } from "react";
import axiosInstance from "../apicalls/axiosInstance";

const EducationSection = ({ userData, isOwnProfile, onSave, doctorId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [educations, setEducations] = useState(userData.education || []);
  const [newEducation, setNewEducation] = useState({
    school: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
  });

  const handleAddEducation = async () => {
    if (newEducation.school && newEducation.fieldOfStudy && newEducation.startYear) {
      try {
        const response = await axiosInstance.post(`/education`, {
          doctor: doctorId,
          ...newEducation,
        });
        setEducations([...educations, response.data]);
        onSave([...educations, response.data]);

        setNewEducation({
          school: "",
          fieldOfStudy: "",
          startYear: "",
          endYear: "",
        });
      } catch (error) {
        console.error("Error adding education:", error);
      }
    }
  };

  const handleDeleteEducation = async (index, educationId) => {
    try {
      await axiosInstance.delete(`/education/${educationId}`);
      const updatedEducations = educations.filter((_, idx) => idx !== index);
      setEducations(updatedEducations);
      onSave(updatedEducations);
    } catch (error) {
      console.error("Error deleting education:", error);
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all(educations.map(edu => axiosInstance.put(`/education/${edu._id}`, edu)));
      onSave(educations);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving educations:", error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Education</h2>
      {educations.map((edu, index) => (
        <div key={index} className="mb-4 flex justify-between items-start">
          <div className="flex items-start">
            <School size={20} className="mr-2 mt-1" />
            <div>
              <h3 className="font-semibold">{edu.fieldOfStudy}</h3>
              <p className="text-gray-600">{edu.school}</p>
              <p className="text-gray-500 text-sm">
                {edu.startYear} - {edu.endYear || "Present"}
              </p>
            </div>
          </div>
          {isEditing && (
            <button onClick={() => handleDeleteEducation(index, edu._id)} className="text-red-500">
              <X size={20} />
            </button>
          )}
        </div>
      ))}
      {isEditing && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="School"
            value={newEducation.school}
            onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Field of Study"
            value={newEducation.fieldOfStudy}
            onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="number"
            placeholder="Start Year"
            value={newEducation.startYear}
            onChange={(e) => setNewEducation({ ...newEducation, startYear: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="number"
            placeholder="End Year"
            value={newEducation.endYear}
            onChange={(e) => setNewEducation({ ...newEducation, endYear: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleAddEducation}
            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
          >
            Add Education
          </button>
        </div>
      )}

      {isOwnProfile && (
        <>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 text-primary hover:text-primary-dark transition duration-300"
            >
              Edit Education
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default EducationSection;
