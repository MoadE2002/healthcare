'use client';

import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import Sidebar from '../components/Sidebar/Sidebar';
import Chatbot from '../components/Chatbot';
import { AuthContextProvider } from '../context/AuthContext';
import { ErreurProvider } from '../context/ErreurContext';
import { SocketProvider } from '../context/SocketProvider';
import CallCard from '../components/CallCard';
import { useAuthContext } from '../hooks/useAuthContext';


import './globals.css';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthContextProvider>
          <ErreurProvider>
            <SocketProvider>
              <LayoutContent>{children}</LayoutContent>
            </SocketProvider>
          </ErreurProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
};

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();

  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-grow pb-[250px]">{children}</main>
      </div>
      <Chatbot />
      <Footer />
      <CallCard />
    </>
  );
};

export default RootLayout;
