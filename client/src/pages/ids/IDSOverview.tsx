import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  Play, 
  History, 
  FileText, 
  Shield, 
  TrendingUp,
  Users,
  Truck,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Upload
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import IDSContextSwitcher, { OpcoId, BrokerAccountId } from "@/components/ids/IDSContextSwitcher";

export default function IDSOverview() {
  const [, setLocation] = useLocation();
  
  // Partition filter state
  const [selectedOpco, setSelectedOpco] = useState<OpcoId>(null);
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<BrokerAccountId>(null);
  
  // Get IDS status
  const { data: status, isLoading: statusLoading } = trpc.ids.getStatus.useQuery();
  const { data: config } = trpc.ids.getConfig.useQuery();
  const { data: shadowRuns } = trpc.ids.getShadowRuns.useQuery({ limit: 5 });

  // Filter runs by partition
  const recentRuns = (shadowRuns || []).filter(run => {
    const matchesOpco = !selectedOpco || run.opcoId === selectedOpco;
    const matchesBrokerAccount = !selectedBrokerAccount || run.brokerAccountId === selectedBrokerAccount;
    return matchesOpco && matchesBrokerAccount;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            IDS - Integral Dispatch System
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimize trip assignments, predict earnings, and improve dispatch efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/ids/contracts")}>
            <FileText className="mr-2 h-4 w-4" />
            View Contracts
          </Button>
          <Button onClick={() => setLocation("/ids/shadow-runs/new")}>
            <Upload className="mr-2 h-4 w-4" />
            Run Shadow Solve
          </Button>
        </div>
      </div>

      {/* Context Switcher */}
      <IDSContextSwitcher
        opcoId={selectedOpco}
        brokerAccountId={selectedBrokerAccount}
        onOpcoChange={setSelectedOpco}
        onBrokerAccountChange={setSelectedBrokerAccount}
        showAll={true}
        compact={true}
      />

      {/* Status Alert */}
      {status && (
        <Alert variant={status.enabled ? (status.shadowMode ? "default" : "destructive") : "default"}>
          {status.enabled ? (
            status.shadowMode ? (
              <Shield className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle className="flex items-center gap-2">
            IDS Status: 
            <Badge variant={status.enabled ? (status.shadowMode ? "secondary" : "destructive") : "outline"}>
              {status.enabled ? (status.shadowMode ? "Shadow Mode" : "LIVE") : "Disabled"}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shadow Runs</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              Total optimization runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg On-Time %</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentRuns.length > 0 
                ? Math.round(recentRuns.reduce((sum, r) => sum + (r.result?.summary?.averageOnTimePercentage || 0), 0) / recentRuns.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Predicted on-time performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gap-Fill Wins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentRuns.reduce((sum, r) => sum + (r.result?.summary?.gapFillWins || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Empty seats captured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lock Violations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentRuns.reduce((sum, r) => sum + (r.lockViolations || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Must be 0 for production
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Shadow Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Shadow Runs
            </CardTitle>
            <CardDescription>
              Latest optimization results (shadow mode only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shadow runs yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setLocation("/ids/shadow-runs/new")}
                >
                  Run Your First Shadow Solve
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRuns.map((run) => (
                  <div 
                    key={run.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/ids/shadow-runs/${run.id}`)}
                  >
                    <div>
                      <div className="font-medium">{run.runDate}</div>
                      <div className="text-sm text-muted-foreground">
                        {run.inputTripsCount} trips • {run.result?.summary?.assignedTrips || 0} assigned
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={run.lockViolations === 0 ? "secondary" : "destructive"}>
                        {run.lockViolations === 0 ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Clean</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" /> Violations</>
                        )}
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        ${(run.result?.summary?.totalPredictedEarnings || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setLocation("/ids/shadow-runs")}
                >
                  View All Shadow Runs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common IDS operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setLocation("/ids/shadow-runs/new")}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV & Run Shadow Solve
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setLocation("/ids/shadow-runs")}
            >
              <History className="mr-2 h-4 w-4" />
              View Shadow Run History
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setLocation("/ids/contracts")}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Data Contracts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How IDS Works */}
      <Card>
        <CardHeader>
          <CardTitle>How IDS Works</CardTitle>
          <CardDescription>
            Understanding the optimization process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Template Locks</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Veteran drivers keep their regular routes. IDS respects "hard locks" 
                and only moves trips with "soft locks" when beneficial.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Gap-Fill Optimization</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                IDS finds empty seats in existing routes and fills them with 
                compatible trips, maximizing vehicle utilization.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Earnings Prediction</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Before committing schedules, IDS predicts driver pay based on 
                your pay rules, helping balance workload fairly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
