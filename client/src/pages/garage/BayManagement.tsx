import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Car, 
  Wrench, 
  Clock,
  User,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";

export default function BayManagement() {
  const [, setLocation] = useLocation();

  // Mock data - would come from API
  const bays = [
    {
      id: 1,
      name: "Bay 1",
      status: "occupied",
      currentVehicle: {
        number: "1015",
        make: "Toyota Sienna",
        problem: "Brake service - pads and rotors",
        mechanic: "Ahmed Hassan",
        startTime: "2026-01-12 08:00",
        estimatedHours: 4,
        hoursWorked: 2.5,
        priority: "urgent"
      }
    },
    {
      id: 2,
      name: "Bay 2",
      status: "occupied",
      currentVehicle: {
        number: "1022",
        make: "Honda Odyssey",
        problem: "Transmission fluid change and inspection",
        mechanic: "Carlos Rodriguez",
        startTime: "2026-01-12 09:30",
        estimatedHours: 6,
        hoursWorked: 1.5,
        priority: "high"
      }
    },
    {
      id: 3,
      name: "Bay 3",
      status: "available",
      currentVehicle: null
    }
  ];

  const queuedVehicles = [
    { id: 1, number: "1008", make: "Dodge Caravan", problem: "AC repair", priority: "medium", waitingParts: true },
    { id: 2, number: "1031", make: "Nissan Quest", problem: "Oil change", priority: "low", waitingParts: false },
    { id: 3, number: "1018", make: "Toyota Sienna", problem: "Tire rotation", priority: "low", waitingParts: false },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-50 border-red-200";
      case "high": return "text-orange-500 bg-orange-50 border-orange-200";
      case "medium": return "text-amber-500 bg-amber-50 border-amber-200";
      default: return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bay Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage garage bay assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/garage/repairs")}>
            View All Repairs
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setLocation("/garage/repairs/new")}>
            New Repair Order
          </Button>
        </div>
      </div>

      {/* Bay Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Available Bays</p>
                <p className="text-3xl font-bold text-green-600">1</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Occupied Bays</p>
                <p className="text-3xl font-bold text-amber-600">2</p>
              </div>
              <Wrench className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queued Vehicles</p>
                <p className="text-3xl font-bold">{queuedVehicles.length}</p>
              </div>
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bay Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {bays.map((bay) => (
          <Card 
            key={bay.id} 
            className={`${bay.status === "available" ? "border-green-200 bg-green-50/50" : "border-amber-200"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {bay.name}
                </CardTitle>
                <Badge variant={bay.status === "available" ? "default" : "secondary"} className={bay.status === "available" ? "bg-green-500" : ""}>
                  {bay.status === "available" ? "Available" : "Occupied"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {bay.currentVehicle ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">#{bay.currentVehicle.number}</div>
                      <div className="text-sm text-muted-foreground">{bay.currentVehicle.make}</div>
                    </div>
                    <Badge className={`ml-auto ${getPriorityColor(bay.currentVehicle.priority)}`}>
                      {bay.currentVehicle.priority}
                    </Badge>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Work in Progress:</p>
                    <p className="text-sm text-muted-foreground">{bay.currentVehicle.problem}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{bay.currentVehicle.mechanic}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{bay.currentVehicle.hoursWorked}h / {bay.currentVehicle.estimatedHours}h</span>
                    </div>
                    <Progress 
                      value={(bay.currentVehicle.hoursWorked / bay.currentVehicle.estimatedHours) * 100} 
                      className="h-2"
                    />
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => setLocation(`/garage/repairs/1`)}>
                    View Details
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Bay is available</p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation("/garage/repairs/new")}
                  >
                    Assign Vehicle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Repair Queue
          </CardTitle>
          <CardDescription>Vehicles waiting for bay assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queuedVehicles.map((vehicle, index) => (
              <div 
                key={vehicle.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">#{vehicle.number} - {vehicle.make}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.problem}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {vehicle.waitingParts && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Waiting Parts
                    </Badge>
                  )}
                  <Badge className={getPriorityColor(vehicle.priority)}>
                    {vehicle.priority}
                  </Badge>
                  <Button variant="outline" size="sm" disabled={vehicle.waitingParts}>
                    Assign Bay
                  </Button>
                </div>
              </div>
            ))}
            {queuedVehicles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles in queue
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
