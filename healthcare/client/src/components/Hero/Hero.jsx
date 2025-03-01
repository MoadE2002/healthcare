import React from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Image from "next/image";

const BannerSection = () => {
  return (
    <main className="overflow-hidden">
      <section className="">
        <div className="max-w-6xl mx-auto px-5">
          <div className="relative grid items-center gap-12 md:grid-cols-2 lg:grid-cols-[1fr_max-content] lg:gap-16 lg:mt-0 lg:mb-28">
            {/* Image */}
            <div className="relative  mt-8 justify-self-center md:order-1 lg:mr-20">
              <Image
                className="relative  z-10 block max-w-[18rem] h-auto md:max-w-[20rem] lg:max-w-[25rem]"
                src="/assets/doctors/nobg/3.png"
                alt="Doctors Image"
                width={400}
                height={300}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] rounded-full bg-gradient-to-br from-blue-100 via-white to-blue-200 shadow-lg lg:w-[25rem] lg:h-[25rem]"></div>
            </div>



            {/* Content */}
            <div className="flex flex-col items-start gap-7">
              <h1 className="font-bold text-[clamp(2.648rem,6vw,4.241rem)] leading-tight tracking-tight text-gray-800">
                Book Appointments with Top Doctors
              </h1>
              <p className="text-[clamp(1rem,2vw,1.125rem)] text-gray-600 balance">
                Simplify your healthcare experience. Book consultations with certified
                doctors, manage your appointments seamlessly, and get instant assistance
                from our interactive chatbot.
              </p>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-3 font-medium text-white bg-blue-600 rounded shadow-md hover:bg-blue-500 transition-colors">
                Book Appointment
                <ArrowForwardIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Social Links */}
            <div className="absolute top-1/4 right-0 grid justify-items-center gap-2">
              <div className="relative py-12">
                <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
                <div className="flex flex-col gap-4 py-4">
                  <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                    <FacebookIcon className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                    <InstagramIcon className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                    <TwitterIcon className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                    <YouTubeIcon className="w-6 h-6" />
                  </a>
                </div>
                <div className="absolute bottom-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BannerSection;
