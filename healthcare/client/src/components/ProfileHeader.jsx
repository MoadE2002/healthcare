import { useState } from "react";
import { Camera, MapPin, Plus, X } from "lucide-react";
import { AttachMoney } from "@mui/icons-material";

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Ophthalmology",
  "Psychiatry",
  "Oncology",
  "Endocrinology",
  "Urology",
  "ENT",
  "Dentistry",
  "Radiology"
];

const ProfileHeader = ({ userData = {}, onSave, isOwnProfile }) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(userData.appointmentPrice || 0);
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Ensure speciality is always an array
  const specialties = Array.isArray(userData.speciality) ? userData.speciality : [];

  const handlePriceSave = () => {
    onSave({ appointmentPrice: editedPrice });
    setIsEditingPrice(false);
  };

  const handleAddSpecialty = () => {
    if (selectedSpecialty && specialties.length < 3) {
      const updatedSpecialties = [...specialties, selectedSpecialty];
      onSave({ specialities: updatedSpecialties }); // Changed to match backend expectation
      setSelectedSpecialty("");
      setIsAddingSpecialty(false);
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove) => {
    const updatedSpecialties = specialties.filter(
      (specialty) => specialty !== specialtyToRemove
    );
    onSave({ specialities: updatedSpecialties }); // Changed to match backend expectation
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div
        className="relative h-48 rounded-t-lg bg-cover bg-center"
        style={{
          backgroundImage: `url('${userData.bannerImg || "/assets/doctors/nobg/doctors.png"}')`
        }}
      />

      <div className="p-4">
        <div className="relative -mt-20 mb-4">
          <img
            className="w-32 h-32 rounded-full mx-auto object-cover"
            src={userData.profilePicture || "/assets/doctors2.jpg"}
            alt={userData.username || "Doctor"}
          />
        </div>

        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">{userData?.username }</h1>
          <p className="text-gray-600">{userData.headline || ""}</p>

          <div className="flex justify-center items-center mt-2">
            <MapPin size={16} className="text-gray-500 mr-1" />
            <span className="text-gray-600">{userData?.address }</span>
          </div>

          {/* Specialties Section */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Specialties</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {specialties.map((specialty) => (
                <div
                  key={specialty}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{specialty}</span>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="ml-2 text-blue-800 hover:text-blue-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {isOwnProfile && specialties.length < 3 && (
                isAddingSpecialty ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="px-3 py-1 rounded-lg border border-gray-300"
                    >
                      <option value="">Select specialty</option>
                      {SPECIALTIES.filter(
                        specialty => !specialties.includes(specialty)
                      ).map(specialty => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddSpecialty}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingSpecialty(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSpecialty(true)}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    Add Specialty
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          {isEditingPrice ? (
            <div className="absolute bottom-0 right-2 flex items-center">
              <div
                className="flex items-center px-4 py-2 rounded-lg shadow-lg"
                style={{
                  background: "linear-gradient(90deg, #FFD700, #FFC300)"
                }}
              >
                <AttachMoney style={{ fontSize: 30, color: "#fff", marginRight: 8 }} />
                <input
                  type="number"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                  className="w-20 px-2 py-1 rounded text-black"
                  min="0"
                />
              </div>
              <button
                onClick={handlePriceSave}
                className="ml-2 bg-green-500 text-white px-3 py-1 rounded-lg"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              className="absolute bottom-0 right-2 flex items-center px-4 py-2 rounded-lg shadow-lg cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #FFD700, #FFC300)",
                color: "#fff"
              }}
              onClick={() => isOwnProfile && setIsEditingPrice(true)}
            >
              <AttachMoney style={{ fontSize: 30, color: "#fff", marginRight: 8 }} />
              <span 
                className="text-xl font-bold" 
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
              >
                {userData.appointmentPrice || 0}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;