"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../apicalls/axiosInstance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

const VerifyEmail = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const searchParams = useSearchParams(); // Get query parameters
  const [status, setStatus] = useState("loading");
  const [resendStatus, setResendStatus] = useState(null);

  // Extract token and email from the query params
  const token = pathname.split("/").pop();
  const email = searchParams.get("email");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) return;

      try {
        console.log("Token being sent: ", token);
        const response = await axiosInstance.get(`/auth/verify/${token}`);
        if (response.status === 200) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, email]);

  const handleResend = async () => {
    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email,
      });
      if (response.status === 200) {
        setResendStatus("success");
      } else {
        setResendStatus("error");
      }
    } catch (error) {
      setResendStatus("error");
    }
  };

  const handleRedirect = () => {
    router.push("/user/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      {status === "loading" ? (
        <div className="flex flex-col items-center">
          <CircularProgress />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      ) : status === "success" ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <CheckCircleIcon style={{ color: "green", fontSize: 50 }} />
          <h1 className="text-2xl font-semibold text-green-600 mt-4">
            Email Verified!
          </h1>
          <p className="mt-2 text-gray-600">
            Your email has been successfully verified. You can now log in.
          </p>
          <Button
            variant="contained"
            color="primary"
            className="mt-4"
            onClick={handleRedirect}
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <ErrorOutlineIcon style={{ color: "red", fontSize: 50 }} />
          <h1 className="text-2xl font-semibold text-red-600 mt-4">
            Verification Failed
          </h1>
          <p className="mt-2 text-gray-600">
            We couldn't verify your email. Please try again.
          </p>
          {resendStatus === "success" && (
            <p className="text-green-600 mt-2">Verification email resent successfully!</p>
          )}
          {resendStatus === "error" && (
            <p className="text-red-600 mt-2">Failed to resend verification email. Try again later.</p>
          )}
          <Button
            variant="contained"
            color="primary"
            className="mt-4"
            onClick={handleResend}
            disabled={!email} // Disable button if email is not available
          >
            Resend Verification
          </Button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
