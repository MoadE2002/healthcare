"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import axiosInstance from "../apicalls/axiosInstance";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface AppointmentData {
  name: string;
  appointments: number;
}

interface RevenueData {
  name: string;
  revenue: number;
}

const PerformanceCharts: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const { user } = useAuthContext();
  const [appointmentData, setAppointmentData] = useState<AppointmentData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        const endpoint = isAdmin
          ? "/admin-space/appointments/doctors/stats"
          : `/doctor/appointments/data/${user.doctorId}`;
        const response = await axiosInstance.get(endpoint);
        setAppointmentData(response.data);
      } catch (error) {
        console.error("Error fetching appointment data:", error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        const endpoint = isAdmin
          ? "/admin-space/revenue/doctors"
          : `/doctor/revenue/data/${user.doctorId}`;
        const response = await axiosInstance.get(endpoint);
        setRevenueData(response.data);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    fetchAppointmentData();
    fetchRevenueData();
  }, [isAdmin, user?.doctorId]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Appointments</CardTitle>
          <CardDescription>
            Number of appointments per day this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Monthly revenue from consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceCharts;
