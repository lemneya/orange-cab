import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  Calendar, 
  FileText, 
  Cloud,
  CheckCircle,
  RefreshCw,
  Settings,
  Users,
  MessageSquare,
  Video,
  ExternalLink,
  Shield
} from "lucide-react";
import { useState } from "react";

export default function GSuiteIntegration() {
  const [autoSync, setAutoSync] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);

  // Mock data - GSuite integration status
  const integrationStatus = {
    connected: true,
    lastSync: "2026-01-13 09:45 AM",
    organization: "Orange Cab Transportation",
    domain: "orangecab.com",
    adminEmail: "admin@orangecab.com"
  };

  const services = [
    {
      name: "Gmail",
      icon: Mail,
      status: "connected",
      description: "Email communication for all staff",
      accounts: 8,
      color: "text-red-500"
    },
    {
      name: "Google Drive",
      icon: Cloud,
      status: "connected",
      description: "File storage and sharing",
      storage: { used: 12.5, total: 30 },
      color: "text-blue-500"
    },
    {
      name: "Google Calendar",
      icon: Calendar,
      status: "connected",
      description: "Scheduling and appointments",
      calendars: 5,
      color: "text-green-500"
    },
    {
      name: "Google Docs",
      icon: FileText,
      status: "connected",
      description: "Document creation and collaboration",
      documents: 156,
      color: "text-blue-600"
    },
    {
      name: "Google Meet",
      icon: Video,
      status: "connected",
      description: "Video conferencing",
      meetings: 12,
      color: "text-green-600"
    },
    {
      name: "Google Chat",
      icon: MessageSquare,
      status: "connected",
      description: "Team messaging",
      spaces: 4,
      color: "text-emerald-500"
    },
  ];

  const teamMembers = [
    { name: "James Anderson", email: "james@orangecab.com", role: "Dispatcher", status: "active" },
    { name: "Maria Garcia", email: "maria@orangecab.com", role: "Receptionist", status: "active" },
    { name: "Robert Thompson", email: "robert@orangecab.com", role: "Lead Mechanic", status: "active" },
    { name: "William Chen", email: "william@orangecab.com", role: "Billing Specialist", status: "active" },
    { name: "Lisa Johnson", email: "lisa@orangecab.com", role: "Payroll Agent", status: "active" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Google Workspace Integration</h1>
          <p className="text-muted-foreground">
            Manage GSuite connection and synchronization settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Admin Console
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-white shadow-sm">
                <svg className="h-10 w-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{integrationStatus.organization}</h3>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{integrationStatus.domain}</p>
                <p className="text-xs text-muted-foreground mt-1">Last synced: {integrationStatus.lastSync}</p>
              </div>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.name}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <service.icon className={`h-8 w-8 ${service.color}`} />
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="mt-4 pt-4 border-t">
                {service.storage ? (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Storage</span>
                      <span>{service.storage.used} GB / {service.storage.total} GB</span>
                    </div>
                    <Progress value={(service.storage.used / service.storage.total) * 100} className="h-2" />
                  </div>
                ) : service.accounts ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Accounts</span>
                    <span className="font-medium">{service.accounts}</span>
                  </div>
                ) : service.calendars ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Calendars</span>
                    <span className="font-medium">{service.calendars}</span>
                  </div>
                ) : service.documents ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">{service.documents}</span>
                  </div>
                ) : service.meetings ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">{service.meetings} meetings</span>
                  </div>
                ) : service.spaces ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chat Spaces</span>
                    <span className="font-medium">{service.spaces}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronization Settings</CardTitle>
          <CardDescription>Configure how data syncs between Orange Cab and Google Workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Sync Files</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync files between the dashboard and Google Drive
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send system notifications via Gmail
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Calendar Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Sync scheduling and appointments with Google Calendar
                </p>
              </div>
              <Switch checked={calendarSync} onCheckedChange={setCalendarSync} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>Staff members with Google Workspace accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-medium text-orange-600">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{member.role}</Badge>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="font-medium">2FA Enabled</h4>
              <p className="text-sm text-muted-foreground">All accounts have two-factor authentication</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="font-medium">Data Encryption</h4>
              <p className="text-sm text-muted-foreground">All data encrypted at rest and in transit</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="font-medium">HIPAA Compliant</h4>
              <p className="text-sm text-muted-foreground">Meeting healthcare data requirements</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
