"use client"
import { useState } from "react";
import axiosInstance from "../apicalls/axiosInstance";

const AboutSection = ({ userData, isOwnProfile, doctorId, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(userData.about || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`/doctor/${doctorId}`, {
        about: about
      });
      
      if (response.data) {
        onUpdateSuccess(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating about section:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">About</h2>
      {isOwnProfile ? (
        <>
          {isEditing ? (
            <>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="4"
                placeholder="Tell us about yourself..."
                disabled={isLoading}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAbout(userData.about || "");
                  }}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition duration-300"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{about || "No description added yet."}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-primary hover:text-primary-dark transition duration-300"
              >
                Edit
              </button>
            </>
          )}
        </>
      ) : (
        <p className="whitespace-pre-wrap">
          {userData.about || "No description available."}
        </p>
      )}
    </div>
  );
};

export default AboutSection;