"use client";
import React from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, CalendarToday, Dashboard, ExitToApp, Assignment, Person, Report } from '@mui/icons-material';  // Import relevant Material UI icons
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { route: "/appointment", label: "Book Appointment", icon: <Assignment /> },
  { route: "/settings", label: "Settings", icon: <Settings /> },
  { route: "/myappointments", label: "My Appointments", icon: <Person /> },
  { route: "/calendar", label: "Calendar", icon: <CalendarToday /> },
  { route: "/dashboard", label: "Dashboard", icon: <Dashboard /> },
  { route: "/report", label: "Report", icon: <Report /> },
  { route: "/logout", label: "Logout", icon: <ExitToApp /> },
];

const MobileNav = () => {
  const pathname = usePathname();
  return (
    <section className='w-full max-w-[264px]'>
      <Sheet>
        <SheetTrigger asChild>
          <div className='cursor-pointer sm:hidden'>
            <Image
              src="/assets/person.png"  // Profile image path
              width={36}
              height={36}
              alt='profile'
              className='rounded-full'
            />
          </div>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className='border-none bg-blue-500 text-white' 
          aria-labelledby="mobile-nav-title" 
          aria-describedby="mobile-nav-description"
        >
          <Link 
            href="/" 
            className='flex items-center gap-1 p-4'
          >
            <p id="mobile-nav-title" className='text-[26px] font-extrabold'>
              Health Care
            </p>
          </Link>
          <div className='flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto'>
            <SheetClose asChild>
              <section id="mobile-nav-description" className='flex h-full flex-col gap-6 pt-16'>
                {links.map((link) => {
                  const isActive = pathname === link.route;
                  return (
                    <SheetClose asChild key={link.route}>
                      <Link
                        href={link.route}
                        className={cn('flex gap-4 items-center p-4 rounded-lg w-full max-w-60', {
                          'bg-blue-700 text-white': isActive,
                          'hover:bg-blue-400 text-white': !isActive,
                        })}
                        aria-label={`Navigate to ${link.label}`}
                      >
                        {link.icon} {/* Display the Material UI icon */}
                        <p className='font-semibold'>{link.label}</p>
                      </Link>
                    </SheetClose>
                  );
                })}
              </section>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
