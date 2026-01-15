/**
 * OC-ADMIN-0: Admin Hub Overview
 * 
 * Central dashboard for managing OpCos, Brokers, Accounts, Rate Cards, and Driver Pay
 */

import { useState } from "react";
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

  const stats = [
    {
      title: "Operating Companies",
      value: opcos?.length || 0,
      icon: Building2,
      href: "/admin/opcos",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Brokers",
      value: brokers?.length || 0,
      icon: Briefcase,
      href: "/admin/brokers",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Broker Accounts",
      value: brokerAccounts?.length || 0,
      icon: CreditCard,
      href: "/admin/broker-accounts",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Rate Cards",
      value: rateCards?.length || 0,
      icon: DollarSign,
      href: "/admin/rate-cards",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Pay Defaults",
      value: payDefaults?.length || 0,
      icon: Users,
      href: "/admin/pay-defaults",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const quickLinks = [
    {
      title: "Operating Companies",
      description: "Manage Sahrawi, Metrix, and other operating companies",
      icon: Building2,
      href: "/admin/opcos",
    },
    {
      title: "Brokers",
      description: "Configure Modivcare, MTM, Access2Care, and other brokers",
      icon: Briefcase,
      href: "/admin/brokers",
    },
    {
      title: "Broker Accounts",
      description: "Set up OpCo-specific broker relationships",
      icon: CreditCard,
      href: "/admin/broker-accounts",
    },
    {
      title: "Billing Rate Cards",
      description: "Define what your company earns per trip type",
      icon: DollarSign,
      href: "/admin/rate-cards",
    },
    {
      title: "Driver Pay Defaults",
      description: "Set default pay rates for new drivers",
      icon: Users,
      href: "/admin/pay-defaults",
    },
    {
      title: "Audit Log",
      description: "View all changes made to admin settings",
      icon: History,
      href: "/admin/audit-log",
    },
  ];

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
            Manage operating companies, brokers, rate cards, and driver pay settings
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation(stat.href)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Card
            key={link.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation(link.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <link.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{link.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest changes to admin settings</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog && auditLog.length > 0 ? (
            <div className="space-y-3">
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
                      <p className="font-medium">
                        {entry.entity}
                        {entry.entityId ? ` #${entry.entityId}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">by {entry.actor}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          )}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setLocation("/admin/audit-log")}
          >
            View All Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
