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
  FileText, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Upload,
  Download
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function FleetDocuments() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - would come from API
  const documents = [
    { id: 1, vehicleNumber: "1001", category: "registration", fileName: "Registration_1001.pdf", expirationDate: "2026-03-15", status: "valid" },
    { id: 2, vehicleNumber: "1001", category: "state_inspection", fileName: "Inspection_1001.pdf", expirationDate: "2026-01-20", status: "expiring" },
    { id: 3, vehicleNumber: "1002", category: "insurance", fileName: "Insurance_1002.pdf", expirationDate: "2026-06-30", status: "valid" },
    { id: 4, vehicleNumber: "1003", category: "registration", fileName: "Registration_1003.pdf", expirationDate: "2026-01-10", status: "expired" },
    { id: 5, vehicleNumber: "1005", category: "city_inspection", fileName: "CityInsp_1005.pdf", expirationDate: "2026-02-28", status: "valid" },
    { id: 6, vehicleNumber: "1008", category: "title", fileName: "Title_1008.pdf", expirationDate: null, status: "valid" },
  ];

  const documentStats = {
    total: 245,
    valid: 210,
    expiringSoon: 23,
    expired: 12
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge variant="default" className="bg-green-500">Valid</Badge>;
      case "expiring":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Expiring Soon</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      title: "Title",
      purchase_bill: "Purchase Bill",
      state_inspection: "State Inspection",
      registration: "Registration",
      insurance: "Insurance",
      city_inspection: "City Inspection",
      other: "Other"
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Documents</h1>
          <p className="text-muted-foreground">
            Manage vehicle documents, registrations, and inspections
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{documentStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold text-green-600">{documentStats.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-600">{documentStats.expiringSoon}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Within 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{documentStats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search by vehicle # or file name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="state_inspection">State Inspection</SelectItem>
                <SelectItem value="city_inspection">City Inspection</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle #</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => setLocation(`/fleet/vehicles/${doc.id}`)}
                    >
                      {doc.vehicleNumber}
                    </Button>
                  </TableCell>
                  <TableCell>{getCategoryLabel(doc.category)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.fileName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.expirationDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(doc.expirationDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expiration Calendar Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Upcoming Expirations
          </CardTitle>
          <CardDescription>Documents expiring in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-3">This Week</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1003 - Registration</span>
                  <Badge variant="destructive">Jan 10</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1005 - State Inspection</span>
                  <Badge variant="secondary">Jan 15</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Next Week</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1001 - State Inspection</span>
                  <Badge variant="secondary">Jan 20</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1012 - Registration</span>
                  <Badge variant="secondary">Jan 25</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Later This Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1018 - State Inspection</span>
                  <Badge variant="outline">Jan 28</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vehicle #1023 - City Inspection</span>
                  <Badge variant="outline">Feb 1</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
