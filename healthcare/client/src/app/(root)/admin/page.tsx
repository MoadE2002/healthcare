"use client";

import { Card } from "@/components/ui/card";
import StatsCards from "../../../components/stats-cards";
import PerformanceCharts from "../../../components/performance-charts";
import { AppointmentsList } from "../../../components/appointments-list";
import DoctorsList from "../../../components/DoctorsList";
import FeedbackManagement from "../../../components/FeedbackManagement";
import Link from "next/link";
import { IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useAuthContext } from "../../../hooks/useAuthContext"; // Import your auth context
import { useRouter } from "next/navigation"; // For redirection if the role doesn't match
import { useEffect } from "react";

export default function DashboardPage(): JSX.Element {
  const { user } = useAuthContext(); // Retrieve user data from context
  const router = useRouter();

  useEffect(() => {
    // Redirect if the user's role is not ADMIN
    if (!user) {
      router.push("/user/login"); // Redirect to login if not an admin
    }else if(user.role !== "ADMIN"){
      router.push("/home");
    }
  }, [user, router]);

  if (!user || user.role !== "ADMIN") {
    // Optional: Render a loading state or placeholder until redirection
    return <div>Redirecting...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <StatsCards isAdmin={true} />
      <PerformanceCharts isAdmin={true} />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="flex flex-col h-[450px] p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Upcoming Appointments</h2>
            <AppointmentsList isAdmin={true} />
          </div>
        </Card>
        <Card className="col-span-3">
          <DoctorsList />
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-6">
          <FeedbackManagement />
        </Card>
        <div className="h-full">
          <Link href="/report/resolve">
            <Card className="col-span-1 h-1/2 flex items-center justify-center p-6 transition duration-300 ease-in-out transform hover:bg-gray-200 hover:scale-105">
              <div className="text-center">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Manage Report</h2>
                <IconButton aria-label="go to report">
                  <ArrowForwardIcon fontSize="large" />
                </IconButton>
              </div>
            </Card>
          </Link>
          <Link href="/verification/manage">
            <Card className="mt-2 h-1/2 col-span-1 flex items-center justify-center p-6 transition duration-300 ease-in-out transform hover:bg-gray-200 hover:scale-105">
              <div className="text-center">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Manage Verification</h2>
                <IconButton aria-label="go to verification">
                  <ArrowForwardIcon fontSize="large" />
                </IconButton>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
