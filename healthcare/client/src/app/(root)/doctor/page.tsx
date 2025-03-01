"use client";

import  StatsCards  from "../../../components/stats-cards";
import  {QuickSchedule}  from "../../../components/quick-schedule";
import UpcomingAppointments from "../../../components/UpcomingAppointments";
import PerformanceCharts from "../../../components/performance-charts";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useEffect } from "react";



// Define the Page component as a React Functional Component
const Page: React.FC = () => {
  const isAdmin: boolean = false;
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    // Redirect to login page if user is not logged in
    if (!user) {
      router.push("/user/login");
      return;
    }

    if (!user.doctorId && user.role !== "DOCTOR" && user.role !== "ADMIN") {
      router.push("/home"); 
      return;
    }
 }, [user, router]);

 if (!user) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="w-full flex-row">
        <p className="text-xl text-gray-400">this is your space</p>
        <StatsCards isAdmin={isAdmin} />
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2/3 w-full p-4">
          <QuickSchedule isAdmin={isAdmin} />
        </div>
        <div className="lg:w-1/3 w-full p-4 sticky top-10">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <UpcomingAppointments />
          </div>
        </div>
      </div>
      <PerformanceCharts isAdmin={isAdmin} />
    </div>
  );
};

export default Page;
