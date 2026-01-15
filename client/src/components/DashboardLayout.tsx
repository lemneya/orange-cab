import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  Car, 
  LogOut, 
  PanelLeft, 
  Users, 
  Wrench,
  Phone,
  Navigation,
  Receipt,
  DollarSign,
  Shield,
  FolderOpen,
  UserPlus,
  FileText,
  Calendar,
  Truck,
  AlertTriangle,
  ClipboardList,
  Mail,
  CreditCard,
  Building2,
  MapPin,
  BarChart3,
  Clock,
  Activity,
  Cloud,
  Brain,
  Settings,
  History
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Navigation structure organized by modules
const navigationGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Fleet Management",
    items: [
      { icon: Car, label: "Vehicles", path: "/fleet/vehicles" },
      { icon: Truck, label: "Vehicle Status", path: "/fleet/status" },
      { icon: FileText, label: "Documents", path: "/fleet/documents" },
    ],
  },
  {
    label: "Garage Services",
    items: [
      { icon: Wrench, label: "Repair Orders", path: "/garage/repairs" },
      { icon: Building2, label: "Bay Management", path: "/garage/bays" },
      { icon: Users, label: "Mechanics", path: "/garage/mechanics" },
    ],
  },
  {
    label: "Human Resources",
    items: [
      { icon: Users, label: "Drivers", path: "/hr/drivers" },
      { icon: UserPlus, label: "Applications", path: "/hr/applications" },
      { icon: FileText, label: "Contracts", path: "/hr/contracts" },
      { icon: Calendar, label: "Scheduling", path: "/hr/scheduling" },
    ],
  },
  {
    label: "Receptionist",
    items: [
      { icon: Phone, label: "Call Log", path: "/receptionist/calls" },
      { icon: AlertTriangle, label: "Tickets & Tolls", path: "/receptionist/tickets" },
      { icon: Mail, label: "Mail & Documents", path: "/receptionist/mail" },
      { icon: Shield, label: "Insurance", path: "/receptionist/insurance" },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { icon: Navigation, label: "Trip Management", path: "/dispatch/trips" },
      { icon: MapPin, label: "Driver Tracking", path: "/dispatch/tracking" },
      { icon: ClipboardList, label: "Daily Report", path: "/dispatch/report" },
    ],
  },
  {
    label: "Billing",
    items: [
      { icon: Receipt, label: "Trip Submission", path: "/billing/submission" },
      { icon: Clock, label: "Time Adjustments", path: "/billing/adjustments" },
      { icon: BarChart3, label: "Revenue Reports", path: "/billing/revenue" },
    ],
  },
  {
    label: "Payroll",
    items: [
      { icon: DollarSign, label: "Driver Payments", path: "/payroll/drivers" },
      { icon: Users, label: "Employee Payroll", path: "/payroll/employees" },
      { icon: CreditCard, label: "Bill Payments", path: "/payroll/bills" },
    ],
  },
  {
    label: "Director",
    items: [
      { icon: Activity, label: "Operations Overview", path: "/director/overview" },
      { icon: Users, label: "Staff Monitoring", path: "/director/staff" },
      { icon: BarChart3, label: "Performance", path: "/director/performance" },
    ],
  },
  {
    label: "Files & GSuite",
    items: [
      { icon: FolderOpen, label: "File Manager", path: "/files/manager" },
      { icon: Cloud, label: "GSuite Integration", path: "/files/gsuite" },
    ],
  },
  {
    label: "IDS Optimization",
    items: [
      { icon: Brain, label: "IDS Overview", path: "/ids" },
      { icon: Activity, label: "Shadow Runs", path: "/ids/shadow-runs" },
      { icon: FileText, label: "Data Contracts", path: "/ids/contracts" },
    ],
  },
  {
    label: "Admin Hub",
    items: [
      { icon: Settings, label: "Admin Overview", path: "/admin" },
      { icon: Building2, label: "Operating Companies", path: "/admin/opcos" },
      { icon: Users, label: "Brokers", path: "/admin/brokers" },
      { icon: CreditCard, label: "Broker Accounts", path: "/admin/broker-accounts" },
      { icon: DollarSign, label: "Rate Cards", path: "/admin/rate-cards" },
      { icon: Receipt, label: "Pay Defaults", path: "/admin/pay-defaults" },
      { icon: History, label: "Audit Log", path: "/admin/audit-log" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-orange-500 flex items-center justify-center">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Orange Cab NEMT
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Non-Emergency Medical Transportation Fleet Management System
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-orange-500 hover:bg-orange-600"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Find active menu item for mobile header
  const activeMenuItem = navigationGroups
    .flatMap(g => g.items)
    .find(item => 
      item.path === "/" ? location === "/" : location.startsWith(item.path)
    );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold tracking-tight truncate text-sm">
                      Orange Cab
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      NEMT Operations
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {navigationGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => {
                      const isActive = item.path === "/" 
                        ? location === "/" 
                        : location.startsWith(item.path);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-9 transition-all font-normal text-sm`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-orange-500" : ""}`}
                            />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-orange-100 text-orange-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-orange-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
