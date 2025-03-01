"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import { Calendar, Clock, FileText, History, Home, MessageSquare, Settings, Users, Video } from "lucide-react";

const routes = [
  {
    label: "Overview",
    icon: Home,
    href: "/",
  },
  {
    label: "Schedule",
    icon: Calendar,
    href: "/schedule",
  },
  {
    label: "Appointments",
    icon: Clock,
    href: "/appointments",
  },
  {
    label: "Video Calls",
    icon: Video,
    href: "/video-calls",
  },
  {
    label: "Prescriptions",
    icon: FileText,
    href: "/prescriptions",
  },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center mr-8">
          <h1 className="text-2xl font-bold text-blue-600">MedConnect</h1>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center space-x-2",
                pathname === route.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  );
}