import { useState } from "react";
import { Link } from "wouter";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";

interface Pack {
  id: string;
  name: string;
  opcoName: string;
  brokerAccountName: string | null;
  startDate: string;
  endDate: string;
  style: "INTERNAL" | "CLIENT";
  status: "READY" | "GENERATING" | "FAILED";
  createdBy: string;
  createdAt: string;
}

export default function PacksList() {
  // Mock data
  const [packs] = useState<Pack[]>([
    {
      id: "1",
      name: "Weekly Ops Pack",
      opcoName: "Sahrawi Transportation",
      brokerAccountName: "Modivcare-Sahrawi",
      startDate: "2026-01-09",
      endDate: "2026-01-15",
      style: "INTERNAL",
      status: "READY",
      createdBy: "Demo Admin",
      createdAt: "2026-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Client Proof Pack",
      opcoName: "Metrix Medical Transport",
      brokerAccountName: "Modivcare-Metrix",
      startDate: "2026-01-09",
      endDate: "2026-01-15",
      style: "CLIENT",
      status: "READY",
      createdBy: "Demo Admin",
      createdAt: "2026-01-14T14:00:00Z",
    },
    {
      id: "3",
      name: "Weekly Ops Pack",
      opcoName: "Sahrawi Transportation",
      brokerAccountName: null,
      startDate: "2026-01-02",
      endDate: "2026-01-08",
      style: "INTERNAL",
      status: "GENERATING",
      createdBy: "Demo Admin",
      createdAt: "2026-01-08T09:00:00Z",
    },
  ]);

  const getStatusBadge = (status: Pack["status"]) => {
    switch (status) {
      case "READY":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
            <CheckCircle className="w-3 h-3" /> Ready
          </span>
        );
      case "GENERATING":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
            <Clock className="w-3 h-3" /> Generating
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Packs</h1>
            <p className="text-gray-500">Generated proof packs for internal review and client sharing</p>
          </div>
          <Link
            to="/owner"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Generate New Pack
          </Link>
        </div>

        {/* Packs Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Pack Name</th>
                <th className="text-left p-4 font-medium text-gray-700">Scope</th>
                <th className="text-left p-4 font-medium text-gray-700">Date Range</th>
                <th className="text-left p-4 font-medium text-gray-700">Style</th>
                <th className="text-center p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Created</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{pack.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">{pack.opcoName}</div>
                        {pack.brokerAccountName && (
                          <div className="text-xs text-gray-500">{pack.brokerAccountName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {pack.startDate} — {pack.endDate}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      pack.style === "INTERNAL" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {pack.style}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(pack.status)}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600">{pack.createdBy}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(pack.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/owner/packs/${pack.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      {pack.status === "READY" && (
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
