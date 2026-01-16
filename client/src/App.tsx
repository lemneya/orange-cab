import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Main Dashboard
import Home from "./pages/Home";

// Fleet Management
import VehicleList from "./pages/fleet/VehicleList";
import VehicleDetail from "./pages/fleet/VehicleDetail";
import VehicleForm from "./pages/fleet/VehicleForm";
import VehicleStatus from "./pages/fleet/VehicleStatus";
import FleetDocuments from "./pages/fleet/FleetDocuments";

// Garage Services
import RepairOrders from "./pages/garage/RepairOrders";
import RepairOrderForm from "./pages/garage/RepairOrderForm";
import BayManagement from "./pages/garage/BayManagement";
import MechanicList from "./pages/garage/MechanicList";

// Human Resources
import DriverList from "./pages/hr/DriverList";
import DriverDetail from "./pages/hr/DriverDetail";
import DriverForm from "./pages/hr/DriverForm";
import Applications from "./pages/hr/Applications";
import Contracts from "./pages/hr/Contracts";
import Scheduling from "./pages/hr/Scheduling";

// Receptionist / Office Operations
import CallLog from "./pages/receptionist/CallLog";
import TicketsTolls from "./pages/receptionist/TicketsTolls";
import MailDocuments from "./pages/receptionist/MailDocuments";
import InsuranceManagement from "./pages/receptionist/InsuranceManagement";

// Dispatch
import TripManagement from "./pages/dispatch/TripManagement";
import DriverTracking from "./pages/dispatch/DriverTracking";
import DailyReport from "./pages/dispatch/DailyReport";

// Billing
import TripSubmission from "./pages/billing/TripSubmission";
import TimeAdjustments from "./pages/billing/TimeAdjustments";
import RevenueReports from "./pages/billing/RevenueReports";

// Payroll
import DriverPayments from "./pages/payroll/DriverPayments";
import EmployeePayroll from "./pages/payroll/EmployeePayroll";
import BillPayments from "./pages/payroll/BillPayments";

// Director of Operations
import OperationsOverview from "./pages/director/OperationsOverview";
import StaffMonitoring from "./pages/director/StaffMonitoring";
import PerformanceReports from "./pages/director/PerformanceReports";

// Files & GSuite
import FileManager from "./pages/files/FileManager";
import GSuiteIntegration from "./pages/files/GSuiteIntegration";

// IDS (Integral Dispatch System)
import IDSOverview from "./pages/ids/IDSOverview";
import ShadowRunsList from "./pages/ids/ShadowRunsList";
import ShadowRunDetail from "./pages/ids/ShadowRunDetail";
import NewShadowRun from "./pages/ids/NewShadowRun";
import IDSContracts from "./pages/ids/Contracts";
import ActualImport from "./pages/ids/ActualImport";
import ManifestImport from "./pages/ids/ManifestImport";

// Admin Hub
import AdminHub from "./pages/admin/AdminHub";
import OpcosPage from "./pages/admin/OpcosPage";
import BrokersPage from "./pages/admin/BrokersPage";
import BrokerAccountsPage from "./pages/admin/BrokerAccountsPage";
import RateCardsPage from "./pages/admin/RateCardsPage";
import PayDefaultsPage from "./pages/admin/PayDefaultsPage";
import DriverContractsPage from "./pages/admin/DriverContractsPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogPage from "./pages/admin/AuditLogPage";

// Reports
import ReportsList from "./pages/reports/ReportsList";
import ReportViewer from "./pages/reports/ReportViewer";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        {/* Main Dashboard */}
        <Route path="/" component={Home} />
        
        {/* Fleet Management */}
        <Route path="/fleet/vehicles" component={VehicleList} />
        <Route path="/fleet/vehicles/new" component={VehicleForm} />
        <Route path="/fleet/vehicles/:id" component={VehicleDetail} />
        <Route path="/fleet/vehicles/:id/edit" component={VehicleForm} />
        <Route path="/fleet/status" component={VehicleStatus} />
        <Route path="/fleet/documents" component={FleetDocuments} />
        
        {/* Garage Services */}
        <Route path="/garage/repairs" component={RepairOrders} />
        <Route path="/garage/repairs/new" component={RepairOrderForm} />
        <Route path="/garage/repairs/:id" component={RepairOrderForm} />
        <Route path="/garage/bays" component={BayManagement} />
        <Route path="/garage/mechanics" component={MechanicList} />
        
        {/* Human Resources */}
        <Route path="/hr/drivers" component={DriverList} />
        <Route path="/hr/drivers/new" component={DriverForm} />
        <Route path="/hr/drivers/:id" component={DriverDetail} />
        <Route path="/hr/drivers/:id/edit" component={DriverForm} />
        <Route path="/hr/applications" component={Applications} />
        <Route path="/hr/contracts" component={Contracts} />
        <Route path="/hr/scheduling" component={Scheduling} />
        
        {/* Receptionist / Office Operations */}
        <Route path="/receptionist/calls" component={CallLog} />
        <Route path="/receptionist/tickets" component={TicketsTolls} />
        <Route path="/receptionist/mail" component={MailDocuments} />
        <Route path="/receptionist/insurance" component={InsuranceManagement} />
        
        {/* Dispatch */}
        <Route path="/dispatch/trips" component={TripManagement} />
        <Route path="/dispatch/tracking" component={DriverTracking} />
        <Route path="/dispatch/report" component={DailyReport} />
        
        {/* Billing */}
        <Route path="/billing/submission" component={TripSubmission} />
        <Route path="/billing/adjustments" component={TimeAdjustments} />
        <Route path="/billing/revenue" component={RevenueReports} />
        
        {/* Payroll */}
        <Route path="/payroll/drivers" component={DriverPayments} />
        <Route path="/payroll/employees" component={EmployeePayroll} />
        <Route path="/payroll/bills" component={BillPayments} />
        
        {/* Director of Operations */}
        <Route path="/director/overview" component={OperationsOverview} />
        <Route path="/director/staff" component={StaffMonitoring} />
        <Route path="/director/performance" component={PerformanceReports} />
        
        {/* Files & GSuite */}
        <Route path="/files/manager" component={FileManager} />
        <Route path="/files/gsuite" component={GSuiteIntegration} />
        
        {/* IDS (Integral Dispatch System) */}
        <Route path="/ids" component={IDSOverview} />
        <Route path="/ids/shadow-runs" component={ShadowRunsList} />
        <Route path="/ids/shadow-runs/new" component={NewShadowRun} />
        <Route path="/ids/shadow-runs/:id" component={ShadowRunDetail} />
        <Route path="/ids/contracts" component={IDSContracts} />
        <Route path="/ids/actual-import" component={ActualImport} />
        <Route path="/ids/manifest-import" component={ManifestImport} />
        
        {/* Admin Hub */}
        <Route path="/admin" component={AdminHub} />
        <Route path="/admin/opcos" component={OpcosPage} />
        <Route path="/admin/brokers" component={BrokersPage} />
        <Route path="/admin/broker-accounts" component={BrokerAccountsPage} />
        <Route path="/admin/rate-cards" component={RateCardsPage} />
        <Route path="/admin/pay-defaults" component={PayDefaultsPage} />
        <Route path="/admin/driver-contracts" component={DriverContractsPage} />
        <Route path="/admin/users" component={UsersPage} />
        <Route path="/admin/audit-log" component={AuditLogPage} />
        
        {/* Reports */}
        <Route path="/reports" component={ReportsList} />
        <Route path="/reports/runs/:id" component={ReportViewer} />
        
        {/* Fallback */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
