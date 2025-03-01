"use client";

import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, IconButton, Badge } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import MobileNav from './MobileNav';
import Notification from '../../components/Notfication';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuthContext } from "../../hooks/useAuthContext";
import { Avatar } from "@mui/material";
import { useLogout } from "../../hooks/useLogout";

const Navbar = () => {
  const { user } = useAuthContext(); // Access the user state
  const { logout } = useLogout(); // Logout function

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout(); // Call the logout function
    handleClose();
  };

  return (
    <div className='w-full px-5 pb-3 flex justify-between items-center pt-5 bg-transparent backdrop-blur-lg sticky top-0 z-50'>
      {/* Logo Section */}
      <div className='flex justify-start items-center gap-5 cursor-pointer'>
        <Link href="/home">
          <p className='text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700 hover:text-blue-50'>
            Healthcare
          </p>
        </Link>
      </div>

      {/* Mobile Navigation */}
      <div className='sm:hidden'>
        <MobileNav />
      </div>

      {/* Desktop Navigation */}
      <div className='hidden sm:w-72 sm:flex sm:justify-center sm:gap-5'>
        <ul className='flex justify-center gap-5'>
          <li className='cursor-pointer'>
            <Link href="/booking">
              <p className='relative text-nowrap text-lg font-extrabold text-gray-800 hover:text-blue-400 after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-white after:scale-x-0 after:transition-all hover:after:scale-x-100'>
                Book a Visit
              </p>
            </Link>
          </li>
          <li className='cursor-pointer'>
            <Link href="/contact">
              <p className='relative text-lg font-extrabold text-gray-800 hover:text-blue-400 after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-white after:scale-x-0 after:transition-all hover:after:scale-x-100'>
                Contact
              </p>
            </Link>
          </li>
          <li className='cursor-pointer'>
            <Link href="/report">
              <p className='relative text-lg font-extrabold text-gray-800 hover:text-blue-400 after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-white after:scale-x-0 after:transition-all hover:after:scale-x-100'>
                Report
              </p>
            </Link>
          </li>
        </ul>
      </div>

      {/* Profile and Notification Section */}
      <div className='hidden sm:flex items-center space-x-2'>
        {/* Replace the previous notification implementation with the new Notification component */}
        <Notification />

        <div 
          className='border-2 border-white rounded-full p-1 cursor-pointer hover:border-blue-600 transition-colors duration-300'
          onClick={handleClick} 
        >
          {user && user.photoDeProfile ? 
          <Avatar 
            src={user.photoDeProfile}
            alt="User Avatar"
            sx={{ 
              width: 35, 
              height: 35, 
              border: '2px solid #f0f0f0' 
            }}
          />  :
            <AccountCircleIcon style={{ fontSize: 35, color: '#000' }} />
          }
        </div>
        <p 
          className='cursor-pointer text-black font-medium hover:text-blue-600 text-lg font-semibold relative after:content-[""] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-blue-600 after:scale-x-0 after:transition-all hover:after:scale-x-100' 
          onClick={handleClick}
        >
          {user?.username || "Account"}
        </p>
      </div>

      {/* Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {user
          ? [
              <MenuItem key="profile" onClick={handleClose}>
                <Link href="/user/edit">
                  <p>Profile</p>
                </Link>
              </MenuItem>,
              <MenuItem key="scheduling" onClick={handleClose}>
                <Link href="/user/scheduling">
                  <p>My Scheduling</p>
                </Link>
              </MenuItem>,
              <MenuItem key="logout" onClick={handleLogout}>
                Logout
              </MenuItem>,
            ]
          : [
              <MenuItem key="login" onClick={handleClose}>
                <Link href="/user/login">
                  <p>Login</p>
                </Link>
              </MenuItem>,
            ]}
      </Menu>
    </div>
  );
};

export default Navbar;