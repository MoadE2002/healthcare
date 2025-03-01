"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useSignup } from "../../../../hooks/useSignup";
import { useLogin } from "../../../../hooks/useLogin";
import Erreur from "../../../../components/Erreur/Erreur";

const Page = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [openVerificationDialog, setOpenVerificationDialog] = useState(false);
  const [openUnverifiedDialog, setOpenUnverifiedDialog] = useState(false);
  const { login, error: loginError, isLoading: loginLoading, isVerified } = useLogin();
  const { signup, error: signupError, isLoading: signupLoading } = useSignup();

  const [errorState, setErrorState] = useState({
    show: false,
    message: "",
    type: "erreur",
  });

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    gender: "",
    age: "",
    phone: "",
    address: "",
    city: "",
    password: "",
    role: "PATIENT",
    doctorDetails: {
      AppointementPrice: "",
      dureofApp: "",
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("doctorDetails.")) {
      const detailKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        doctorDetails: {
          ...prev.doctorDetails,
          [detailKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errorState.show) {
      setErrorState({ show: false, message: "", type: "erreur" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorState({ show: false, message: "", type: "erreur" });

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);

        if (!result) {
          setErrorState({ show: true, message: loginError || "Login failed", type: "erreur" });
        } else if (!isVerified) {
          setOpenUnverifiedDialog(true);
        } 
      } else {
        const signupData = { ...formData };

        if (signupData.role === "PATIENT") {
          delete signupData.doctorDetails;
        }

        const result = await signup(signupData);

        if (!result) {
          setErrorState({ 
            show: true, 
            message: signupError || 'Signup failed', 
            type: "erreur" 
          });
        } else {
          setOpenVerificationDialog(true);
        }
      }
    } catch (err) {
      if (err.message === 'Account not verified. A new verification email has been sent.') {
        // Show verification needed dialog
        setOpenUnverifiedDialog(true);
      } else {
      setErrorState({ 
        show: true, 
        message: "An unexpected error occurred", 
        type: "erreur" 
      });
    }
  }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrorState({ show: false, message: "", type: "erreur" });
    setFormData({
      username: "",
      email: "",
      gender: "",
      age: "",
      phone: "",
      address: "",
      city: "",
      password: "",
      role: "PATIENT",
      doctorDetails: {
        AppointementPrice: "",
        dureofApp: "",
      },
    });
  };

  const handleCloseVerificationDialog = () => {
    setOpenVerificationDialog(false);
    toggleForm();
  };

  const handleCloseUnverifiedDialog = () => {
    setOpenUnverifiedDialog(false);
  };

  return (
    <>
      {errorState.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Erreur type={errorState.type} message={errorState.message} />
        </div>
      )}

      {/* Verification Dialog for New Signup */}
      <Dialog open={openVerificationDialog} onClose={handleCloseVerificationDialog}>
        <DialogTitle>Account Created Successfully</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your account has been created. Please check your email to verify your account. Look for a verification link in your inbox (and spam folder).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerificationDialog} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unverified Account Dialog */}
      <Dialog open={openUnverifiedDialog} onClose={handleCloseUnverifiedDialog}>
        <DialogTitle>Account Not Verified</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your account is not verified. Please check your email and verify your account before logging in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnverifiedDialog} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rest of the component remains the same as in the original code */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left section with image */}
        <div className="relative bg-gray-100 w-full flex justify-center items-center p-10">
          <div className="absolute w-full inset-0 bg-gradient-to-r from-blue-800 to-teal-500 opacity-60"></div>
          <Image
            className="w-full h-auto md:mx-20 lg:mx-20"
            src="/assets/nobgdoctor.png"
            layout="fill"
            objectFit="contain"
            alt="doctors"
          />
          <div className="relative w-full z-10 flex flex-col items-start text-white">
            <h1 className="text-4xl font-bold mb-5">Healthi</h1>
            <div className="text-lg mb-4">
              <p>Well qualified doctors</p>
              <p>Treat with utmost care</p>
            </div>
            <div className="bg-black bg-opacity-40 p-4 flex gap-5 items-center rounded-lg shadow-lg">
              <CalendarMonthIcon className='w-10 h-10' />
              <div>
                <p className="font-bold mb-2">Book an appointment</p>
                <p>Call/text/video/in-person</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right section for login/signup form */}
        <div className="flex items-center justify-center p-10 bg-white">
          <div className="max-w-md w-full space-y-8">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-center text-sm text-gray-600">
              {isLogin ? 'New to Healthi?' : 'Already have an account?'}{' '}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={toggleForm}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm">
                <TextField
                  label="Email"
                  variant="outlined"
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  label="Password"
                  variant="outlined"
                  name="password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {!isLogin && (
                  <div className="flex flex-col">
                    <div className="flex space-x-2">
                      <TextField
                        label="Username"
                        variant="outlined"
                        name="username"
                        fullWidth
                        margin="normal"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                      <TextField
                        select
                        label="Role"
                        variant="outlined"
                        name="role"
                        fullWidth
                        margin="normal"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <MenuItem value="PATIENT">Patient</MenuItem>
                        <MenuItem value="DOCTOR">Doctor</MenuItem>
                      </TextField>
                    </div>
                    
                    <div className="flex space-x-2">
                      <TextField
                        select
                        label="Gender"
                        variant="outlined"
                        name="gender"
                        fullWidth
                        margin="normal"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                      </TextField>
                      <TextField
                        label="Age"
                        variant="outlined"
                        name="age"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <TextField
                        label="Phone Number"
                        variant="outlined"
                        name="phone"
                        type="tel"
                        fullWidth
                        margin="normal"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                      <TextField
                        label="City"
                        variant="outlined"
                        name="city"
                        fullWidth
                        margin="normal"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <TextField
                      label="Address"
                      variant="outlined"
                      name="address"
                      fullWidth
                      margin="normal"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />

                    {/* Doctor-specific fields */}
                    {formData.role === 'DOCTOR' && (
                      <div className="flex space-x-2 mt-2">
                        <TextField
                          label="Appointment Price"
                          variant="outlined"
                          name="doctorDetails.AppointementPrice"
                          type="number"
                          fullWidth
                          margin="normal"
                          value={formData.doctorDetails.AppointementPrice}
                          onChange={handleInputChange}
                          required
                        />
                        <TextField
                          label="Duration of Appointment"
                          variant="outlined"
                          name="doctorDetails.dureofApp"
                          fullWidth
                          margin="normal"
                          value={formData.doctorDetails.dureofApp}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginLoading || signupLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLogin 
                    ? (loginLoading ? 'Logging in...' : 'Log in') 
                    : (signupLoading ? 'Signing up...' : 'Sign up')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;