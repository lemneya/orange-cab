// IDS Shadow Run Map - Dispatcher View
// Route Graph Visualization with numbered nodes, multiload ribbons

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// ============================================
// TYPES
// ============================================

interface Stop {
  id: string;
  stopNumber: number;
  stopType: "PU" | "DO";
  tripId: string;
  mobilityType: "STD" | "WCH" | "STRETCHER";
  requestedWindow: { start: string; end: string } | null;
  isWillCall: boolean;
  coordinates: [number, number]; // [lng, lat]
  cityZip: string;
  miles: number;
  onboardDelta: number;
  onboardAfter: number;
  status: "planned" | "completed" | "current";
  eta?: string;
}

interface Vehicle {
  id: string;
  unit: string;
  driverId: string;
  driverName: string;
  isWCH: boolean;
  status: "ENROUTE" | "ARRIVED" | "ONBOARD" | "IDLE" | "OFFSHIFT";
  onboardCount: number;
  location: [number, number]; // [lng, lat]
  nextStopId: string | null;
  nextStopEta: string | null;
  pressureLevel: number; // 0-100, how close to window deadline
  stops: Stop[];
  routeCoordinates: [number, number][];
  riskLevel: "low" | "medium" | "high";
}

interface AlternativeRoute {
  id: string;
  vehicleId: string;
  label: string;
  onTimeChange: number;
  deadheadChange: number;
  coordinates: [number, number][];
}

// ============================================
// MOCK DATA GENERATOR
// ============================================

function generateMockData(shadowRunId: string): {
  vehicles: Vehicle[];
  alternatives: AlternativeRoute[];
  kpis: { onTimeRisk: number; deadhead: number; unassigned: number; lockViolations: number };
} {
  // Generate realistic mock data for demo
  const baseCoords: [number, number] = [-74.006, 40.7128]; // NYC area

  const vehicles: Vehicle[] = [];
  const alternatives: AlternativeRoute[] = [];

  const driverNames = [
    "John Smith",
    "Maria Garcia",
    "James Wilson",
    "Sarah Johnson",
    "Michael Brown",
    "Emily Davis",
    "Robert Martinez",
    "Lisa Anderson",
  ];

  for (let v = 0; v < 8; v++) {
    const stops: Stop[] = [];
    const routeCoords: [number, number][] = [];
    const numStops = 6 + Math.floor(Math.random() * 6);
    let onboard = 0;

    // Vehicle starting location
    const vLng = baseCoords[0] + (Math.random() - 0.5) * 0.2;
    const vLat = baseCoords[1] + (Math.random() - 0.5) * 0.15;
    routeCoords.push([vLng, vLat]);

    for (let s = 0; s < numStops; s++) {
      const isPickup = onboard < 3 && (Math.random() > 0.4 || onboard === 0);
      const delta = isPickup ? 1 : -1;
      onboard = Math.max(0, onboard + delta);

      const sLng = vLng + (Math.random() - 0.5) * 0.1 + s * 0.01;
      const sLat = vLat + (Math.random() - 0.5) * 0.08 + s * 0.008;
      routeCoords.push([sLng, sLat]);

      const hour = 6 + Math.floor(s * 1.5);
      const minute = Math.floor(Math.random() * 60);

      stops.push({
        id: `${v}-${s}`,
        stopNumber: s + 1,
        stopType: isPickup ? "PU" : "DO",
        tripId: `T${1000 + v * 100 + s}`,
        mobilityType: Math.random() > 0.8 ? "WCH" : "STD",
        requestedWindow: {
          start: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          end: `${hour.toString().padStart(2, "0")}:${(minute + 15).toString().padStart(2, "0")}`,
        },
        isWillCall: Math.random() > 0.9,
        coordinates: [sLng, sLat],
        cityZip: `New York, ${10001 + Math.floor(Math.random() * 100)}`,
        miles: 1 + Math.random() * 5,
        onboardDelta: delta,
        onboardAfter: onboard,
        status: s < 2 ? "completed" : s === 2 ? "current" : "planned",
        eta:
          s >= 2
            ? `${(hour + Math.floor(Math.random() * 2)).toString().padStart(2, "0")}:${Math.floor(Math.random() * 60)
                .toString()
                .padStart(2, "0")}`
            : undefined,
      });
    }

    const currentOnboard = stops.filter((s) => s.status === "completed" && s.stopType === "PU").length -
      stops.filter((s) => s.status === "completed" && s.stopType === "DO").length;

    vehicles.push({
      id: `V${v + 1}`,
      unit: `V${(v + 1).toString().padStart(3, "0")}`,
      driverId: `D${v + 1}`,
      driverName: driverNames[v],
      isWCH: v % 3 === 0,
      status: v === 0 ? "ENROUTE" : v === 1 ? "ARRIVED" : v === 7 ? "IDLE" : "ONBOARD",
      onboardCount: Math.max(0, currentOnboard),
      location: [vLng, vLat],
      nextStopId: stops.find((s) => s.status === "current")?.id || null,
      nextStopEta: stops.find((s) => s.status === "current")?.eta || null,
      pressureLevel: Math.floor(Math.random() * 100),
      stops,
      routeCoordinates: routeCoords,
      riskLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
    });

    // Add alternative routes for first few vehicles
    if (v < 3) {
      alternatives.push({
        id: `alt-${v}`,
        vehicleId: `V${v + 1}`,
        label: `Option B: +${(Math.random() * 3).toFixed(1)}% on-time, -${(Math.random() * 5).toFixed(1)} mi`,
        onTimeChange: Math.random() * 3,
        deadheadChange: -Math.random() * 5,
        coordinates: routeCoords.map(([lng, lat]) => [lng + 0.005, lat + 0.003] as [number, number]),
      });
    }
  }

  return {
    vehicles,
    alternatives,
    kpis: {
      onTimeRisk: vehicles.filter((v) => v.riskLevel === "high").length,
      deadhead: Math.floor(50 + Math.random() * 100),
      unassigned: Math.floor(Math.random() * 5),
      lockViolations: Math.floor(Math.random() * 3),
    },
  };
}

// ============================================
// COMPONENTS
// ============================================

function KPICard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  tone: "red" | "amber" | "green" | "slate";
  active: boolean;
  onClick: () => void;
}) {
  const tones = {
    red: "border-red-300 bg-red-50",
    amber: "border-amber-300 bg-amber-50",
    green: "border-green-300 bg-green-50",
    slate: "border-slate-300 bg-slate-50",
  };
  const activeTones = {
    red: "border-red-500 bg-red-100 ring-2 ring-red-200",
    amber: "border-amber-500 bg-amber-100 ring-2 ring-amber-200",
    green: "border-green-500 bg-green-100 ring-2 ring-green-200",
    slate: "border-slate-500 bg-slate-100 ring-2 ring-slate-200",
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg border transition-all ${active ? activeTones[tone] : tones[tone]} hover:shadow-md`}
    >
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </button>
  );
}

function VehicleMarker({
  vehicle,
  isSelected,
  onClick,
}: {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColors = {
    ENROUTE: "bg-blue-500",
    ARRIVED: "bg-green-500",
    ONBOARD: "bg-purple-500",
    IDLE: "bg-slate-400",
    OFFSHIFT: "bg-slate-300",
  };

  const riskRings = {
    low: "ring-green-300",
    medium: "ring-amber-300",
    high: "ring-red-400 animate-pulse",
  };

  return (
    <Marker longitude={vehicle.location[0]} latitude={vehicle.location[1]} anchor="center">
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full ${statusColors[vehicle.status]} text-white font-bold text-xs shadow-lg ring-4 ${riskRings[vehicle.riskLevel]} ${isSelected ? "scale-125 z-50" : ""} transition-transform`}
        style={{
          boxShadow: isSelected ? "0 0 20px rgba(0,0,0,0.3)" : undefined,
        }}
      >
        {vehicle.unit}
        {vehicle.isWCH && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] px-1 rounded">WCH</span>
        )}
        {vehicle.onboardCount > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[8px] px-1 rounded">
            {vehicle.onboardCount}
          </span>
        )}
        {/* Pressure ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={`${vehicle.pressureLevel} 100`}
            strokeLinecap="round"
          />
        </svg>
      </button>
    </Marker>
  );
}

function StopMarker({
  stop,
  isHighlighted,
  onClick,
}: {
  stop: Stop;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const bgColor =
    stop.status === "completed"
      ? "bg-slate-300"
      : stop.status === "current"
        ? "bg-orange-500"
        : "bg-white border-2 border-slate-400";

  const textColor =
    stop.status === "completed" ? "text-slate-500" : stop.status === "current" ? "text-white" : "text-slate-700";

  return (
    <Marker longitude={stop.coordinates[0]} latitude={stop.coordinates[1]} anchor="center">
      <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center w-8 h-8 rounded-full ${bgColor} ${textColor} font-bold text-sm shadow-md ${isHighlighted ? "scale-125 ring-2 ring-orange-400" : ""} transition-transform`}
      >
        <span className="text-xs">{stop.stopNumber}</span>
        <span className="absolute -bottom-4 text-[10px] bg-white px-1 rounded shadow">
          {stop.stopType}
        </span>
        {stop.mobilityType === "WCH" && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[6px] px-0.5 rounded">W</span>
        )}
        {/* Onboard indicator */}
        {stop.onboardAfter > 0 && (
          <span className="absolute -bottom-6 text-[8px] text-slate-500">ONB {stop.onboardAfter}</span>
        )}
      </button>
    </Marker>
  );
}

// ============================================
// VEHICLE DRAWER
// ============================================

function VehicleDrawer({
  vehicle,
  onClose,
  onStopClick,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onStopClick: (stop: Stop) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);

  const nextStop = vehicle.stops.find((s) => s.status === "current");
  const remainingStops = vehicle.stops.filter((s) => s.status === "planned").length;

  return (
    <div className="w-[420px] h-full bg-white border-l shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{vehicle.unit}</span>
            {vehicle.isWCH && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">WCH</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <div className="text-sm text-slate-600 mt-1">{vehicle.driverName}</div>
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Message Driver</button>
          <button className="px-3 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Create Lock</button>
          <button className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
            Apply Swap
          </button>
        </div>
      </div>

      {/* Mini KPI chips */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500">Next in</div>
            <div className="font-bold">{nextStop ? "12 min" : "-"}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500">Window</div>
            <div className="font-bold text-sm">
              {nextStop?.requestedWindow ? `${nextStop.requestedWindow.start}` : "-"}
            </div>
          </div>
          <div
            className={`p-2 rounded ${vehicle.riskLevel === "high" ? "bg-red-50" : vehicle.riskLevel === "medium" ? "bg-amber-50" : "bg-green-50"}`}
          >
            <div className="text-xs text-slate-500">Risk</div>
            <div className="font-bold capitalize">{vehicle.riskLevel}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-center">
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500">Onboard</div>
            <div className="font-bold">{vehicle.onboardCount}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500">Remaining</div>
            <div className="font-bold">{remainingStops}</div>
          </div>
        </div>
      </div>

      {/* Route Stepper */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Route Sequence</h3>
        <div className="space-y-2">
          {vehicle.stops.map((stop) => (
            <button
              key={stop.id}
              onClick={() => onStopClick(stop)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                stop.status === "completed"
                  ? "bg-slate-50 border-slate-200 opacity-60"
                  : stop.status === "current"
                    ? "bg-orange-50 border-orange-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  stop.status === "completed"
                    ? "bg-slate-300 text-slate-600"
                    : stop.status === "current"
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-700"
                }`}
              >
                {stop.stopNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${stop.stopType === "PU" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {stop.stopType}
                  </span>
                  <span className="text-sm font-medium">{stop.tripId}</span>
                  {stop.mobilityType === "WCH" && (
                    <span className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">WCH</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stop.requestedWindow
                    ? `${stop.requestedWindow.start} - ${stop.requestedWindow.end}`
                    : "Will Call"}
                  {stop.eta && <span className="ml-2 text-orange-600">ETA: {stop.eta}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{stop.cityZip}</div>
                <div className="text-xs text-slate-400 mt-0.5">ONB {stop.onboardAfter}</div>
              </div>
              <div className="text-xs text-slate-400">
                {stop.status === "completed" ? "✓" : stop.status === "current" ? "→" : "○"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Why this order */}
      <div className="p-4 border-t">
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-800"
        >
          <span>Why this order?</span>
          <span>{showWhy ? "▲" : "▼"}</span>
        </button>
        {showWhy && (
          <ul className="mt-2 text-xs text-slate-500 space-y-1 list-disc list-inside">
            <li>Primary: All pickup windows met</li>
            <li>Risk avoided: Late dropoff for T1002</li>
            <li>Tradeoff: +2.1 mi deadhead to avoid WCH conflict</li>
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ShadowRunMap() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const shadowRunId = params.id || "1";

  // State
  const [viewMode, setViewMode] = useState<"predicted" | "actual">("predicted");
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [replayMode, setReplayMode] = useState(false);
  const [replayTime, setReplayTime] = useState(6 * 60); // 6:00 AM in minutes

  const mapRef = useRef<any>(null);

  // Generate mock data
  const { vehicles, alternatives, kpis } = useMemo(() => generateMockData(shadowRunId), [shadowRunId]);

  // Filter vehicles based on active filter
  const filteredVehicles = useMemo(() => {
    if (!activeFilter) return vehicles;
    switch (activeFilter) {
      case "onTimeRisk":
        return vehicles.filter((v) => v.riskLevel === "high");
      case "deadhead":
        return vehicles; // Would filter by high deadhead
      case "unassigned":
        return []; // No vehicles for unassigned trips
      case "lockViolations":
        return vehicles.slice(0, kpis.lockViolations);
      default:
        return vehicles;
    }
  }, [vehicles, activeFilter, kpis]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Handle stop click - center map on stop
  const handleStopClick = useCallback(
    (stop: Stop) => {
      setHighlightedStopId(stop.id);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: stop.coordinates,
          zoom: 14,
          duration: 1000,
        });
      }
    },
    []
  );

  // Generate route line GeoJSON
  const routeLines = useMemo(() => {
    const features = filteredVehicles.map((vehicle) => ({
      type: "Feature" as const,
      properties: {
        vehicleId: vehicle.id,
        isSelected: vehicle.id === selectedVehicleId,
        riskLevel: vehicle.riskLevel,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: vehicle.routeCoordinates,
      },
    }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [filteredVehicles, selectedVehicleId]);

  // Alternative route lines
  const altRouteLines = useMemo(() => {
    if (!showOptions || !selectedVehicleId) return { type: "FeatureCollection" as const, features: [] };

    const vehicleAlts = alternatives.filter((a) => a.vehicleId === selectedVehicleId);
    return {
      type: "FeatureCollection" as const,
      features: vehicleAlts.map((alt) => ({
        type: "Feature" as const,
        properties: { label: alt.label },
        geometry: {
          type: "LineString" as const,
          coordinates: alt.coordinates,
        },
      })),
    };
  }, [alternatives, selectedVehicleId, showOptions]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation(`/ids/shadow-runs/${shadowRunId}`)} className="text-slate-500 hover:text-slate-700">
            ← Back
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">IDS / Shadow Runs / {shadowRunId} / Map</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">SAHRAWI</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">MODIVCARE</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">2026-01-09</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode("predicted")}
              className={`px-3 py-1.5 text-sm ${viewMode === "predicted" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
            >
              Predicted
            </button>
            <button
              onClick={() => setViewMode("actual")}
              className={`px-3 py-1.5 text-sm ${viewMode === "actual" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
            >
              Actual
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showDiffsOnly}
              onChange={(e) => setShowDiffsOnly(e.target.checked)}
              className="rounded"
            />
            Diffs Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReplayMode(!replayMode)}
            className={`px-3 py-1.5 text-sm rounded border ${replayMode ? "bg-purple-100 border-purple-300 text-purple-700" : "hover:bg-slate-50"}`}
          >
            Replay
          </button>
          <button className="px-3 py-1.5 text-sm rounded border hover:bg-slate-50">Export PNG</button>
          <button className="px-3 py-1.5 text-sm rounded bg-orange-500 text-white hover:bg-orange-600">Lock Plan</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="h-16 border-b bg-slate-50 flex items-center gap-3 px-4 shrink-0">
        <KPICard
          label="On-time Risk"
          value={kpis.onTimeRisk}
          tone={kpis.onTimeRisk > 2 ? "red" : kpis.onTimeRisk > 0 ? "amber" : "green"}
          active={activeFilter === "onTimeRisk"}
          onClick={() => setActiveFilter(activeFilter === "onTimeRisk" ? null : "onTimeRisk")}
        />
        <KPICard
          label="Deadhead (mi)"
          value={kpis.deadhead}
          tone={kpis.deadhead > 100 ? "amber" : "green"}
          active={activeFilter === "deadhead"}
          onClick={() => setActiveFilter(activeFilter === "deadhead" ? null : "deadhead")}
        />
        <KPICard
          label="Unassigned"
          value={kpis.unassigned}
          tone={kpis.unassigned > 0 ? "red" : "green"}
          active={activeFilter === "unassigned"}
          onClick={() => setActiveFilter(activeFilter === "unassigned" ? null : "unassigned")}
        />
        <KPICard
          label="Lock Violations"
          value={kpis.lockViolations}
          tone={kpis.lockViolations > 0 ? "amber" : "green"}
          active={activeFilter === "lockViolations"}
          onClick={() => setActiveFilter(activeFilter === "lockViolations" ? null : "lockViolations")}
        />
        <div className="ml-auto">
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showOptions}
              onChange={(e) => setShowOptions(e.target.checked)}
              className="rounded"
            />
            Show Options
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Map */}
        <div className="flex-1 relative">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: -74.006,
              latitude: 40.7128,
              zoom: 11,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          >
            <NavigationControl position="top-left" />

            {/* Route lines */}
            <Source id="routes" type="geojson" data={routeLines}>
              <Layer
                id="route-lines"
                type="line"
                paint={{
                  "line-color": [
                    "case",
                    ["==", ["get", "isSelected"], true],
                    "#f97316",
                    ["==", ["get", "riskLevel"], "high"],
                    "#ef4444",
                    ["==", ["get", "riskLevel"], "medium"],
                    "#f59e0b",
                    "#3b82f6",
                  ],
                  "line-width": ["case", ["==", ["get", "isSelected"], true], 5, 3],
                  "line-opacity": ["case", ["==", ["get", "isSelected"], true], 1, 0.6],
                }}
              />
            </Source>

            {/* Alternative routes (dotted) */}
            {showOptions && (
              <Source id="alt-routes" type="geojson" data={altRouteLines}>
                <Layer
                  id="alt-route-lines"
                  type="line"
                  paint={{
                    "line-color": "#9333ea",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                    "line-opacity": 0.7,
                  }}
                />
              </Source>
            )}

            {/* Stop markers */}
            {filteredVehicles.map((vehicle) =>
              vehicle.stops.map((stop) => (
                <StopMarker
                  key={stop.id}
                  stop={stop}
                  isHighlighted={stop.id === highlightedStopId}
                  onClick={() => handleStopClick(stop)}
                />
              ))
            )}

            {/* Vehicle markers */}
            {filteredVehicles.map((vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={vehicle.id === selectedVehicleId}
                onClick={() => setSelectedVehicleId(vehicle.id === selectedVehicleId ? null : vehicle.id)}
              />
            ))}
          </Map>
        </div>

        {/* Vehicle Drawer */}
        {selectedVehicle && (
          <VehicleDrawer
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicleId(null)}
            onStopClick={handleStopClick}
          />
        )}
      </div>

      {/* Replay Scrubber */}
      {replayMode && (
        <div className="h-16 border-t bg-slate-900 flex items-center gap-4 px-4 shrink-0">
          <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center">▶</button>
          <div className="flex-1">
            <input
              type="range"
              min={6 * 60}
              max={18 * 60}
              value={replayTime}
              onChange={(e) => setReplayTime(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>6:00 AM</span>
              <span className="text-white font-medium">
                {Math.floor(replayTime / 60)}:{(replayTime % 60).toString().padStart(2, "0")}
              </span>
              <span>6:00 PM</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 text-xs text-slate-400 hover:text-white">1x</button>
            <button className="px-2 py-1 text-xs text-slate-400 hover:text-white">4x</button>
            <button className="px-2 py-1 text-xs text-slate-400 hover:text-white">12x</button>
          </div>
        </div>
      )}
    </div>
  );
}
