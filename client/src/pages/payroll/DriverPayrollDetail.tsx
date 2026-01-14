import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Car, 
  Fuel, 
  Receipt, 
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download
} from "lucide-react";

// Mock data for driver detail
const mockDriver = {
  id: 3,
  name: "Mike Johnson",
  vehicleNumber: "1003",
  contractType: "1099",
  payScheme: "per_mile",
  ratePerMile: 0.55,
};

const mockPayPeriod = {
  id: 1,
  startDate: "2026-01-06",
  endDate: "2026-01-12",
  status: "review",
};

const mockPayrollSummary = {
  trips: 45,
  miles: 892.5,
  grossPay: 49087, // cents
  totalDollars: 0,
  gas: 12500, // cents
  tolls: 2350, // cents
  credits: 5000, // cents
  otherDeductions: 0,
  netPay: 39237, // cents
};

const mockFuelTransactions = [
  {
    id: 1,
    date: "2026-01-07",
    amount: 4523,
    gallons: 12.5,
    station: "Shell - Richmond Hwy",
    city: "Alexandria",
    state: "VA",
    cardLastFour: "1234",
  },
  {
    id: 2,
    date: "2026-01-09",
    amount: 3890,
    gallons: 10.8,
    station: "Shell - Duke St",
    city: "Alexandria",
    state: "VA",
    cardLastFour: "1234",
  },
  {
    id: 3,
    date: "2026-01-11",
    amount: 4087,
    gallons: 11.2,
    station: "Exxon - King St",
    city: "Alexandria",
    state: "VA",
    cardLastFour: "1234",
  },
];

const mockTollTransactions = [
  {
    id: 1,
    date: "2026-01-07",
    amount: 350,
    plaza: "Dulles Toll Road",
    road: "VA-267",
    transponder: "12345678",
  },
  {
    id: 2,
    date: "2026-01-08",
    amount: 275,
    plaza: "I-495 Express Lanes",
    road: "I-495",
    transponder: "12345678",
  },
  {
    id: 3,
    date: "2026-01-09",
    amount: 350,
    plaza: "Dulles Toll Road",
    road: "VA-267",
    transponder: "12345678",
  },
  {
    id: 4,
    date: "2026-01-10",
    amount: 425,
    plaza: "I-66 Express Lanes",
    road: "I-66",
    transponder: "12345678",
  },
  {
    id: 5,
    date: "2026-01-11",
    amount: 275,
    plaza: "I-495 Express Lanes",
    road: "I-495",
    transponder: "12345678",
  },
  {
    id: 6,
    date: "2026-01-12",
    amount: 675,
    plaza: "Chesapeake Bay Bridge",
    road: "US-50",
    transponder: "12345678",
  },
];

const mockAdjustments = [
  {
    id: 1,
    type: "credit",
    amount: 5000,
    memo: "Referral bonus - new driver signup",
    date: "2026-01-10",
    addedBy: "Admin",
  },
];

export default function DriverPayrollDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/payroll/drivers/:id");
  const driverId = params?.id;

  const totalFuel = mockFuelTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTolls = mockTollTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/payroll/drivers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            {mockDriver.name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Vehicle #{mockDriver.vehicleNumber}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Week of {new Date(mockPayPeriod.startDate).toLocaleDateString()} - {new Date(mockPayPeriod.endDate).toLocaleDateString()}
            </span>
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mockPayrollSummary.trips}</div>
            <p className="text-sm text-muted-foreground">Trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mockPayrollSummary.miles.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${(mockPayrollSummary.grossPay / 100).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Gross Pay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">-${(mockPayrollSummary.gas / 100).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Gas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">-${(mockPayrollSummary.tolls / 100).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Tolls</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">${(mockPayrollSummary.netPay / 100).toFixed(2)}</div>
            <p className="text-sm text-green-600">Net Pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Pay Calculation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Calculation</CardTitle>
          <CardDescription>
            Formula: net = (miles × rate) + total_dollars + credits − gas − deductions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Miles × Rate</span>
              <span>{mockPayrollSummary.miles.toFixed(1)} mi × ${mockDriver.ratePerMile.toFixed(2)} = <strong>${(mockPayrollSummary.miles * mockDriver.ratePerMile).toFixed(2)}</strong></span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">+ Total Dollars (MAT/Bonus)</span>
              <span>${(mockPayrollSummary.totalDollars / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-green-600">
              <span>+ Credits</span>
              <span>+${(mockPayrollSummary.credits / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-orange-600">
              <span>− Gas</span>
              <span>-${(mockPayrollSummary.gas / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-blue-600">
              <span>− Tolls</span>
              <span>-${(mockPayrollSummary.tolls / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-red-600">
              <span>− Other Deductions</span>
              <span>-${(mockPayrollSummary.otherDeductions / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-lg font-bold bg-green-50 px-3 rounded">
              <span>= Net Pay</span>
              <span className="text-green-700">${(mockPayrollSummary.netPay / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Tabs */}
      <Tabs defaultValue="fuel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4" />
            Fuel ({mockFuelTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="tolls" className="gap-2">
            <Receipt className="h-4 w-4" />
            Tolls ({mockTollTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Adjustments ({mockAdjustments.length})
          </TabsTrigger>
        </TabsList>

        {/* Fuel Transactions */}
        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-500" />
                Fuel Transactions
              </CardTitle>
              <CardDescription>
                Total: ${(totalFuel / 100).toFixed(2)} from {mockFuelTransactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Gallons</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFuelTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                      <TableCell>{txn.station}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {txn.city}, {txn.state}
                        </span>
                      </TableCell>
                      <TableCell>{txn.gallons.toFixed(2)} gal</TableCell>
                      <TableCell>****{txn.cardLastFour}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(txn.amount / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-orange-50 font-bold">
                    <TableCell colSpan={5}>Total Fuel</TableCell>
                    <TableCell className="text-right">${(totalFuel / 100).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Toll Transactions */}
        <TabsContent value="tolls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                Toll Transactions
              </CardTitle>
              <CardDescription>
                Total: ${(totalTolls / 100).toFixed(2)} from {mockTollTransactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plaza</TableHead>
                    <TableHead>Road</TableHead>
                    <TableHead>Transponder</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTollTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                      <TableCell>{txn.plaza}</TableCell>
                      <TableCell>{txn.road}</TableCell>
                      <TableCell>{txn.transponder}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(txn.amount / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell colSpan={4}>Total Tolls</TableCell>
                    <TableCell className="text-right">${(totalTolls / 100).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adjustments */}
        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Adjustments
              </CardTitle>
              <CardDescription>
                Credits, advances, and other adjustments for this pay period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAdjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell>{new Date(adj.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={adj.type === "credit" ? "default" : "destructive"}>
                          {adj.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{adj.memo}</TableCell>
                      <TableCell>{adj.addedBy}</TableCell>
                      <TableCell className={`text-right font-medium ${adj.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {adj.type === "credit" ? "+" : "-"}${(adj.amount / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {mockAdjustments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No adjustments for this pay period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
