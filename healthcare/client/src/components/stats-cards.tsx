"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { useAuthContext } from "../hooks/useAuthContext";
import axiosInstance from "../apicalls/axiosInstance";

const StatsCards = ({ isAdmin }: { isAdmin: boolean }) => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointmentsToday: 0,
    totalPatients: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoint = isAdmin
          ? `/admin-space/stats/doctors`
          : `/doctor/stats/${user.doctorId}`;
        const response = await axiosInstance.get(endpoint);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats data:", error);
      }
    };

    fetchStats();
  }, [isAdmin, user?.doctorId]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Not completed Appointments
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          <p className="text-xs text-muted-foreground">+2 from yesterday</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Today</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingAppointmentsToday}</div>
          <p className="text-xs text-muted-foreground">Next at 10:30 AM</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Appointment</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPatients}</div>
          <p className="text-xs text-muted-foreground">+8 this month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Earnings from completed appointments
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
