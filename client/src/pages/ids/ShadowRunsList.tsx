import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  History, 
  Upload, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Truck,
  DollarSign,
  ArrowLeft,
  Eye
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ShadowRunsList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: shadowRuns, isLoading } = trpc.ids.getShadowRuns.useQuery({ limit: 100 });

  const runs = shadowRuns || [];
  
  const filteredRuns = runs.filter(run => 
    run.runDate.includes(searchTerm) ||
    run.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/ids")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Shadow Runs
            </h1>
            <p className="text-muted-foreground mt-1">
              View and analyze IDS optimization history
            </p>
          </div>
        </div>
        <Button onClick={() => setLocation("/ids/shadow-runs/new")}>
          <Upload className="mr-2 h-4 w-4" />
          New Shadow Solve
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by date or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadow Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shadow Runs</CardTitle>
          <CardDescription>
            {filteredRuns.length} runs found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shadow runs...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shadow runs found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation("/ids/shadow-runs/new")}
              >
                Run Your First Shadow Solve
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Drivers</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Gap-Fills</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Lock Violations</TableHead>
                  <TableHead>Solve Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow 
                    key={run.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/ids/shadow-runs/${run.id}`)}
                  >
                    <TableCell className="font-mono">#{run.id}</TableCell>
                    <TableCell>{run.runDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {run.inputTripsCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {run.result?.summary?.assignedTrips || 0} / {run.inputTripsCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {run.inputDriversCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        (run.result?.summary?.averageOnTimePercentage || 0) >= 90 
                          ? "secondary" 
                          : (run.result?.summary?.averageOnTimePercentage || 0) >= 80 
                            ? "outline" 
                            : "destructive"
                      }>
                        {Math.round(run.result?.summary?.averageOnTimePercentage || 0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        +{run.result?.summary?.gapFillWins || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${(run.result?.summary?.totalPredictedEarnings || 0).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={run.lockViolations === 0 ? "secondary" : "destructive"}>
                        {run.lockViolations === 0 ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> 0</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" /> {run.lockViolations}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {run.result?.solveTimeMs || 0}ms
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
