import React from 'react';
import Link from 'next/link';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Box, 
  Divider, 
  IconButton 
} from '@mui/material';
import { 
  VideoCall as VideoCallIcon, 
  Description as PrescriptionIcon, 
  Help as SupportIcon,
  LiveHelp as LiveHelpIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';

export default function HelpPage() {
  return (
    <Container maxWidth="xl" className="py-12 bg-gray-50">
      <Typography 
        variant="h2" 
        align="center" 
        gutterBottom 
        className="text-blue-800 font-bold mb-10"
      >
        Your Comprehensive Health Consultation Guide
      </Typography>

      {/* Hero Section with Additional Information */}
      <Paper elevation={3} className="mb-12 p-8 bg-white">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" className="text-blue-700 mb-4">
              Seamless Healthcare at Your Fingertips
            </Typography>
            <Typography variant="body1" paragraph>
              Our telehealth platform revolutionizes how you access medical care. With advanced video consultation technology, 
              you can connect with top-tier healthcare professionals from the comfort of your home, ensuring convenient 
              and high-quality medical support whenever you need it.
            </Typography>
            <Box display="flex" gap={2} mt={3}>
              <Link href="/book-consultation" passHref>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<VideoCallIcon />}
                  size="large"
                >
                  Schedule Consultation
                </Button>
              </Link>
              <Link href="/faq" passHref>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<LiveHelpIcon />}
                  size="large"
                >
                  Frequently Asked Questions
                </Button>
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              component="img" 
              src="/assets/doctors/nobg/3.png" 
              alt="Telehealth Consultation" 
              className="w-full rounded-lg"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Service Cards */}
      <Grid container spacing={4}>
        {/* Video Consultation Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            elevation={4} 
            className="h-full p-6 hover:shadow-2xl transition-shadow duration-300 bg-white"
          >
            <Box display="flex" alignItems="center" mb={2}>
              <VideoCallIcon className="text-blue-600 mr-3" fontSize="large" />
              <Typography variant="h5" className="text-blue-800">
                Video Consultation
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Experience professional medical consultations through our secure, 
              high-definition video platform. Our doctors are available 7 days a week, 
              offering personalized care for various medical concerns.
            </Typography>
            <Link href="/booking" passHref>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                className="mt-4"
              >
                Book Now
              </Button>
            </Link>
          </Paper>
        </Grid>

        {/* Prescription Management Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            elevation={4} 
            className="h-full p-6 hover:shadow-2xl transition-shadow duration-300 bg-white"
          >
            <Box display="flex" alignItems="center" mb={2}>
              <PrescriptionIcon className="text-green-600 mr-3" fontSize="large" />
              <Typography variant="h5" className="text-green-800">
                Digital Prescriptions
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Effortlessly manage your prescriptions online. After consultation, 
              receive digital prescriptions instantly, with direct integration to 
              local pharmacies for quick and convenient medication fulfillment.
            </Typography>
            <Link href="/user/myprescriptions" passHref>
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                className="mt-4"
              >
                Manage Prescriptions
              </Button>
            </Link>
          </Paper>
        </Grid>

        {/* Support & Help Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            elevation={4} 
            className="h-full p-6 hover:shadow-2xl transition-shadow duration-300 bg-white"
          >
            <Box display="flex" alignItems="center" mb={2}>
              <SupportIcon className="text-red-600 mr-3" fontSize="large" />
              <Typography variant="h5" className="text-red-800">
                24/7 Support
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Our dedicated support team is available around the clock to assist 
              you with any questions or concerns. Multiple communication channels 
              ensure you always receive prompt and helpful support.
            </Typography>
            <Link href="/contact" passHref>
              <Button 
                variant="contained" 
                color="error" 
                fullWidth 
                className="mt-4"
              >
                Contact Support
              </Button>
            </Link>
          </Paper>
        </Grid>
      </Grid>

            {/* Additional Services Section */}
            <Box mt={8} textAlign="center">
        <Typography variant="h4" className="text-blue-800 mb-6">
          Additional Healthcare Services
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {[
            { icon: <MedicalServicesIcon />, title: "Medical Records" },
            { icon: <LiveHelpIcon />, title: "Health Resources"},
            { icon: <ChatIcon />, title: "Chat Bot Assistant" }
          ].map((service, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                elevation={2} 
                className="p-4 text-center hover:bg-blue-50 transition-colors"
              >
                <IconButton color="primary" size="large" className="mb-2">
                  {service.icon}
                </IconButton>
                <Typography variant="h6">
                  {service.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>


    </Container>
  );
}