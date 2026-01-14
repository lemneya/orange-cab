import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  UserPlus, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Applications() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - would come from API
  const applications = [
    {
      id: 1,
      firstName: "Michael",
      lastName: "Thompson",
      phone: "(757) 555-0201",
      email: "m.thompson@email.com",
      applicationDate: "2026-01-10",
      status: "pending",
      preferredCity: "VB",
      licenseNumber: "V12345678",
      licenseExpiration: "2028-05-15"
    },
    {
      id: 2,
      firstName: "Sarah",
      lastName: "Williams",
      phone: "(757) 555-0202",
      email: "s.williams@email.com",
      applicationDate: "2026-01-08",
      status: "interview_scheduled",
      preferredCity: "NN",
      interviewDate: "2026-01-15 10:00",
      licenseNumber: "V87654321",
      licenseExpiration: "2027-09-20"
    },
    {
      id: 3,
      firstName: "James",
      lastName: "Brown",
      phone: "(757) 555-0203",
      email: "j.brown@email.com",
      applicationDate: "2026-01-05",
      status: "training_scheduled",
      preferredCity: "HPT",
      trainingStartDate: "2026-01-20",
      licenseNumber: "V11223344",
      licenseExpiration: "2029-02-10"
    },
    {
      id: 4,
      firstName: "Emily",
      lastName: "Davis",
      phone: "(757) 555-0204",
      email: "e.davis@email.com",
      applicationDate: "2026-01-03",
      status: "certification_pending",
      preferredCity: "IW",
      licenseNumber: "V55667788",
      licenseExpiration: "2028-11-30"
    },
    {
      id: 5,
      firstName: "Robert",
      lastName: "Miller",
      phone: "(757) 555-0205",
      email: "r.miller@email.com",
      applicationDate: "2025-12-28",
      status: "approved",
      preferredCity: "VB",
      contractSignedDate: "2026-01-12",
      licenseNumber: "V99887766",
      licenseExpiration: "2027-07-25"
    },
  ];

  const stats = {
    total: 12,
    pending: 3,
    inProcess: 6,
    approved: 2,
    rejected: 1
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending Review", variant: "outline", className: "" },
      interview_scheduled: { label: "Interview Scheduled", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      training_scheduled: { label: "Training Scheduled", variant: "secondary", className: "bg-purple-100 text-purple-700" },
      certification_pending: { label: "Certification Pending", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      approved: { label: "Approved", variant: "default", className: "bg-green-500" },
      rejected: { label: "Rejected", variant: "destructive", className: "" },
      withdrawn: { label: "Withdrawn", variant: "outline", className: "text-gray-500" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Applications</h1>
          <p className="text-muted-foreground">
            Manage driver applications and onboarding process
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Process</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProcess}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
          <CardDescription>Current status of all applications in process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center p-4 border-r">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
            <div className="flex-1 text-center p-4 border-r">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-muted-foreground">Interview</div>
            </div>
            <div className="flex-1 text-center p-4 border-r">
              <div className="text-2xl font-bold text-purple-600">2</div>
              <div className="text-sm text-muted-foreground">Training</div>
            </div>
            <div className="flex-1 text-center p-4 border-r">
              <div className="text-2xl font-bold text-amber-600">2</div>
              <div className="text-sm text-muted-foreground">Certification</div>
            </div>
            <div className="flex-1 text-center p-4">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-muted-foreground">Ready to Hire</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="training_scheduled">Training Scheduled</SelectItem>
                <SelectItem value="certification_pending">Certification Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Preferred City</TableHead>
                <TableHead>Application Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.firstName} {app.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{app.phone}</div>
                      <div className="text-muted-foreground">{app.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{app.licenseNumber}</TableCell>
                  <TableCell>{app.preferredCity}</TableCell>
                  <TableCell>{new Date(app.applicationDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    {app.status === "interview_scheduled" && app.interviewDate && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        {new Date(app.interviewDate).toLocaleString()}
                      </div>
                    )}
                    {app.status === "training_scheduled" && app.trainingStartDate && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        Training: {new Date(app.trainingStartDate).toLocaleDateString()}
                      </div>
                    )}
                    {app.status === "pending" && (
                      <span className="text-sm text-muted-foreground">Schedule Interview</span>
                    )}
                    {app.status === "approved" && (
                      <span className="text-sm text-green-600">Ready for Contract</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      {app.status === "pending" && (
                        <Button variant="outline" size="sm">Schedule</Button>
                      )}
                      {app.status === "approved" && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          Create Contract
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
