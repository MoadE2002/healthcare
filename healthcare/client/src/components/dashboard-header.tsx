import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";

export function DashboardHeader() {
  return (
    <div className="flex h-16 items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline">View Schedule</Button>
        <Button>New Appointment</Button>
        <ModeToggle />
        <UserNav />
      </div>
    </div>
  );
}