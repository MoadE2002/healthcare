"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "../../../../../apicalls/axiosInstance";
import ProfileHeader from "../../../../../components/ProfileHeader";
import AboutSection from "../../../../../components/AboutSection";
import ExperienceSection from "../../../../../components/ExperienceSection";
import EducationSection from "../../../../../components/EducationSection";
import Testimonials from '../../../../../components/Testimonials';
import { StaticDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button } from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { useAuthContext } from "../../../../../hooks/useAuthContext";
import { useRouter } from "next/navigation";


interface Experience {
    _id: string;
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
    currentlyWorking?: boolean;
}

interface Education {
    _id: string;
    school: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
}

interface UserData {
    username: string;
    email: string;
    phone: string;
    profilePicture: string | null;
    address: string;
    about: string;
    experiences: Experience[];
    education: Education[];
}

interface Slot {
    date: string;
    available_time_slots: {
        start_time: string;
        end_time: string;
    }[];
}

const ProfilePage = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [doctorError, setDoctorError] = useState<string | null>(null);
    const [slotError, setSlotError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedTime, setSelectedTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const router = useRouter()
    const { user } = useAuthContext();
    const params = useParams();
    const doctorId = params?.id as string;

    useEffect(() => {
        const fetchData = async () => {
            if (!doctorId) {
                setDoctorError("No doctor ID provided");
                setLoading(false);
                return;
            }

            try {
                const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
                const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');

                let doctorResponse, slotResponse;

                // Fetch doctor data
                try {
                    doctorResponse = await axiosInstance.get(`/doctor/doc/${doctorId}`);
                } catch (err) {
                    console.error("Error fetching doctor data:", err);
                    setDoctorError("Failed to fetch doctor data");
                    setLoading(false);
                    return;
                }

                // Fetch available slots
                try {
                    slotResponse = await axiosInstance.post('/appointment/available-slots', {
                        doctor_id: doctorId,
                        startDate: startDate,
                        endDate: endDate
                    });
                } catch (err) {
                    console.error("Error fetching available slots:", err);
                    setSlotError("No time slots available");
                }

                // Process doctor data
                const uniqueExperiences = doctorResponse.data.experiences.filter(
                    (exp: Experience, index: number, self: Experience[]) => 
                        index === self.findIndex((t) => (
                            t.title === exp.title && 
                            t.company === exp.company && 
                            t.startDate === exp.startDate
                        ))
                );

                const uniqueEducation = doctorResponse.data.education.filter(
                    (edu: Education, index: number, self: Education[]) => 
                        index === self.findIndex((t) => (
                            t.school === edu.school && 
                            t.fieldOfStudy === edu.fieldOfStudy && 
                            t.startYear === edu.startYear
                        ))
                );

                // Process slots if available
                if (slotResponse) {
                    const processedSlots = slotResponse.data.available_slots.map((slot: any) => ({
                        date: dayjs(slot.date).format('YYYY-MM-DD'),
                        available_time_slots: slot.time_slots.map((timeSlot: any) => ({
                            start_time: timeSlot.start_time,
                            end_time: timeSlot.end_time
                        }))
                    }));
                    setAvailableSlots(processedSlots);
                }

                setUserData({
                    ...doctorResponse.data,
                    experiences: uniqueExperiences,
                    education: uniqueEducation
                });
                setLoading(false);
            } catch (err) {
                console.error("Unexpected error:", err);
                setDoctorError("Failed to fetch data");
                setLoading(false);
            }
        };

        fetchData();
    }, [doctorId, selectedDate]);

    const handleBooking = async () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select a date and time.");
            return;
        }

        const userId = user?._id || localStorage.getItem("userId");
        if (!userId) {
            alert("User not logged in.");
            router.push('/user/login')
            return;
        }

        try {
            const [start_time, end_time] = selectedTime.split(" - ");
            await axiosInstance.post("/appointment/book-appointment", {
                doctor_id: doctorId,
                patient_id: userId,
                date: selectedDate.format("YYYY-MM-DD"),
                start_time: start_time.trim(),
                end_time: end_time.trim(),
                purpose: "Routine Checkup"
            });
            alert("Appointment booked successfully!");
        } catch (err) {
            console.error("Error booking appointment:", err);
            alert("Failed to book appointment. Please try again.");
        }
    };

    const isDateAvailable = (date: any) => {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const availableDates = availableSlots.map(slot => 
            dayjs(slot.date).subtract(1, 'day').format('YYYY-MM-DD')
        );
        return availableDates.includes(formattedDate);
    };

    const getAvailableTimeSlots = () => {
        const slot = availableSlots.find(slot => 
            dayjs(slot.date).subtract(1, 'day').isSame(selectedDate, 'day')
        );
        return slot ? slot.available_time_slots.map(ts => `${ts.start_time} - ${ts.end_time}`) : [];
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (doctorError) return <div className="text-center mt-10 text-red-500">Error: {doctorError}</div>;
    if (!userData) return <div className="text-center mt-10">No doctor data found</div>;

    return (
        <div className='container mx-auto p-4'>
        <div className='flex flex-col lg:flex-row'>
                <div className='lg:w-2/3 w-full p-4'>
                    <ProfileHeader 
                        userData={userData} 
                        isOwnProfile={false} 
                    />
                    <AboutSection 
                        userData={userData} 
                        isOwnProfile={false} 
                    />
                    <ExperienceSection 
                        userData={userData} 
                        isOwnProfile={false} 
                    />
                    <EducationSection 
                        userData={userData} 
                        isOwnProfile={false} 
                    />
                    <Testimonials width={2} bg={true} />
                </div>

                <div className='lg:w-1/3 w-full p-4 sticky top-0 h-full'>
                    <div className='bg-white shadow rounded-lg p-4'>
                        <h2 className='text-xl font-bold text-center'>Book a Consultation</h2>
                        {slotError ? (
                            <div className="text-center text-red-500 mt-4">
                                No time slots available
                            </div>
                        ) : (
                            <>
                                <div className='mt-4'>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <StaticDatePicker
                                            displayStaticWrapperAs="desktop"
                                            openTo="day"
                                            value={selectedDate}
                                            onChange={(newValue) => setSelectedDate(newValue)}
                                            renderInput={(params) => <input {...params} />}
                                            shouldDisableDate={(date) => !isDateAvailable(date)}
                                        />
                                    </LocalizationProvider>
                                </div>
                                <div className='mt-4'>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className='border rounded p-2 w-full'
                                    >
                                        <option value='' disabled>Select Time Slot</option>
                                        {getAvailableTimeSlots().map((slot, index) => (
                                            <option key={index} value={slot}>
                                                {slot}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='mt-4'>
                                    <Button
                                        onClick={handleBooking}
                                        variant="contained"
                                        color="dark"
                                        className='w-full'
                                        disabled={!selectedTime}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;