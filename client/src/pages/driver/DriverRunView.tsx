// Driver Mode View - Web Preview
// Simple "What do I do next?" interface for drivers

import React, { useState, useMemo } from "react";
import { useParams } from "wouter";
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
  coordinates: [number, number];
  cityZip: string;
  eta: string;
  status: "completed" | "current" | "upcoming";
}

interface OnboardPassenger {
  tripId: string;
  dropOrder: number;
}

// ============================================
// MOCK DATA
// ============================================

function generateDriverData(shadowRunId: string, driverId: string) {
  const baseCoords: [number, number] = [-74.006, 40.7128];

  const currentLocation: [number, number] = [
    baseCoords[0] + (Math.random() - 0.5) * 0.05,
    baseCoords[1] + (Math.random() - 0.5) * 0.04,
  ];

  const stops: Stop[] = [];
  const numStops = 8;

  for (let i = 0; i < numStops; i++) {
    const sLng = currentLocation[0] + (i + 1) * 0.01 + (Math.random() - 0.5) * 0.005;
    const sLat = currentLocation[1] + (i + 1) * 0.008 + (Math.random() - 0.5) * 0.004;
    const hour = 9 + Math.floor(i * 0.75);
    const minute = Math.floor(Math.random() * 60);

    stops.push({
      id: `stop-${i}`,
      stopNumber: i + 1,
      stopType: i % 2 === 0 ? "PU" : "DO",
      tripId: `T${1000 + i}`,
      mobilityType: i === 2 ? "WCH" : "STD",
      requestedWindow: {
        start: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        end: `${hour.toString().padStart(2, "0")}:${(minute + 15).toString().padStart(2, "0")}`,
      },
      isWillCall: false,
      coordinates: [sLng, sLat],
      cityZip: `New York, ${10001 + i}`,
      eta: `${(hour + Math.floor(Math.random())).toString().padStart(2, "0")}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      status: i === 0 ? "current" : i < 4 ? "upcoming" : "upcoming",
    });
  }

  // Mark first 2 as completed for demo
  stops[0].status = "current";

  const onboard: OnboardPassenger[] = [
    { tripId: "T998", dropOrder: 1 },
    { tripId: "T999", dropOrder: 2 },
  ];

  return {
    vehicleUnit: "V001",
    driverName: "John Smith",
    shiftStart: "06:00",
    currentLocation,
    stops,
    onboard,
    routeCoordinates: [currentLocation, ...stops.map((s) => s.coordinates)],
  };
}

// ============================================
// COMPONENTS
// ============================================

function NextStopCard({
  stop,
  onNavigate,
  onArrived,
  onAction,
}: {
  stop: Stop;
  onNavigate: () => void;
  onArrived: () => void;
  onAction: () => void;
}) {
  const isPickup = stop.stopType === "PU";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-400">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`px-4 py-2 rounded-full text-lg font-bold ${
            isPickup ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          NEXT: {isPickup ? "PICKUP" : "DROPOFF"}
        </div>
        {stop.mobilityType === "WCH" && (
          <div className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">WCH</div>
        )}
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="text-sm text-slate-500 mb-1">Window</div>
          <div className="text-2xl font-bold text-slate-900">
            {stop.requestedWindow ? stop.requestedWindow.start : "Will Call"}
          </div>
          {stop.requestedWindow && <div className="text-sm text-slate-400">to {stop.requestedWindow.end}</div>}
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="text-sm text-slate-500 mb-1">ETA</div>
          <div className="text-2xl font-bold text-orange-600">{stop.eta}</div>
          <div className="text-sm text-slate-400">12 min away</div>
        </div>
      </div>

      {/* Trip Info */}
      <div className="mb-6 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Trip ID</span>
          <span className="font-medium">{stop.tripId}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-slate-500">Location</span>
          <span className="font-medium">{stop.cityZip}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigate}
          className="py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors"
        >
          Navigate
        </button>
        <button
          onClick={onArrived}
          className="py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 transition-colors"
        >
          Arrived
        </button>
      </div>
      <button
        onClick={onAction}
        className={`w-full mt-3 py-4 rounded-xl font-bold text-lg transition-colors ${
          isPickup
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isPickup ? "Picked Up" : "Dropped Off"}
      </button>
    </div>
  );
}

function StopQueueItem({ stop, index }: { stop: Stop; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm">
        {stop.stopNumber}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-xs rounded ${
              stop.stopType === "PU" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {stop.stopType}
          </span>
          <span className="text-sm font-medium">{stop.tripId}</span>
          {stop.mobilityType === "WCH" && (
            <span className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">WCH</span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {stop.requestedWindow ? `${stop.requestedWindow.start} - ${stop.requestedWindow.end}` : "Will Call"}
        </div>
      </div>
      <div className="text-sm text-slate-400">{stop.eta}</div>
    </div>
  );
}

function OnboardPanel({ passengers }: { passengers: OnboardPassenger[] }) {
  return (
    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-purple-700">Onboard</span>
        <span className="text-lg font-bold text-purple-900">{passengers.length}</span>
      </div>
      <div className="space-y-1">
        {passengers.map((p) => (
          <div key={p.tripId} className="flex items-center justify-between text-sm">
            <span className="text-purple-600">{p.tripId}</span>
            <span className="text-purple-400">Drop #{p.dropOrder}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanUpdateModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Plan Updated</h2>
          <p className="text-slate-500 mt-2">Dispatch has updated your route. Please review and accept to continue.</p>
        </div>
        <button
          onClick={onAccept}
          className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DriverRunView() {
  const params = useParams<{ shadowRunId: string; driverId: string }>();
  const shadowRunId = params.shadowRunId || "1";
  const driverId = params.driverId || "D1";

  const [showPlanUpdate, setShowPlanUpdate] = useState(false);

  // Generate mock data
  const data = useMemo(() => generateDriverData(shadowRunId, driverId), [shadowRunId, driverId]);

  const currentStop = data.stops.find((s) => s.status === "current");
  const upcomingStops = data.stops.filter((s) => s.status === "upcoming").slice(0, 3);
  const remainingCount = data.stops.filter((s) => s.status === "upcoming").length - 3;

  // Route GeoJSON - current segment bright, rest faint
  const routeGeoJSON = useMemo(() => {
    const currentIdx = data.stops.findIndex((s) => s.status === "current");
    const currentSegment = [data.currentLocation, ...(currentStop ? [currentStop.coordinates] : [])];
    const restSegment = data.stops.slice(currentIdx).map((s) => s.coordinates);

    return {
      current: {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: currentSegment },
      },
      rest: {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: restSegment },
      },
    };
  }, [data, currentStop]);

  const handleNavigate = () => {
    if (currentStop) {
      // Open in maps app
      const [lng, lat] = currentStop.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  };

  const handleArrived = () => {
    // Mark as arrived
    console.log("Arrived at stop");
  };

  const handleAction = () => {
    // Complete pickup/dropoff
    console.log("Action completed");
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Plan Update Modal */}
      {showPlanUpdate && <PlanUpdateModal onAccept={() => setShowPlanUpdate(false)} />}

      {/* Top Bar */}
      <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold">{data.vehicleUnit}</span>
          <span className="text-slate-400">|</span>
          <span>{data.driverName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-600 rounded text-xs font-medium">ON SHIFT</span>
          <span className="text-sm text-slate-400">since {data.shiftStart}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map (compact) */}
        <div className="h-48 relative shrink-0">
          <Map
            initialViewState={{
              longitude: data.currentLocation[0],
              latitude: data.currentLocation[1],
              zoom: 13,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          >
            {/* Current segment - bright */}
            <Source id="current-route" type="geojson" data={routeGeoJSON.current}>
              <Layer
                id="current-route-line"
                type="line"
                paint={{
                  "line-color": "#f97316",
                  "line-width": 5,
                }}
              />
            </Source>

            {/* Rest of route - faint */}
            <Source id="rest-route" type="geojson" data={routeGeoJSON.rest}>
              <Layer
                id="rest-route-line"
                type="line"
                paint={{
                  "line-color": "#94a3b8",
                  "line-width": 3,
                  "line-opacity": 0.5,
                }}
              />
            </Source>

            {/* Current location */}
            <Marker longitude={data.currentLocation[0]} latitude={data.currentLocation[1]} anchor="center">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </Marker>

            {/* Next 3 stops */}
            {[currentStop, ...upcomingStops.slice(0, 2)].filter(Boolean).map((stop, idx) => (
              <Marker
                key={stop!.id}
                longitude={stop!.coordinates[0]}
                latitude={stop!.coordinates[1]}
                anchor="center"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                    idx === 0 ? "bg-orange-500 text-white" : "bg-white border-2 border-slate-300 text-slate-700"
                  }`}
                >
                  {stop!.stopNumber}
                </div>
              </Marker>
            ))}
          </Map>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Next Stop Card */}
          {currentStop && (
            <NextStopCard
              stop={currentStop}
              onNavigate={handleNavigate}
              onArrived={handleArrived}
              onAction={handleAction}
            />
          )}

          {/* Next Stops Queue */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Next Stops</h3>
            <div className="space-y-2">
              {upcomingStops.map((stop, idx) => (
                <StopQueueItem key={stop.id} stop={stop} index={idx} />
              ))}
              {remainingCount > 0 && (
                <div className="text-center text-sm text-slate-400 py-2">+ {remainingCount} more</div>
              )}
            </div>
          </div>

          {/* Onboard Panel */}
          {data.onboard.length > 0 && <OnboardPanel passengers={data.onboard} />}
        </div>
      </div>
    </div>
  );
}
