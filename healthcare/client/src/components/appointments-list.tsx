"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";

const appointments = [
  {
    id: 1,
    patient: {
      name: "John Smith",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=987&auto=format&fit=crop",
      email: "john.smith@example.com",
    },
    status: "ready",
    time: "10:30 AM",
    type: "Follow-up",
  },
  {
    id: 2,
    patient: {
      name: "Emma Johnson",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=961&auto=format&fit=crop",
      email: "emma.j@example.com",
    },
    status: "pending",
    time: "11:45 AM",
    type: "Consultation",
  },
  {
    id: 3,
    patient: {
      name: "Michael Brown",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=987&auto=format&fit=crop",
      email: "m.brown@example.com",
    },
    status: "completed",
    time: "09:15 AM",
    type: "Check-up",
  },
];

export function AppointmentsList({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={appointment.patient.image} />
                <AvatarFallback>{appointment.patient.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{appointment.patient.name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.patient.email}
                </p>
              </div>
            </TableCell>
            <TableCell>{appointment.type}</TableCell>
            <TableCell>{appointment.time}</TableCell>
            <TableCell>
              <Badge
                variant={
                  appointment.status === "ready"
                    ? "default"
                    : appointment.status === "pending"
                    ? "secondary"
                    : "outline"
                }
              >
                {appointment.status}
              </Badge>
            </TableCell>
            
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}