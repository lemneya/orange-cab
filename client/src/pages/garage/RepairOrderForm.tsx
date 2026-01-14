import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Wrench } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";

export default function RepairOrderForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = params.id && params.id !== "new";

  const [formData, setFormData] = useState({
    vehicleId: "",
    priority: "medium",
    problemDescription: "",
    diagnosis: "",
    bayId: "",
    mechanicId: "",
    estimatedCompletion: "",
    mileageIn: "",
    notes: ""
  });

  // Mock data for dropdowns
  const vehicles = [
    { id: 1, number: "1001", make: "Toyota Sienna" },
    { id: 2, number: "1002", make: "Honda Odyssey" },
    { id: 3, number: "1003", make: "Dodge Caravan" },
    { id: 4, number: "1015", make: "Toyota Sienna" },
    { id: 5, number: "1022", make: "Honda Odyssey" },
  ];

  const mechanics = [
    { id: 1, name: "Ahmed Hassan" },
    { id: 2, name: "Carlos Rodriguez" },
  ];

  const bays = [
    { id: 1, name: "Bay 1", status: "occupied" },
    { id: 2, name: "Bay 2", status: "occupied" },
    { id: 3, name: "Bay 3", status: "available" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would submit to API
    console.log("Submitting:", formData);
    setLocation("/garage/repairs");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/garage/repairs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Repair Order" : "New Repair Order"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update repair order details" : "Create a new repair work order"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vehicle & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                Repair Details
              </CardTitle>
              <CardDescription>Basic information about the repair</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select 
                  value={formData.vehicleId} 
                  onValueChange={(value) => setFormData({...formData, vehicleId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        #{v.number} - {v.make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent - Immediate attention</SelectItem>
                    <SelectItem value="high">High - Within 24 hours</SelectItem>
                    <SelectItem value="medium">Medium - Within 3 days</SelectItem>
                    <SelectItem value="low">Low - Scheduled maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileageIn">Mileage In</Label>
                <Input
                  id="mileageIn"
                  type="number"
                  placeholder="Current mileage"
                  value={formData.mileageIn}
                  onChange={(e) => setFormData({...formData, mileageIn: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                <Input
                  id="estimatedCompletion"
                  type="date"
                  value={formData.estimatedCompletion}
                  onChange={(e) => setFormData({...formData, estimatedCompletion: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Assign bay and mechanic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bay">Garage Bay</Label>
                <Select 
                  value={formData.bayId} 
                  onValueChange={(value) => setFormData({...formData, bayId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {bays.map((bay) => (
                      <SelectItem 
                        key={bay.id} 
                        value={bay.id.toString()}
                        disabled={bay.status === "occupied"}
                      >
                        {bay.name} {bay.status === "occupied" ? "(Occupied)" : "(Available)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mechanic">Assigned Mechanic</Label>
                <Select 
                  value={formData.mechanicId} 
                  onValueChange={(value) => setFormData({...formData, mechanicId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mechanic" />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanics.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Bay Status</h4>
                <div className="grid grid-cols-3 gap-2">
                  {bays.map((bay) => (
                    <div 
                      key={bay.id}
                      className={`p-2 rounded text-center text-sm ${
                        bay.status === "available" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {bay.name}
                      <div className="text-xs">{bay.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem Description */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Description</CardTitle>
            <CardDescription>Describe the issue and any diagnosis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem">Problem Description *</Label>
              <Textarea
                id="problem"
                placeholder="Describe the problem or issue reported..."
                rows={4}
                value={formData.problemDescription}
                onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                placeholder="Mechanic's diagnosis and findings..."
                rows={4}
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or special instructions..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation("/garage/repairs")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
