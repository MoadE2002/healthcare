import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseJSON, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Save, Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../hooks/useAuthContext";
import axiosInstance from "../apicalls/axiosInstance";

interface TimeSlot {
  start_time: string;
  end_time: string;
  selected: boolean;
}

interface APITimeSlot {
  start_time: string;
  end_time: string;
  _id: string;
}

interface AvailabilitySlot {
  date: string;
  time_slots: APITimeSlot[];
  _id: string;
}

interface APIResponse {
  available_slots: AvailabilitySlot[];
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const nextHour = ((i + 1) % 24).toString().padStart(2, '0');
  return {
    start_time: `${hour}:00`,
    end_time: `${nextHour}:00`,
    selected: false
  };
});

export function QuickSchedule() {
  const { user } = useAuthContext();
  const [date, setDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<'calendar' | 'slots'>('calendar');

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user) return;
    
      setIsLoading(true);
      setError(null);
    
      try {
        const response = await axiosInstance.get(`/availability/${user.doctorId}`, {
          params: { date },
        });
        
        const data = response.data as APIResponse;
        
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        
        const dateSlot = data.available_slots.find((slot) => {
          const apiDate = new Date(slot.date);
          apiDate.setHours(0, 0, 0, 0);
          
          return apiDate.getTime() === selectedDate.getTime() ||
                 apiDate.getTime() === selectedDate.getTime() + 24 * 60 * 60 * 1000;
        });
    
        if (dateSlot) {
          const availableSlots = new Set(
            dateSlot.time_slots.map((slot) => slot.start_time)
          );
    
          const updatedTimeSlots = DEFAULT_TIME_SLOTS.map((defaultSlot) => ({
            ...defaultSlot,
            selected: availableSlots.has(defaultSlot.start_time),
          }));
    
          setTimeSlots(updatedTimeSlots);
        } else {
          setTimeSlots(DEFAULT_TIME_SLOTS);
        }
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to fetch availability';
        setError(errorMsg);
        console.error('Error fetching availability:', err);
        toast.error('Error', { description: errorMsg });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [date, user]);

  const saveAvailability = async () => {
    if (!user) {
      toast.error("Error", { description: "Please log in to save availability" });
      return;
    }

    const selectedSlots = timeSlots
      .filter(slot => slot.selected)
      .map(({ start_time, end_time }) => ({ start_time, end_time }));

    if (!selectedSlots.length) {
      toast.warning("Warning", { description: "Please select at least one time slot" });
      return;
    }

    setIsSaving(true);
    try {
      await axiosInstance.post('/availability', {
        doctor_id: user.doctorId,
        date,
        time_slots: selectedSlots
      });

      toast.success("Success", {
        description: "Availability schedule saved successfully",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (err: any) {
      toast.error("Error", { 
        description: "Failed to save availability",
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, selected: !slot.selected } : slot
    ));
  };

  const clearAllSlots = () => {
    setTimeSlots(DEFAULT_TIME_SLOTS.map(slot => ({ ...slot, selected: false })));
    toast.info("Info", { description: "All time slots have been cleared" });
  };

  const nextMonth = () => setCurrentMonth(month => new Date(month.setMonth(month.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(month => new Date(month.setMonth(month.getMonth() - 1)));

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-200px)]">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">Quick Schedule</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllSlots}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Clear</span>
            </Button>
            <Button 
              size="sm" 
              onClick={saveAvailability}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">
                {isSaving ? 'Saving...' : 'Save'}
              </span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 h-[calc(100%-80px)] overflow-hidden">
        <div className="flex sm:hidden mb-4 border rounded-lg overflow-hidden">
          <Button
            variant={activeView === 'calendar' ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveView('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={activeView === 'slots' ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveView('slots')}
          >
            Time Slots
          </Button>
        </div>

        <div className="grid sm:grid-cols-12 gap-4 h-full">
          <div className={cn(
            "sm:col-span-7 flex flex-col",
            activeView !== 'calendar' && "hidden sm:flex"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDayOfMonth.getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const isSelected = isSameDay(date, day);
                return (
                  <Button
                    key={day.toString()}
                    variant={isSelected ? "default" : "ghost"}
                    className={cn(
                      "aspect-square rounded-lg hover:bg-accent",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
                      isToday(day) && "border border-primary",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => setDate(day)}
                  >
                    {format(day, 'd')}
                  </Button>
                );
              })}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className={cn(
            "sm:col-span-5 flex flex-col h-full",
            activeView !== 'slots' && "hidden sm:flex"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" />
              <h3 className="text-lg font-medium">
                {format(date, 'MMMM d, yyyy')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 flex-1">
              {timeSlots.map((slot, index) => (
                <Button
                  key={slot.start_time}
                  variant={slot.selected ? "default" : "outline"}
                  className={cn(
                    "w-full py-4 flex flex-col items-center justify-center gap-1",
                    slot.selected && "bg-black text-white hover:bg-black/90",
                    !slot.selected && "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => toggleTimeSlot(index)}
                  disabled={isSaving}
                >
                  <span className="text-sm font-medium">
                    {slot.start_time}
                  </span>
                  <span className="text-xs opacity-80">
                    to {slot.end_time}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}