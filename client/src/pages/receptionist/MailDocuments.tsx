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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Upload,
  Download,
  Inbox,
  Send,
  Clock,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export default function MailDocuments() {
  const [search, setSearch] = useState("");

  // Mock data - would come from API
  const incomingMail = [
    {
      id: 1,
      receivedDate: "2026-01-13",
      sender: "Virginia DMV",
      subject: "Vehicle Registration Renewal - #1015",
      category: "registration",
      status: "pending",
      assignedTo: "Fleet Manager",
      scanned: true
    },
    {
      id: 2,
      receivedDate: "2026-01-12",
      sender: "State Farm Insurance",
      subject: "Policy Renewal Notice",
      category: "insurance",
      status: "processed",
      assignedTo: "Director",
      scanned: true
    },
    {
      id: 3,
      receivedDate: "2026-01-11",
      sender: "City of Norfolk",
      subject: "Parking Violation Notice",
      category: "ticket",
      status: "pending",
      assignedTo: "Receptionist",
      scanned: true
    },
    {
      id: 4,
      receivedDate: "2026-01-10",
      sender: "ModivCare",
      subject: "Contract Amendment",
      category: "contract",
      status: "processed",
      assignedTo: "Director",
      scanned: true
    },
  ];

  const scannedDocuments = [
    {
      id: 1,
      fileName: "Registration_1015_2026.pdf",
      uploadDate: "2026-01-13",
      category: "registration",
      vehicleNumber: "1015",
      uploadedBy: "Reception",
      size: "245 KB"
    },
    {
      id: 2,
      fileName: "Insurance_Policy_2026.pdf",
      uploadDate: "2026-01-12",
      category: "insurance",
      vehicleNumber: null,
      uploadedBy: "Reception",
      size: "1.2 MB"
    },
    {
      id: 3,
      fileName: "Driver_License_JSmith.pdf",
      uploadDate: "2026-01-11",
      category: "driver_document",
      vehicleNumber: null,
      uploadedBy: "Reception",
      size: "156 KB"
    },
    {
      id: 4,
      fileName: "Inspection_Report_1022.pdf",
      uploadDate: "2026-01-10",
      category: "inspection",
      vehicleNumber: "1022",
      uploadedBy: "Garage",
      size: "890 KB"
    },
  ];

  const stats = {
    pendingMail: 5,
    processedToday: 8,
    scannedToday: 12,
    totalDocuments: 1245
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "" },
      processed: { label: "Processed", variant: "default", className: "bg-green-500" },
      archived: { label: "Archived", variant: "secondary", className: "" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { label: string; className: string }> = {
      registration: { label: "Registration", className: "bg-blue-100 text-blue-700" },
      insurance: { label: "Insurance", className: "bg-green-100 text-green-700" },
      ticket: { label: "Ticket", className: "bg-red-100 text-red-700" },
      contract: { label: "Contract", className: "bg-purple-100 text-purple-700" },
      inspection: { label: "Inspection", className: "bg-amber-100 text-amber-700" },
      driver_document: { label: "Driver Doc", className: "bg-orange-100 text-orange-700" },
      other: { label: "Other", className: "bg-gray-100 text-gray-700" },
    };
    const c = config[category] || config.other;
    return <Badge variant="secondary" className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mail & Documents</h1>
          <p className="text-muted-foreground">
            Process incoming mail and manage scanned documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Log Mail
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Mail</p>
                <p className="text-2xl font-bold">{stats.pendingMail}</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.processedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scanned Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scannedToday}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mail" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mail">Incoming Mail</TabsTrigger>
          <TabsTrigger value="documents">Scanned Documents</TabsTrigger>
        </TabsList>

        {/* Mail Tab */}
        <TabsContent value="mail" className="space-y-4">
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
                      placeholder="Search by sender or subject..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mail Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Received</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scanned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingMail.map((mail) => (
                    <TableRow key={mail.id}>
                      <TableCell>{new Date(mail.receivedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{mail.sender}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{mail.subject}</TableCell>
                      <TableCell>{getCategoryBadge(mail.category)}</TableCell>
                      <TableCell>{mail.assignedTo}</TableCell>
                      <TableCell>{getStatusBadge(mail.status)}</TableCell>
                      <TableCell>
                        {mail.scanned ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          {mail.status === "pending" && (
                            <Button variant="outline" size="sm">Process</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
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
                      placeholder="Search by file name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="driver_document">Driver Document</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="week">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
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
                    <TableHead>File Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                      <TableCell>
                        {doc.vehicleNumber ? `#${doc.vehicleNumber}` : '-'}
                      </TableCell>
                      <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Document Upload</CardTitle>
          <CardDescription>Scan and upload documents to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Vehicle Registration</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Insurance Document</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Driver License</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Other Document</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
