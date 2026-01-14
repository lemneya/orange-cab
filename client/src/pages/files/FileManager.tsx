import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  FolderOpen, 
  Search, 
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Folder,
  MoreVertical,
  Grid,
  List,
  Plus,
  ExternalLink,
  Cloud
} from "lucide-react";
import { useState } from "react";

export default function FileManager() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentFolder, setCurrentFolder] = useState<string>("root");

  // Mock data - file structure
  const folders = [
    { id: "contracts", name: "Driver Contracts", itemCount: 45, lastModified: "2026-01-12" },
    { id: "insurance", name: "Insurance Documents", itemCount: 68, lastModified: "2026-01-10" },
    { id: "vehicle-docs", name: "Vehicle Documents", itemCount: 120, lastModified: "2026-01-11" },
    { id: "training", name: "Training Materials", itemCount: 23, lastModified: "2026-01-08" },
    { id: "reports", name: "Reports", itemCount: 156, lastModified: "2026-01-12" },
    { id: "templates", name: "Templates", itemCount: 18, lastModified: "2025-12-15" },
  ];

  const recentFiles = [
    { id: 1, name: "Driver_Contract_Template.docx", type: "doc", size: "45 KB", modified: "2026-01-12 10:30 AM", folder: "contracts", sharedWith: 3 },
    { id: 2, name: "Fleet_Insurance_Policy_2026.pdf", type: "pdf", size: "2.3 MB", modified: "2026-01-10 02:15 PM", folder: "insurance", sharedWith: 5 },
    { id: 3, name: "Weekly_Revenue_Report.xlsx", type: "xlsx", size: "156 KB", modified: "2026-01-12 09:00 AM", folder: "reports", sharedWith: 2 },
    { id: 4, name: "Vehicle_1015_Inspection.pdf", type: "pdf", size: "890 KB", modified: "2026-01-11 04:45 PM", folder: "vehicle-docs", sharedWith: 1 },
    { id: 5, name: "Driver_Training_Manual.pdf", type: "pdf", size: "5.6 MB", modified: "2026-01-08 11:20 AM", folder: "training", sharedWith: 40 },
    { id: 6, name: "Payroll_Summary_Jan_W2.xlsx", type: "xlsx", size: "89 KB", modified: "2026-01-12 08:30 AM", folder: "reports", sharedWith: 2 },
  ];

  const gsuiteIntegration = {
    connected: true,
    email: "operations@orangecab.com",
    storage: { used: 12.5, total: 30 },
    syncStatus: "synced"
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case "jpg":
      case "png":
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground">
            Central hub for all company documents and files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* GSuite Integration Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white shadow-sm">
                <Cloud className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Google Workspace Connected</h3>
                <p className="text-sm text-muted-foreground">{gsuiteIntegration.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="font-semibold">{gsuiteIntegration.storage.used} GB / {gsuiteIntegration.storage.total} GB</p>
              </div>
              <Badge variant="default" className="bg-green-500">
                {gsuiteIntegration.syncStatus === "synced" ? "Synced" : "Syncing..."}
              </Badge>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Drive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files and folders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">Documents</SelectItem>
                <SelectItem value="xlsx">Spreadsheets</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-amber-500" />
            Folders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {folders.map((folder) => (
              <div 
                key={folder.id}
                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <Folder className="h-10 w-10 text-amber-500 mb-2" />
                <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                <p className="text-xs text-muted-foreground">{folder.itemCount} items</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Recently accessed and modified files</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Shared With</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFiles.map((file) => (
                <TableRow key={file.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{folders.find(f => f.id === file.folder)?.name}</Badge>
                  </TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.modified}</TableCell>
                  <TableCell>
                    {file.sharedWith > 0 && (
                      <Badge variant="secondary">{file.sharedWith} people</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access Templates</CardTitle>
          <CardDescription>Frequently used document templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <span>Driver Contract</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-8 w-8 text-red-500" />
              <span>Vehicle Inspection</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
              <span>Expense Report</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <span>Incident Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
