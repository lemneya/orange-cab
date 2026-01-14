import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarDays, 
  Clock, 
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  FileCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Scheduling() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewType, setViewType] = useState<string>("day");

  // Mock data - would come from API
  const todaySchedule = {
    date: "2026-01-13",
    shift: "4:00 AM - 4:00 PM",
    totalDrivers: 40,
    scheduled: 38,
    dayOff: 2,
    onLeave: 0
  };

  const scheduledDrivers = [
    { id: 1, name: "John Smith", vehicle: "1001", city: "VB", status: "on_duty" },
    { id: 2, name: "Mike Johnson", vehicle: "1002", city: "NN", status: "on_duty" },
    { id: 3, name: "Sarah Davis", vehicle: "1003", city: "HPT", status: "on_duty" },
    { id: 4, name: "David Wilson", vehicle: "1005", city: "VB", status: "on_duty" },
    { id: 5, name: "Emily Brown", vehicle: "1008", city: "IW", status: "on_duty" },
  ];

  const dayOffRequests = [
    { id: 1, driver: "James Miller", requestDate: "2026-01-15", reason: "Personal", status: "pending" },
    { id: 2, driver: "Lisa Anderson", requestDate: "2026-01-16", reason: "Medical", status: "approved" },
    { id: 3, driver: "Robert Taylor", requestDate: "2026-01-17", reason: "Family", status: "pending" },
  ];

  const upcomingTraining = [
    { id: 1, applicant: "Michael Thompson", type: "Initial Training", date: "2026-01-15", time: "9:00 AM" },
    { id: 2, applicant: "Sarah Williams", type: "MediRoute Training", date: "2026-01-16", time: "10:00 AM" },
  ];

  const upcomingInterviews = [
    { id: 1, applicant: "Sarah Williams", date: "2026-01-15", time: "10:00 AM", interviewer: "HR Manager" },
    { id: 2, applicant: "Emily Davis", date: "2026-01-16", time: "2:00 PM", interviewer: "Operations" },
  ];

  const certificationDue = [
    { id: 1, driver: "John Smith", certification: "CPR/First Aid", dueDate: "2026-01-20" },
    { id: 2, driver: "Mike Johnson", certification: "Defensive Driving", dueDate: "2026-01-25" },
    { id: 3, driver: "Sarah Davis", certification: "Wheelchair Assistance", dueDate: "2026-01-28" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground">
            Manage driver schedules, interviews, and training
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Today's Overview */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </CardTitle>
          <CardDescription>Shift: {todaySchedule.shift}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-white text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{todaySchedule.totalDrivers}</div>
              <div className="text-sm text-muted-foreground">Total Drivers</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 text-center">
              <UserCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold text-green-600">{todaySchedule.scheduled}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 text-center">
              <UserX className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-amber-600">{todaySchedule.dayOff}</div>
              <div className="text-sm text-muted-foreground">Day Off</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 text-center">
              <Clock className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <div className="text-2xl font-bold text-gray-600">{todaySchedule.onLeave}</div>
              <div className="text-sm text-muted-foreground">On Leave</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Day Off Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-amber-500" />
              Day Off Requests
            </CardTitle>
            <CardDescription>Pending approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayOffRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{request.driver}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(request.requestDate).toLocaleDateString()} - {request.reason}
                    </div>
                  </div>
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8">Deny</Button>
                      <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600">Approve</Button>
                    </div>
                  ) : (
                    <Badge variant="default" className="bg-green-500">Approved</Badge>
                  )}
                </div>
              ))}
              {dayOffRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No pending requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Upcoming Interviews
            </CardTitle>
            <CardDescription>Scheduled this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{interview.applicant}</div>
                    <Badge variant="outline">{interview.interviewer}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(interview.date).toLocaleDateString()} at {interview.time}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setLocation("/hr/applications")}>
                View All Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Training */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              Upcoming Training Sessions
            </CardTitle>
            <CardDescription>Scheduled training for new drivers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTraining.map((training) => (
                <div key={training.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{training.applicant}</div>
                    <div className="text-sm text-muted-foreground">{training.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{new Date(training.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">{training.time}</div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Schedule Training
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Certification Due */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-orange-500" />
              Certifications Due
            </CardTitle>
            <CardDescription>Expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificationDue.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{cert.driver}</div>
                    <div className="text-sm text-muted-foreground">{cert.certification}</div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    Due: {new Date(cert.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Certifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Drivers List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Scheduled Drivers</CardTitle>
          <CardDescription>Drivers on duty for today's shift</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {scheduledDrivers.map((driver) => (
              <div 
                key={driver.id} 
                className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                onClick={() => setLocation(`/hr/drivers/${driver.id}`)}
              >
                <div className="font-medium">{driver.name}</div>
                <div className="text-sm text-muted-foreground">Vehicle #{driver.vehicle}</div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">{driver.city}</Badge>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setLocation("/hr/drivers")}>
              View All Drivers ({todaySchedule.scheduled} scheduled)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
