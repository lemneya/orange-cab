import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Plus, 
  Wrench, 
  Clock,
  CheckCircle,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { useLocation } from "wouter";

export default function MechanicList() {
  const [, setLocation] = useLocation();

  // Mock data - would come from API
  const mechanics = [
    {
      id: 1,
      firstName: "Ahmed",
      lastName: "Hassan",
      phone: "(757) 555-0101",
      email: "ahmed.hassan@orangecab.com",
      specialization: "Engine, Transmission, Brakes",
      certifications: ["ASE Certified", "Toyota Specialist"],
      hireDate: "2020-03-15",
      status: "active",
      currentAssignment: {
        bay: 1,
        vehicle: "1015",
        task: "Brake service"
      },
      stats: {
        completedThisWeek: 8,
        completedThisMonth: 32,
        avgCompletionTime: 3.2
      }
    },
    {
      id: 2,
      firstName: "Carlos",
      lastName: "Rodriguez",
      phone: "(757) 555-0102",
      email: "carlos.rodriguez@orangecab.com",
      specialization: "Electrical, AC/Heating, General Service",
      certifications: ["ASE Certified", "Honda Specialist"],
      hireDate: "2021-06-01",
      status: "active",
      currentAssignment: {
        bay: 2,
        vehicle: "1022",
        task: "Transmission inspection"
      },
      stats: {
        completedThisWeek: 6,
        completedThisMonth: 28,
        avgCompletionTime: 2.8
      }
    }
  ];

  const weeklyStats = {
    totalCompleted: 14,
    totalHours: 84,
    avgPerMechanic: 7
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mechanics</h1>
          <p className="text-muted-foreground">
            Manage your in-house repair team
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Mechanic
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mechanics</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">2</p>
              </div>
              <Wrench className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed This Week</p>
                <p className="text-2xl font-bold">{weeklyStats.totalCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{weeklyStats.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mechanic Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {mechanics.map((mechanic) => (
          <Card key={mechanic.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-orange-100 text-orange-700">
                    {mechanic.firstName[0]}{mechanic.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle>{mechanic.firstName} {mechanic.lastName}</CardTitle>
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {mechanic.specialization}
                  </CardDescription>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {mechanic.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {mechanic.email}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Assignment */}
              {mechanic.currentAssignment && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Currently Working On</p>
                      <p className="text-sm">Vehicle #{mechanic.currentAssignment.vehicle} - {mechanic.currentAssignment.task}</p>
                    </div>
                    <Badge variant="outline">Bay {mechanic.currentAssignment.bay}</Badge>
                  </div>
                </div>
              )}

              {/* Certifications */}
              <div>
                <p className="text-sm font-medium mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {mechanic.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{mechanic.stats.completedThisWeek}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{mechanic.stats.completedThisMonth}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{mechanic.stats.avgCompletionTime}h</p>
                  <p className="text-xs text-muted-foreground">Avg Time</p>
                </div>
              </div>

              {/* Hire Date */}
              <div className="flex items-center justify-between pt-4 border-t text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Hired: {new Date(mechanic.hireDate).toLocaleDateString()}
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Repair completions by mechanic this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mechanics.map((mechanic) => (
              <div key={mechanic.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{mechanic.firstName} {mechanic.lastName}</span>
                  <span className="font-medium">{mechanic.stats.completedThisWeek} repairs</span>
                </div>
                <Progress 
                  value={(mechanic.stats.completedThisWeek / 10) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
