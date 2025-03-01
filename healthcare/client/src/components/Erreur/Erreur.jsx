"use client";
import React, { useState, useEffect } from "react";

const Erreur = ({ type, message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    // Clear the timer if the component is unmounted before 5 seconds
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  // Define the background color based on the type
  const backgroundColor = {
    erreur: "bg-red-500",
    Success: "bg-green-500",
    Info: "bg-blue-500",
    Warning: "bg-yellow-500",
  }[type] || "bg-red-500";

  return (
    <div
      className={`fixed top-14 left-1/2 transform -translate-x-1/2 w-80 p-4 flex items-center rounded-lg shadow-md ${backgroundColor}`}
    >
      <div className="w-5 h-5 mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-white"
        >
          <path
            d="m13 13h-2v-6h2zm0 4h-2v-2h2zm-1-15c-1.3132 0-2.61358.25866-3.82683.7612-1.21326.50255-2.31565 1.23915-3.24424 2.16773-1.87536 1.87537-2.92893 4.41891-2.92893 7.07107 0 2.6522 1.05357 5.1957 2.92893 7.0711.92859.9286 2.03098 1.6651 3.24424 2.1677 1.21325.5025 2.51363.7612 3.82683.7612 2.6522 0 5.1957-1.0536 7.0711-2.9289 1.8753-1.8754 2.9289-4.4189 2.9289-7.0711 0-1.3132-.2587-2.61358-.7612-3.82683-.5026-1.21326-1.2391-2.31565-2.1677-3.24424-.9286-.92858-2.031-1.66518-3.2443-2.16773-1.2132-.50254-2.5136-.7612-3.8268-.7612z"
            className="fill-white"
          ></path>
        </svg>
      </div>
      <div className="text-white font-medium text-sm">{message}</div>
      <button
        className="ml-auto w-5 h-5 text-white hover:opacity-80 transition-opacity"
        onClick={handleClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
          className="w-full h-full"
        >
          <path
            d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z"
            className="fill-white"
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default Erreur;
