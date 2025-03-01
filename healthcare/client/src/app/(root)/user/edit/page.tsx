"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { TextField, Button, Avatar, IconButton } from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import axiosInstance from "../../../../apicalls/axiosInstance";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import { useErreur } from "../../../../context/ErreurContext"; // Import the useErreur hook

const DEFAULT_PROFILE_IMAGE = "/default-avatar.webp"; // Add a default image path

const UserProfile: React.FC = () => {
  const { user } = useAuthContext();
  const userId = user?._id;
  const { showError } = useErreur(); 

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    city: "",
    address: "",
    age: "",
    gender: "",
    email: "",
  });

  const [originalFormData, setOriginalFormData] = useState(formData);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(DEFAULT_PROFILE_IMAGE);

  // Track which form is being edited
  const [isEditing, setIsEditing] = useState({
    profile: false,
    password: false,
    email: false
  });

  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailChangeData, setEmailChangeData] = useState({
    confirmPassword: "",
    newEmail: "",
  });

  useEffect(() => {
    // Fetch user details on component mount
    const fetchUserDetails = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}`);
        const userData = response.data;
        
        // Ensure all fields are present
        const updatedFormData = {
          username: userData.username || "",
          phone: userData.phone || "",
          city: userData.city || "",
          address: userData.address || "",
          age: userData.age ? userData.age.toString() : "",
          gender: userData.gender || "",
          email: userData.email || "",
        };

        setFormData(updatedFormData);
        setOriginalFormData(updatedFormData);

        if (userData.photoDeProfile) {
          setPreviewImage(userData.photoDeProfile);
        } else {
          setPreviewImage(DEFAULT_PROFILE_IMAGE);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        showError('error', 'Failed to fetch user details');
        setPreviewImage(DEFAULT_PROFILE_IMAGE);
      }
    };

    if (userId) fetchUserDetails();
  }, [userId]);

  const updateLocalStorageUser = (updatedFields: Partial<typeof user>) => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...storedUser, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Enable editing mode when something changes
    setIsEditing(prev => ({ ...prev, profile: true }));
  };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setIsEditing(prev => ({ ...prev, profile: true }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const submitData = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof typeof formData]) {
        submitData.append(key, formData[key as keyof typeof formData]);
      }
    });
    
    if (profileImage) {
      submitData.append('photoDeProfile', profileImage);
    }

    try {
      const response = await axiosInstance.put(`/users/${userId}/details`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Prepare update for localStorage
      const localStorageUpdate: any = { ...formData };
      
      // If a new profile image was uploaded, add it to the update
      if (profileImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          localStorageUpdate.photoDeProfile = reader.result as string;
          updateLocalStorageUser(localStorageUpdate);
        };
        reader.readAsDataURL(profileImage);
      } else {
        // If no new image, update other fields
        updateLocalStorageUser(localStorageUpdate);
      }

      setOriginalFormData(formData);
      setProfileImage(null);
      setIsEditing(prev => ({ ...prev, profile: false }));
      showError('Success', 'Profile updated successfully');
    } catch (error) {
      console.error("Error updating user details:", error);
      showError('error', 'Failed to update profile');
    }
  };

  const handleCancelProfile = () => {
    // Reset form data to original values
    setFormData(originalFormData);
    setProfileImage(null);
    setPreviewImage(originalFormData.photoDeProfile || DEFAULT_PROFILE_IMAGE);
    setIsEditing(prev => ({ ...prev, profile: false }));
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordChangeData;

    if (newPassword !== confirmPassword) {
      console.error("Passwords do not match.");
      return;
    }

    try {
      const response = await axiosInstance.put(`/users/${userId}/password`, { oldPassword, newPassword });
      showError('Success', 'Password updated successfully');
      setPasswordChangeData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setIsEditing(prev => ({ ...prev, password: false }));
    } catch (error) {
      console.error("Error updating password:", error);
      showError('error', 'Failed to update password');
    }
  };

  const handleEmailChangeSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const { confirmPassword, newEmail } = emailChangeData;

    try {
      const response = await axiosInstance.put(`/users/${userId}/email`, { 
        password: confirmPassword, 
        newEmail 
      });
      showError('Success', 'Email updated successfully');
      setEmailChangeData({ confirmPassword: "", newEmail: "" });
      setIsEditing(prev => ({ ...prev, email: false }));
    } catch (error) {
      console.error("Error updating email:", error);
      showError('error', 'Failed to update email');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-gradient-to-br from-blue-200 to-green-200">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full space-y-8">
        <h2 className="text-4xl font-bold text-center text-blue-600">Update Profile</h2>

        <div className="flex justify-center mb-6">
          <Avatar 
            alt={formData.username} 
            src={previewImage} 
            sx={{ width: 100, height: 100 }} 
          />
          <input
            accept="image/*"
            id="upload-photo"
            type="file"
            style={{ display: "none" }}
            onChange={handleProfileImageChange}
          />
          <label htmlFor="upload-photo">
            <IconButton color="primary" aria-label="upload picture" component="span">
              <PhotoCamera />
            </IconButton>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Name"
              variant="outlined"
              name="username"
              fullWidth
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Phone Number"
              variant="outlined"
              name="phone"
              fullWidth
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="City"
              variant="outlined"
              name="city"
              fullWidth
              value={formData.city}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Address"
              variant="outlined"
              name="address"
              fullWidth
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Age"
              variant="outlined"
              name="age"
              type="number"
              fullWidth
              value={formData.age}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Gender"
              variant="outlined"
              name="gender"
              fullWidth
              value={formData.gender}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            {isEditing.profile && (
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCancelProfile}
              >
                Cancel
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              type="submit" 
              disabled={!isEditing.profile}
            >
              Save Changes
            </Button>
          </div>
        </form>



        <div className="grid md:grid-cols-2 gap-8">
  {/* Password Update Section */}
  <div className="p-6 rounded-lg border shadow-md bg-white">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
        <LockIcon className="mr-3 text-blue-600" /> Change Password
      </h3>
      {!isEditing.password && (
        <Button 
          variant="outlined" 
          color="primary" 
          size="small"
          onClick={() => setIsEditing(prev => ({ ...prev, password: true }))}
          startIcon={<EditIcon />}
        >
          Change
        </Button>
      )}
    </div>

    {!isEditing.password ? (
      <div className="text-center py-4">
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          type="password"
          value="************"
          InputProps={{
            readOnly: true,
          }}
        />
      </div>
    ) : (
      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <TextField
          label="Old Password"
          variant="outlined"
          name="oldPassword"
          fullWidth
          type="password"
          value={passwordChangeData.oldPassword}
          onChange={(e) => {
            setPasswordChangeData({ ...passwordChangeData, oldPassword: e.target.value });
          }}
          required
        />
        <TextField
          label="New Password"
          variant="outlined"
          name="newPassword"
          fullWidth
          type="password"
          value={passwordChangeData.newPassword}
          onChange={(e) => {
            setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value });
          }}
          required
        />
        <TextField
          label="Confirm New Password"
          variant="outlined"
          name="confirmPassword"
          fullWidth
          type="password"
          value={passwordChangeData.confirmPassword}
          onChange={(e) => {
            setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value });
          }}
          required
        />
        <div className="flex justify-end gap-3">
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => {
              setPasswordChangeData({ oldPassword: "", newPassword: "", confirmPassword: "" });
              setIsEditing(prev => ({ ...prev, password: false }));
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
          >
            Update Password
          </Button>
        </div>
      </form>
    )}
  </div>

  {/* Email Update Section */}
  <div className="p-6 rounded-lg border shadow-md bg-white">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
        <EditIcon className="mr-3 text-blue-600" /> Change Email
      </h3>
      {!isEditing.email && (
        <Button 
          variant="outlined" 
          color="primary" 
          size="small"
          onClick={() => setIsEditing(prev => ({ ...prev, email: true }))}
          startIcon={<EditIcon />}
        >
          Change
        </Button>
      )}
    </div>

    {!isEditing.email ? (
      <div className="text-center py-4">
        <TextField
          label="Current Email"
          variant="outlined"
          fullWidth
          value={formData.email}
          InputProps={{
            readOnly: true,
          }}
        />
      </div>
    ) : (
      <form onSubmit={handleEmailChangeSubmit} className="space-y-6">
        <TextField
          label="New Email"
          variant="outlined"
          name="newEmail"
          fullWidth
          type="email"
          value={emailChangeData.newEmail}
          onChange={(e) => {
            setEmailChangeData({ ...emailChangeData, newEmail: e.target.value });
          }}
          required
        />
        <TextField
          label="Confirm Password"
          variant="outlined"
          name="confirmPassword"
          fullWidth
          type="password"
          value={emailChangeData.confirmPassword}
          onChange={(e) => {
            setEmailChangeData({ ...emailChangeData, confirmPassword: e.target.value });
          }}
          required
        />
        <div className="flex justify-end gap-3">
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => {
              setEmailChangeData({ confirmPassword: "", newEmail: "" });
              setIsEditing(prev => ({ ...prev, email: false }));
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
          >
            Update Email
          </Button>
        </div>
      </form>
    )}
  </div>
</div>




      </div>
    </div>
  );
};

export default UserProfile;