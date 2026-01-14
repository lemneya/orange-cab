import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  AlertTriangle,
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  FileWarning,
  Clock,
  FileText,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// Types
interface ImportError {
  id: number;
  importBatchId: string;
  rowNumber: number;
  reason: string;
  rawPayload: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedDate: string | null;
  resolutionNotes: string | null;
  importDate: string;
}

interface ImportBatch {
  id: number;
  batchId: string;
  payrollPeriodId: number;
  sourceType: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt: string | null;
}

export default function ImportErrors() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedError, setSelectedError] = useState<ImportError | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Mock import batches
  const importBatches: ImportBatch[] = [
    {
      id: 1,
      batchId: "IMPORT-1736700000000",
      payrollPeriodId: 1,
      sourceType: "mediroute_api",
      totalRows: 250,
      successfulRows: 245,
      failedRows: 5,
      status: "completed",
      createdAt: "2026-01-12T10:00:00Z",
      completedAt: "2026-01-12T10:02:30Z"
    },
    {
      id: 2,
      batchId: "IMPORT-1736600000000",
      payrollPeriodId: 1,
      sourceType: "mediroute_api",
      totalRows: 180,
      successfulRows: 178,
      failedRows: 2,
      status: "completed",
      createdAt: "2026-01-11T09:00:00Z",
      completedAt: "2026-01-11T09:01:45Z"
    }
  ];

  // Mock import errors
  const [importErrors, setImportErrors] = useState<ImportError[]>([
    {
      id: 1,
      importBatchId: "IMPORT-1736700000000",
      rowNumber: 45,
      reason: "Trip has no assigned driver",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001500",
        tripDate: "2026-01-10",
        pickupAddress: "123 Main St",
        dropoffAddress: "456 Oak Ave",
        miles: 15.5,
        assignedDriverId: null
      }, null, 2),
      isResolved: false,
      resolvedBy: null,
      resolvedDate: null,
      resolutionNotes: null,
      importDate: "2026-01-12T10:00:00Z"
    },
    {
      id: 2,
      importBatchId: "IMPORT-1736700000000",
      rowNumber: 78,
      reason: "Invalid trip status: cancelled",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001533",
        tripDate: "2026-01-11",
        status: "cancelled",
        assignedDriverId: 5
      }, null, 2),
      isResolved: false,
      resolvedBy: null,
      resolvedDate: null,
      resolutionNotes: null,
      importDate: "2026-01-12T10:00:00Z"
    },
    {
      id: 3,
      importBatchId: "IMPORT-1736700000000",
      rowNumber: 112,
      reason: "Driver not found in system: DRV-999",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001567",
        tripDate: "2026-01-11",
        assignedDriverId: "DRV-999",
        miles: 22.3
      }, null, 2),
      isResolved: true,
      resolvedBy: "John Admin",
      resolvedDate: "2026-01-12T11:30:00Z",
      resolutionNotes: "Driver was added to system, trip manually processed",
      importDate: "2026-01-12T10:00:00Z"
    },
    {
      id: 4,
      importBatchId: "IMPORT-1736700000000",
      rowNumber: 156,
      reason: "Duplicate trip ID detected",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001234",
        tripDate: "2026-01-10",
        assignedDriverId: 3,
        miles: 18.0
      }, null, 2),
      isResolved: false,
      resolvedBy: null,
      resolvedDate: null,
      resolutionNotes: null,
      importDate: "2026-01-12T10:00:00Z"
    },
    {
      id: 5,
      importBatchId: "IMPORT-1736700000000",
      rowNumber: 201,
      reason: "Missing required field: miles",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001600",
        tripDate: "2026-01-12",
        assignedDriverId: 7,
        miles: null
      }, null, 2),
      isResolved: false,
      resolvedBy: null,
      resolvedDate: null,
      resolutionNotes: null,
      importDate: "2026-01-12T10:00:00Z"
    },
    {
      id: 6,
      importBatchId: "IMPORT-1736600000000",
      rowNumber: 89,
      reason: "Trip date outside pay period",
      rawPayload: JSON.stringify({
        tripId: "MR-2026-001100",
        tripDate: "2026-01-01",
        assignedDriverId: 2,
        miles: 12.5
      }, null, 2),
      isResolved: true,
      resolvedBy: "Jane Admin",
      resolvedDate: "2026-01-11T10:00:00Z",
      resolutionNotes: "Trip moved to correct pay period",
      importDate: "2026-01-11T09:00:00Z"
    }
  ]);

  // Filter errors
  const filteredErrors = importErrors.filter(error => {
    const matchesSearch = 
      error.reason.toLowerCase().includes(search.toLowerCase()) ||
      error.rawPayload.toLowerCase().includes(search.toLowerCase());
    
    const matchesBatch = selectedBatch === "all" || error.importBatchId === selectedBatch;
    const matchesResolved = showResolved || !error.isResolved;
    
    return matchesSearch && matchesBatch && matchesResolved;
  });

  // Stats
  const stats = {
    totalErrors: importErrors.length,
    unresolvedErrors: importErrors.filter(e => !e.isResolved).length,
    resolvedErrors: importErrors.filter(e => e.isResolved).length,
    latestBatch: importBatches[0]
  };

  // Handle resolve error
  const handleResolveError = (errorId: number) => {
    setImportErrors(prev => prev.map(error =>
      error.id === errorId
        ? {
            ...error,
            isResolved: true,
            resolvedBy: "Current User",
            resolvedDate: new Date().toISOString(),
            resolutionNotes: resolutionNotes
          }
        : error
    ));
    setSelectedError(null);
    setResolutionNotes("");
  };

  // Get reason badge color
  const getReasonBadge = (reason: string) => {
    if (reason.includes("no assigned driver")) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">No Driver</Badge>;
    }
    if (reason.includes("not found")) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Not Found</Badge>;
    }
    if (reason.includes("Invalid") || reason.includes("cancelled")) {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Invalid</Badge>;
    }
    if (reason.includes("Duplicate")) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Duplicate</Badge>;
    }
    if (reason.includes("Missing")) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Missing Data</Badge>;
    }
    return <Badge variant="outline">Error</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Errors</h1>
          <p className="text-muted-foreground">
            Review and resolve MediRoute import errors
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/payroll/drivers")}>
          Back to Payroll
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{stats.totalErrors}</p>
              </div>
              <FileWarning className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unresolved</p>
                <p className="text-2xl font-bold text-red-600">{stats.unresolvedErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedErrors}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latest Import</p>
                <p className="text-lg font-bold">
                  {stats.latestBatch.successfulRows}/{stats.latestBatch.totalRows}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(stats.latestBatch.createdAt).toLocaleDateString()}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Batches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Import Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {importBatches.map(batch => (
              <AccordionItem key={batch.id} value={batch.batchId}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 w-full">
                    <Badge 
                      variant={batch.status === "completed" ? "default" : "outline"}
                      className={batch.status === "completed" ? "bg-green-500" : ""}
                    >
                      {batch.status}
                    </Badge>
                    <span className="font-mono text-sm">{batch.batchId}</span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(batch.createdAt).toLocaleString()}
                    </span>
                    <div className="ml-auto flex items-center gap-2 mr-4">
                      <span className="text-green-600">{batch.successfulRows} ✓</span>
                      <span className="text-red-600">{batch.failedRows} ✗</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{batch.sourceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rows</p>
                      <p className="font-medium">{batch.totalRows}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="font-medium">
                        {((batch.successfulRows / batch.totalRows) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {batch.completedAt 
                          ? `${Math.round((new Date(batch.completedAt).getTime() - new Date(batch.createdAt).getTime()) / 1000)}s`
                          : "In progress"
                        }
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
                  placeholder="Search by error reason or payload..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {importBatches.map(batch => (
                  <SelectItem key={batch.batchId} value={batch.batchId}>
                    {batch.batchId.slice(-10)} ({batch.failedRows} errors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showResolved"
                checked={showResolved}
                onCheckedChange={(checked) => setShowResolved(checked as boolean)}
              />
              <label htmlFor="showResolved" className="text-sm">
                Show Resolved
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Errors ({filteredErrors.length})</CardTitle>
          <CardDescription>
            Click on an error to view details and resolve
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">No errors to display</p>
              <p className="text-sm">All import errors have been resolved</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Import Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredErrors.map(error => (
                  <TableRow 
                    key={error.id}
                    className={error.isResolved ? "opacity-60" : ""}
                  >
                    <TableCell className="font-mono">{error.rowNumber}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        ...{error.importBatchId.slice(-8)}
                      </code>
                    </TableCell>
                    <TableCell>{getReasonBadge(error.reason)}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={error.reason}>
                      {error.reason}
                    </TableCell>
                    <TableCell>
                      {new Date(error.importDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {error.isResolved ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unresolved
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedError(error)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Error Details - Row {error.rowNumber}</DialogTitle>
                            <DialogDescription>
                              {error.reason}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Batch ID</p>
                                <p className="font-mono text-sm">{error.importBatchId}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Import Date</p>
                                <p>{new Date(error.importDate).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Raw Payload</p>
                              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[200px]">
                                {error.rawPayload}
                              </pre>
                            </div>

                            {error.isResolved ? (
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="font-medium text-green-800 mb-2">Resolution</p>
                                <p className="text-sm text-green-700">
                                  Resolved by {error.resolvedBy} on {new Date(error.resolvedDate!).toLocaleString()}
                                </p>
                                {error.resolutionNotes && (
                                  <p className="text-sm mt-2">{error.resolutionNotes}</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Resolution Notes</p>
                                <Textarea
                                  placeholder="Enter notes about how this error was resolved..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            {!error.isResolved && (
                              <Button 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleResolveError(error.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Resolved
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
