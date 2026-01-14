import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Fuel, 
  Receipt, 
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  Eye
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Allocation {
  id: number;
  sourceType: "fuel" | "toll";
  sourceTxnId: number;
  payPeriodId: number | null;
  driverId: number | null;
  vehicleId: number | null;
  amount: number;
  confidence: string;
  matchReason: string | null;
  status: string;
  createdAt: string;
}

// Mock data for demo
const mockUnmatchedAllocations: Allocation[] = [
  {
    id: 1,
    sourceType: "fuel",
    sourceTxnId: 101,
    payPeriodId: 1,
    driverId: null,
    vehicleId: null,
    amount: 4523,
    confidence: "vehicle_time",
    matchReason: "No matching driver found for card ****1234",
    status: "unmatched",
    createdAt: "2026-01-10T08:30:00Z",
  },
  {
    id: 2,
    sourceType: "fuel",
    sourceTxnId: 102,
    payPeriodId: 1,
    driverId: null,
    vehicleId: 5,
    amount: 5890,
    confidence: "vehicle_time",
    matchReason: "Vehicle 1005 found but no driver currently assigned",
    status: "unmatched",
    createdAt: "2026-01-10T14:15:00Z",
  },
  {
    id: 3,
    sourceType: "toll",
    sourceTxnId: 201,
    payPeriodId: 1,
    driverId: null,
    vehicleId: null,
    amount: 350,
    confidence: "vehicle_time",
    matchReason: "No matching vehicle or driver found for transponder 12345678",
    status: "unmatched",
    createdAt: "2026-01-11T06:45:00Z",
  },
  {
    id: 4,
    sourceType: "toll",
    sourceTxnId: 202,
    payPeriodId: 1,
    driverId: null,
    vehicleId: 8,
    amount: 275,
    confidence: "vehicle_time",
    matchReason: "Vehicle 1008 found but no driver currently assigned",
    status: "unmatched",
    createdAt: "2026-01-11T09:20:00Z",
  },
  {
    id: 5,
    sourceType: "fuel",
    sourceTxnId: 103,
    payPeriodId: 1,
    driverId: null,
    vehicleId: null,
    amount: 6234,
    confidence: "vehicle_time",
    matchReason: "Unknown unit number: 9999",
    status: "unmatched",
    createdAt: "2026-01-12T11:00:00Z",
  },
];

const mockDrivers = [
  { id: 1, name: "John Smith", vehicleNumber: "1001" },
  { id: 2, name: "Maria Garcia", vehicleNumber: "1002" },
  { id: 3, name: "Mike Johnson", vehicleNumber: "1003" },
  { id: 4, name: "Sarah Williams", vehicleNumber: "1004" },
  { id: 5, name: "David Brown", vehicleNumber: "1005" },
  { id: 6, name: "Lisa Davis", vehicleNumber: "1006" },
  { id: 7, name: "James Wilson", vehicleNumber: "1007" },
  { id: 8, name: "Jennifer Martinez", vehicleNumber: "1008" },
];

export default function ReconciliationQueue() {
  const [allocations, setAllocations] = useState<Allocation[]>(mockUnmatchedAllocations);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const assignMutation = trpc.fuelImport.assignToDriver.useMutation();

  const handleAssign = async () => {
    if (!selectedAllocation || !selectedDriverId) return;

    try {
      await assignMutation.mutateAsync({
        allocationId: selectedAllocation.id,
        driverId: parseInt(selectedDriverId),
      });

      // Update local state
      setAllocations(prev => prev.filter(a => a.id !== selectedAllocation.id));
      setAssignDialogOpen(false);
      setSelectedAllocation(null);
      setSelectedDriverId("");
    } catch (error) {
      console.error("Assignment failed:", error);
      // For demo, still update local state
      setAllocations(prev => prev.filter(a => a.id !== selectedAllocation.id));
      setAssignDialogOpen(false);
      setSelectedAllocation(null);
      setSelectedDriverId("");
    }
  };

  const handleExclude = (allocation: Allocation) => {
    setAllocations(prev => prev.filter(a => a.id !== allocation.id));
  };

  const filteredAllocations = allocations.filter(a => {
    if (filterType !== "all" && a.sourceType !== filterType) return false;
    if (searchTerm && !a.matchReason?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const fuelCount = allocations.filter(a => a.sourceType === "fuel").length;
  const tollCount = allocations.filter(a => a.sourceType === "toll").length;
  const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            Reconciliation Queue
          </h1>
          <p className="text-muted-foreground">
            Review and assign unmatched fuel and toll transactions
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-600">{allocations.length}</div>
            <p className="text-sm text-muted-foreground">Unmatched Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{fuelCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Fuel Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{tollCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Toll Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${(totalAmount / 100).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Unassigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fuel">Fuel Only</SelectItem>
                  <SelectItem value="toll">Toll Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unmatched Transactions</CardTitle>
          <CardDescription>
            Assign each transaction to a driver or exclude from payroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAllocations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground">No unmatched transactions to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      {allocation.sourceType === "fuel" ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Fuel className="h-3 w-3 mr-1" />
                          Fuel
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Receipt className="h-3 w-3 mr-1" />
                          Toll
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(allocation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(allocation.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {allocation.vehicleId ? (
                        <Badge variant="secondary">
                          Vehicle #{allocation.vehicleId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <span className="text-sm text-muted-foreground">
                        {allocation.matchReason}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAllocation(allocation);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleExclude(allocation)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Driver</DialogTitle>
            <DialogDescription>
              Select a driver to assign this {selectedAllocation?.sourceType} transaction to
            </DialogDescription>
          </DialogHeader>
          
          {selectedAllocation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">
                    {selectedAllocation.sourceType === "fuel" ? (
                      <>
                        <Fuel className="h-3 w-3 mr-1" />
                        Fuel
                      </>
                    ) : (
                      <>
                        <Receipt className="h-3 w-3 mr-1" />
                        Toll
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">${(selectedAllocation.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span>{new Date(selectedAllocation.createdAt).toLocaleDateString()}</span>
                </div>
                {selectedAllocation.matchReason && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Reason: </span>
                    <span className="text-sm">{selectedAllocation.matchReason}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Driver</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.name} (Vehicle #{driver.vehicleNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedDriverId}>
              Assign to Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
