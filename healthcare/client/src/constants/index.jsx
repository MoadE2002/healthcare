import { BotMessageSquare } from "lucide-react";
import { BatteryCharging } from "lucide-react";
import { Fingerprint } from "lucide-react";
import { ShieldHalf } from "lucide-react";
import { PlugZap } from "lucide-react";
import { GlobeLock } from "lucide-react";

import user1 from "../../public/assets/pfd/pfd1.webp";
import user2 from "../../public/assets/pfd/pfd2.webp";
import user3 from "../../public/assets/pfd/pfd3.webp";
import user4 from "../../public/assets/pfd/pfd4.webp";
import user5 from "../../public/assets/pfd/pfd5.webp";
import user6 from "../../public/assets/pfd/pfd6.webp";

export const navItems = [
  { label: "Features", href: "#" },
  { label: "Workflow", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Testimonials", href: "#" },
];

export const testimonials = [
  {
    user: "Sarah Johnson",
    company: "Patient",
    image: user1,
    text: "The video consultations were seamless, and I felt comfortable and well-informed throughout the entire process. The chatbot helped me easily schedule my appointment, and I got instant answers to my health-related questions.",
  },
  {
    user: "Dr. Michael Clark",
    company: "Family Practice",
    image: user2,
    text: "This platform has made remote consultations so much easier. I can communicate effectively with my patients via video calls, and the integration with the scheduling system has streamlined my workflow. Highly recommended for any healthcare professional!",
  },
  {
    user: "Emily Turner",
    company: "Patient",
    image: user3,
    text: "I appreciate the ease of booking appointments with just a few clicks. The language translation feature was a lifesaver during my consultation, and I felt confident in the advice provided by my doctor.",
  },
  {
    user: "Dr. Samantha Reed",
    company: "Pediatrics Care",
    image: user4,
    text: "As a pediatrician, being able to offer consultations remotely has been invaluable. The platform is user-friendly, and the instant notifications help me stay on top of patient appointments without missing a beat.",
  },
  {
    user: "James Peterson",
    company: "Patient",
    image: user5,
    text: "The service was excellent! I received my prescription instantly, along with a QR code for verification at the pharmacy. The whole experience was quick, professional, and hassle-free. I highly recommend it to anyone needing medical assistance remotely.",
  },
  {
    user: "Dr. Linda Green",
    company: "General Practice",
    image: user6,
    text: "The ability to consult with patients remotely while still offering a high level of care is fantastic. The real-time chat and video consultation features work perfectly, and the overall user experience is incredibly smooth.",
  },
];



export const features = [
  {
    icon: <BotMessageSquare />,
    text: "AI-Powered Medical Chatbot",
    description:
      "Get personalized medical advice and easily book appointments. The AI chatbot helps you find the right specialist and provides answers to your health-related questions, all in real-time.",
  },
  {
    icon: <Fingerprint />,
    text: "Secure Authentication",
    description:
      "Your privacy is our priority. With top-notch security protocols, our system ensures safe authentication, keeping your medical data protected.",
  },
  {
    icon: <ShieldHalf />,
    text: "Privacy Protection",
    description:
      "We adhere to strict privacy standards to protect your personal and medical information with industry-leading encryption and secure data storage.",
  },
  {
    icon: <BatteryCharging />,
    text: "Instant Appointment Reminders",
    description:
      "Receive real-time reminders and notifications about your upcoming video consultations, ensuring you never miss an important appointment.",
  },
  {
    icon: <PlugZap />,
    text: "Seamless Video Consultation",
    description:
      "Experience hassle-free remote appointments with high-quality video calls. Book a consultation with your chosen specialist and attend from the comfort of your home.",
  },
  {
    icon: <GlobeLock />,
    text: "Comprehensive Health Analytics",
    description:
      "Track your health journey with integrated analytics that provide valuable insights into your medical history, appointment trends, and doctor-patient interactions.",
  },
];



export const checklistItems = [
  {
    title: "Prescription with QR Code",
    description:
      "Receive your prescriptions electronically, complete with a secure QR code that links to your online prescription for easy verification at the pharmacy.",
  },
  {
    title: "Real-Time Chat and Video Consultation",
    description:
      "Communicate directly with your doctor through secure real-time chat, or schedule a video call for a more personal consultation from the comfort of your home.",
  },
  {
    title: "Language Translation Assistance",
    description:
      "Break the language barrier with our built-in language translator, ensuring clear communication between patients and doctors in real time.",
  },
  {
    title: "Instant Appointment Notifications",
    description:
      "Get immediate alerts for appointment confirmations, reschedules, and reminders, ensuring you never miss an important consultation.",
  },
];


export const pricingOptions = [
  {
    title: "Free",
    price: "$0",
    features: [
      "Private board sharing",
      "5 Gb Storage",
      "Web Analytics",
      "Private Mode",
    ],
  },
  {
    title: "Pro",
    price: "$10",
    features: [
      "Private board sharing",
      "10 Gb Storage",
      "Web Analytics (Advance)",
      "Private Mode",
    ],
  },
  {
    title: "Enterprise",
    price: "$200",
    features: [
      "Private board sharing",
      "Unlimited Storage",
      "High Performance Network",
      "Private Mode",
    ],
  },
];

export const resourcesLinks = [
  { href: "#", text: "Getting Started" },
  { href: "#", text: "Documentation" },
  { href: "#", text: "Tutorials" },
  { href: "#", text: "API Reference" },
  { href: "#", text: "Community Forums" },
];

export const platformLinks = [
  { href: "#", text: "Features" },
  { href: "#", text: "Supported Devices" },
  { href: "#", text: "System Requirements" },
  { href: "#", text: "Downloads" },
  { href: "#", text: "Release Notes" },
];

export const communityLinks = [
  { href: "#", text: "Events" },
  { href: "#", text: "Meetups" },
  { href: "#", text: "Conferences" },
  { href: "#", text: "Hackathons" },
  { href: "#", text: "Jobs" },
];
