/**
 * OC-ADMIN-0: Admin Hub Overview
 * 
 * Central dashboard organized into sections:
 * - Organization: OpCos, Brokers, Broker Accounts
 * - Rates: Billing Rate Cards, Rate Rules
 * - Driver Pay: Default Plans, Driver Contracts
 * - Users & Roles: Role assignments, RBAC
 */

import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  CreditCard,
  Users,
  DollarSign,
  Settings,
  ArrowRight,
  Shield,
  History,
  UserCog,
  FileText,
  Wallet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminHub() {
  const [, setLocation] = useLocation();

  // Fetch summary data
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokers } = trpc.admin.getBrokers.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();
  const { data: rateCards } = trpc.admin.getRateCards.useQuery();
  const { data: payDefaults } = trpc.admin.getPayDefaults.useQuery();
  const { data: auditLog } = trpc.admin.getAuditLog.useQuery({ limit: 5 });

  // Organized sections
  const sections = [
    {
      title: "Organization",
      description: "Manage companies, brokers, and account relationships",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      items: [
        {
          title: "Operating Companies",
          description: "Sahrawi, Metrix, and other OpCos",
          count: opcos?.length || 0,
          href: "/admin/opcos",
          icon: Building2,
        },
        {
          title: "Brokers",
          description: "Modivcare, MTM, Access2Care",
          count: brokers?.length || 0,
          href: "/admin/brokers",
          icon: Briefcase,
        },
        {
          title: "Broker Accounts",
          description: "OpCo-specific broker relationships",
          count: brokerAccounts?.length || 0,
          href: "/admin/broker-accounts",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "Rates",
      description: "Billing rate cards and pricing rules",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      items: [
        {
          title: "Billing Rate Cards",
          description: "What your company earns per trip",
          count: rateCards?.length || 0,
          href: "/admin/rate-cards",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "Driver Pay",
      description: "Pay plans, contracts, and overrides",
      icon: Wallet,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      items: [
        {
          title: "Default Pay Plans",
          description: "Default rates for new drivers by OpCo",
          count: payDefaults?.length || 0,
          href: "/admin/pay-defaults",
          icon: FileText,
        },
        {
          title: "Driver Contracts",
          description: "Per-driver pay overrides",
          count: 0, // TODO: Add driver contracts query
          href: "/admin/driver-contracts",
          icon: Users,
        },
      ],
    },
    {
      title: "Users & Roles",
      description: "Access control and permissions",
      icon: UserCog,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      items: [
        {
          title: "User Roles",
          description: "Assign roles to users",
          count: 0, // TODO: Add users query
          href: "/admin/users",
          icon: UserCog,
        },
        {
          title: "Audit Log",
          description: "View all admin changes",
          count: auditLog?.length || 0,
          href: "/admin/audit-log",
          icon: History,
        },
      ],
    },
  ];

  // Stats summary
  const totalStats = {
    opcos: opcos?.length || 0,
    brokers: brokers?.length || 0,
    accounts: brokerAccounts?.length || 0,
    rateCards: rateCards?.length || 0,
    payPlans: payDefaults?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Admin Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Central configuration for organization, rates, and driver pay
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{totalStats.opcos}</span>
          <span className="text-muted-foreground text-sm">OpCos</span>
        </div>
        <div className="h-4 w-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-green-600" />
          <span className="font-medium">{totalStats.brokers}</span>
          <span className="text-muted-foreground text-sm">Brokers</span>
        </div>
        <div className="h-4 w-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{totalStats.accounts}</span>
          <span className="text-muted-foreground text-sm">Accounts</span>
        </div>
        <div className="h-4 w-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber-600" />
          <span className="font-medium">{totalStats.rateCards}</span>
          <span className="text-muted-foreground text-sm">Rate Cards</span>
        </div>
        <div className="h-4 w-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-red-600" />
          <span className="font-medium">{totalStats.payPlans}</span>
          <span className="text-muted-foreground text-sm">Pay Plans</span>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${section.bgColor}`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setLocation(item.href)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <History className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest changes to admin settings</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/audit-log")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {auditLog && auditLog.length > 0 ? (
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        entry.action === "CREATE"
                          ? "default"
                          : entry.action === "UPDATE"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {entry.action}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">
                        {entry.entity}
                        {entry.entityId ? ` #${entry.entityId}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">by {entry.actor}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
