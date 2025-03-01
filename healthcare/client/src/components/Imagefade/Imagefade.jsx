"use client";
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import image1 from '../../../public/assets/doctors5.jpg'; 
import image2 from '../../../public/assets/branding/chatbot.png';
import image3 from '../../../public/assets/branding/request-appointment.png';
import image4 from '../../../public/assets/doctors3.jpg';
import image5 from '../../../public/assets/doctors/nobg/doctors.png';

const images = [image1, image2, image3, image4, image5];

const Imagefade = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); 

    return () => clearInterval(interval); 
  }, []);

  return (
    <div className='relative w-full  h-[30vh] overflow-hidden'>
      <div className='absolute inset-0 transition-opacity duration-1000 ease-in-out'>
        <Image
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          layout="fill"
          objectFit="cover"
          className={`transition-opacity duration-1000 ease-in-out`}
        />
      </div>
      <div className='flex flex-col items-center justify-center h-full gap-8  text-white'>
        <p className='text-sm'>Search Booking</p>
        <h2 className='text-lg font-bold'>Take care of yourself with us</h2>
      </div>
    </div>
  );
};

export default Imagefade;
