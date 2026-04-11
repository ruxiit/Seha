"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import {
  isProviderOpenNow,
  providerDirectory,
  type ProviderPoint,
  type ProviderType,
} from "@/data/providerDirectory";
import ProviderDetailsPanel from "@/components/maps/ProviderDetailsPanel";

type ProviderFilter = "all" | ProviderType;
type TravelMode = "driving" | "walking";
type DoctorSpecialtyFilter = "all" | "cardiologist" | "dentist" | "general";

interface SmartMapProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const DEFAULT_CENTER: [number, number] = [36.7538, 3.0588];
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>";

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} س`;
  return `${hours} س ${remainingMinutes} د`;
};

const haversineKm = (fromLat: number, fromLng: number, toLat: number, toLng: number): number => {
  const R = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * R * Math.asin(Math.sqrt(a));
};

const getTypeLabel = (type: ProviderType): string => (type === "doctor" ? "طبيب" : "صيدلية");

const getStatusLabel = (isOpen: boolean): string => (isOpen ? "مفتوح الآن" : "مغلق");

const matchesDoctorSpecialty = (provider: ProviderPoint, filter: DoctorSpecialtyFilter): boolean => {
  if (filter === "all") return true;
  if (provider.type !== "doctor") return true;
  const specialty = (provider.specialty ?? "").toLowerCase();

  if (filter === "cardiologist") return specialty.includes("cardio");
  if (filter === "dentist") return specialty.includes("dent");
  // "General" (hackathon): treat internal medicine / general practice as "General"
  return (
    specialty.includes("internal medicine") ||
    specialty.includes("general") ||
    specialty.includes("family medicine") ||
    specialty.includes("general practice")
  );
};

const markerSvg = (type: ProviderType): string => {
  if (type === "doctor") {
    return [
      '<path d="M12 7v10M7 12h10" />',
      '<path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z" />',
    ].join("");
  }

  return [
    '<path d="M8.5 8.5l7 7" />',
    '<path d="M7 17a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-3 3a5 5 0 0 1-7 0Z" />',
  ].join("");
};

const buildMarkerHtml = (provider: ProviderPoint, isOpen: boolean, isSelected: boolean): string => {
  const classes = [
    "seha-map-marker",
    `seha-map-marker--${provider.type}`,
    isOpen ? "is-open" : "is-closed",
    isSelected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // divIcon expects HTML; we keep it small and style via globals.css
  return `
    <div class="${classes}" role="button" aria-label="${provider.name}">
      <svg viewBox="0 0 24 24" aria-hidden="true" class="seha-map-marker__icon">
        ${markerSvg(provider.type)}
      </svg>
      <span class="seha-map-marker__dot"></span>
    </div>
  `;
};

const createProviderIcon = (provider: ProviderPoint, isOpen: boolean, isSelected: boolean) => {
  return L.divIcon({
    className: "",
    html: buildMarkerHtml(provider, isOpen, isSelected),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function SmartMap({
  title = "الخريطة الذكية - مزودو الخدمة القريبون",
  subtitle = "اكتشف الأطباء والصيدليات القريبة من موقعك مع حالة الفتح الفورية واتجاهات الوصول.",
  compact = false,
}: SmartMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const pendingRouteProviderRef = useRef<ProviderPoint | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState<DoctorSpecialtyFilter>("all");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // [lat, lng]
  const [searchQuery, setSearchQuery] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [routeProviderId, setRouteProviderId] = useState<string | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: number; durationSeconds: number } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const providers = useMemo(() => {
    return providerDirectory
      .filter((provider) => providerFilter === "all" || provider.type === providerFilter)
      .filter((provider) => matchesDoctorSpecialty(provider, doctorSpecialtyFilter))
      .filter((provider) => !openNowOnly || isProviderOpenNow(provider))
      .filter((provider) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          provider.name.toLowerCase().includes(query) ||
          provider.address.toLowerCase().includes(query) ||
          (provider.specialty && provider.specialty.toLowerCase().includes(query))
        );
      });
  }, [doctorSpecialtyFilter, openNowOnly, providerFilter, searchQuery]);

  const effectiveSelectedProviderId = useMemo(() => {
    if (providers.length === 0) return null;
    if (selectedProviderId && providers.some((provider) => provider.id === selectedProviderId)) return selectedProviderId;
    return providers[0].id;
  }, [providers, selectedProviderId]);

  const selectedProvider = useMemo(() => {
    if (!effectiveSelectedProviderId) return null;
    return providers.find((provider) => provider.id === effectiveSelectedProviderId) ?? null;
  }, [providers, effectiveSelectedProviderId]);

  const routeProvider = useMemo(() => {
    if (!routeProviderId) return null;
    return providerDirectory.find((provider) => provider.id === routeProviderId) ?? null;
  }, [routeProviderId]);

  const mapHeight = compact ? "h-[360px]" : "h-[460px]";
  const listHeight = compact ? "max-h-[360px]" : "max-h-[460px]";

  useEffect(() => {
    return () => {
      mapRef.current = null;
      setMapReady(false);
      pendingRouteProviderRef.current = null;
      routeAbortRef.current?.abort();
      routeAbortRef.current = null;
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;
    };
  }, []);

  const clearRoute = useCallback(() => {
    pendingRouteProviderRef.current = null;
    routeAbortRef.current?.abort();
    routeAbortRef.current = null;
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    setIsRouting(false);
    setRouteProviderId(null);
    setRouteSummary(null);
    setRouteError(null);
  }, []);

  const selectProvider = useCallback(
    (providerId: string, nextDetailsOpen?: boolean) => {
      if (routeProviderId && providerId !== routeProviderId) clearRoute();
      setSelectedProviderId(providerId);
      if (typeof nextDetailsOpen === "boolean") setDetailsOpen(nextDetailsOpen);
    },
    [clearRoute, routeProviderId]
  );

  const focusProvider = (provider: ProviderPoint) => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.flyTo([provider.lat, provider.lng], 13.2, { duration: 0.85 });
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedProvider) return;
    mapRef.current.flyTo([selectedProvider.lat, selectedProvider.lng], 13.2, { duration: 0.85 });
  }, [mapReady, selectedProvider]);

  const drawRoute = useCallback(
    (origin: [number, number], provider: ProviderPoint, modeOverride?: TravelMode) => {
      if (!mapReady || !mapRef.current) {
        setToast("الخريطة غير جاهزة بعد.");
        return;
      }

      clearRoute(); // remove previous line + cancel previous request
      setIsRouting(true);
      setRouteProviderId(provider.id);
      setRouteSummary(null);
      setRouteError(null);

      const map = mapRef.current;
      const color = provider.type === "doctor" ? "#2563eb" : "#059669";
      const activeMode = modeOverride ?? travelMode;
      const osrmProfile = activeMode === "walking" ? "walking" : "driving";
      const controller = new AbortController();
      routeAbortRef.current = controller;

      const originLngLat = `${origin[1]},${origin[0]}`;
      const destinationLngLat = `${provider.lng},${provider.lat}`;
      const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${originLngLat};${destinationLngLat}?overview=full&geometries=geojson&alternatives=false&steps=false`;

      fetch(url, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("osrm_http_error");
          return (await response.json()) as {
            routes?: Array<{
              distance: number;
              duration: number;
              geometry?: { coordinates?: Array<[number, number]> };
            }>;
          };
        })
        .then((data) => {
          const route = data.routes?.[0];
          const coords = route?.geometry?.coordinates;
          if (!route || !coords || coords.length < 2) throw new Error("osrm_no_route");

          const latLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
          const shadow = L.polyline(latLngs, {
            color: "#0f172a",
            opacity: 0.18,
            weight: 10,
            className: "seha-route-shadow",
          });
          const main = L.polyline(latLngs, {
            color,
            opacity: 0.95,
            weight: 6,
            className: "seha-route-main",
          });
          const layer = L.layerGroup([shadow, main]).addTo(map);
          routeLayerRef.current = layer;

          setRouteSummary({ distanceKm: route.distance / 1000, durationSeconds: route.duration });
          setRouteError(null);

          const bounds = main.getBounds();
          map.flyToBounds(bounds, { padding: [70, 70], duration: 0.9 });
          setIsRouting(false);
        })
        .catch((error: unknown) => {
          const isAbort = error instanceof DOMException && error.name === "AbortError";
          if (isAbort) return;
          setToast("تعذر حساب المسار. جرّب فتحه في Google Maps.");
          setRouteError("تعذر حساب المسار.");
          setIsRouting(false);
          setRouteSummary(null);
        });
    },
    [clearRoute, mapReady, travelMode]
  );

  const setTravelModeAndRefresh = useCallback(
    (nextMode: TravelMode) => {
      if (isRouting) return;
      setTravelMode(nextMode);
      if (!routeProviderId || !userLocation) return;
      const provider = providerDirectory.find((item) => item.id === routeProviderId);
      if (!provider) return;
      drawRoute(userLocation, provider, nextMode);
    },
    [drawRoute, isRouting, routeProviderId, userLocation]
  );

  const locateUser = () => {
    if (!navigator.geolocation) {
      setGeoError("ميزة تحديد الموقع غير مدعومة في متصفحك.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.flyTo(coords, 13.5, { duration: 0.9 });
        }
        setIsLocating(false);

        const pendingProvider = pendingRouteProviderRef.current;
        if (pendingProvider) {
          pendingRouteProviderRef.current = null;
          drawRoute(coords, pendingProvider);
        }
      },
      () => {
        setGeoError("تم رفض الوصول للموقع. يمكنك متابعة تصفح المزودين بدون تحديد الموقع.");
        setIsLocating(false);
        pendingRouteProviderRef.current = null;
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  const openDirections = (provider: ProviderPoint) => {
    selectProvider(provider.id, false);

    if (!mapReady || !mapRef.current) {
      setToast("الخريطة غير جاهزة بعد.");
      return;
    }

    setRouteProviderId(provider.id);
    setRouteSummary(null);
    setRouteError(null);

    if (!userLocation) {
      pendingRouteProviderRef.current = provider;
      setToast("حدد موقعك أولاً لعرض المسار على الخريطة.");
      locateUser();
      return;
    }

    drawRoute(userLocation, provider);
  };

  const openInGoogleMaps = useCallback(
    (provider: ProviderPoint) => {
      const destination = `${provider.lat},${provider.lng}`;
      const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : null;
      const gmMode = travelMode === "walking" ? "walking" : "driving";

      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${gmMode}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${gmMode}`;

      window.open(url, "_blank", "noopener,noreferrer");
    },
    [travelMode, userLocation]
  );

  const openSearchDetails = (provider: ProviderPoint) => {
    const query = `${provider.name} ${provider.address}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const bookAppointmentPlaceholder = (provider: ProviderPoint) => {
    setToast(`حجز موعد: ${provider.name} (قريباً)`);
  };

  const filters: { id: ProviderFilter; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "pharmacy", label: "الصيدليات" },
    { id: "doctor", label: "الأطباء" },
  ];

  const specialtyFilters: { id: DoctorSpecialtyFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "cardiologist", label: "Cardiologist" },
    { id: "dentist", label: "Dentist" },
    { id: "general", label: "General" },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm relative z-0" dir="rtl">
      <div className="border-b border-slate-100 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  clearRoute();
                  setProviderFilter(filter.id);
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  providerFilter === filter.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                clearRoute();
                setOpenNowOnly((prev) => !prev);
              }}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                openNowOnly
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              مفتوح الآن
            </button>
          </div>
        </div>

        {providerFilter !== "pharmacy" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-black text-slate-500">Specialty (Doctors)</p>
            {specialtyFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  clearRoute();
                  setDoctorSpecialtyFilter(filter.id);
                }}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-colors ${
                  doctorSpecialtyFilter === filter.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="ابحث عن طبيب أو صيدلية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-x text-xs" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setTravelModeAndRefresh("driving")}
                className={`px-3 py-2 text-[11px] font-black transition-colors ${
                  travelMode === "driving" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={travelMode === "driving"}
              >
                Driving
              </button>
              <button
                type="button"
                onClick={() => setTravelModeAndRefresh("walking")}
                className={`px-3 py-2 text-[11px] font-black transition-colors ${
                  travelMode === "walking" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={travelMode === "walking"}
              >
                Walking
              </button>
            </div>
            <button
              type="button"
              onClick={locateUser}
              disabled={isLocating}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <i className={`fa-solid ${isLocating ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`} />
              {isLocating ? "جاري..." : "موقعي"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">
            عرض <span className="font-black text-slate-900">{providers.length}</span> مزود
          </p>
        </div>

        {geoError && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            {geoError}
          </p>
        )}
      </div>

      <div
        className={`grid gap-4 p-4 md:p-6 ${
          compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[2fr_1fr]"
        }`}
      >
        <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${mapHeight} z-10 transition-all duration-300 ${
          detailsOpen ? "blur-sm" : ""
        }`}>
          {!mapReady && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
          )}

          {isRouting && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-white/55 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xs font-black text-slate-800 shadow-xl">
                <i className="fa-solid fa-spinner fa-spin" />
                جاري حساب المسار...
              </div>
            </div>
          )}

          {routeProvider && (
            <div className="absolute right-4 top-4 z-30 max-w-[92%] md:max-w-[520px]">
              <div className="rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-xl backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-500">
                      Your Location <span className="mx-1 text-slate-400">→</span>{" "}
                      <span className="text-slate-800">{routeProvider.name}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {routeSummary ? (
                        <p className="text-xs font-black text-slate-900">
                          <span dir="ltr">{formatDistance(routeSummary.distanceKm)}</span> ·{" "}
                          {formatDuration(routeSummary.durationSeconds)}
                        </p>
                      ) : routeError ? (
                        <p className="text-xs font-black text-rose-700">{routeError}</p>
                      ) : (
                        <p className="text-xs font-black text-slate-600">{isRouting ? "Calculating..." : "—"}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearRoute}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Clear Route"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openInGoogleMaps(routeProvider)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-slate-800"
                  >
                    <i className="fa-brands fa-google" />
                    Open in Google Maps
                  </button>

                  <div className="text-[11px] font-black text-slate-500">
                    Mode: <span className="text-slate-800">{travelMode === "walking" ? "Walking" : "Driving"}</span>
                  </div>
                </div>

                {routeError && (
                  <p className="mt-2 text-[11px] font-bold text-slate-500">
                    Tip: use Google Maps fallback for reliable navigation.
                  </p>
                )}
              </div>
            </div>
          )}

          <MapContainer
            ref={mapRef}
            center={DEFAULT_CENTER}
            zoom={12}
            minZoom={9}
            maxZoom={17}
            className="h-full w-full"
            whenReady={() => setMapReady(true)}
          >
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

            {userLocation && (
              <CircleMarker
                center={userLocation}
                radius={8}
                pathOptions={{
                  color: "#ffffff",
                  weight: 3,
                  fillColor: "#111827",
                  fillOpacity: 1,
                }}
              />
            )}

            {providers.map((provider) => {
              const isOpen = isProviderOpenNow(provider);
              const isSelected = selectedProvider?.id === provider.id;
              const icon = createProviderIcon(provider, isOpen, isSelected);

              return (
                <Marker
                  key={provider.id}
                  position={[provider.lat, provider.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      selectProvider(provider.id, true);
                    },
                  }}
                >
                  <Tooltip
                    className="seha-leaflet-tooltip"
                    direction="bottom"
                    offset={[0, 8]}
                    opacity={1}
                    permanent={isSelected}
                  >
                    <div className="seha-map-label">
                      <div className="seha-map-label__name">{provider.name}</div>
                      <div className={`seha-map-label__badge seha-map-label__badge--${provider.type}`}>
                        {getTypeLabel(provider.type)}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${listHeight} transition-all duration-300 ${
          detailsOpen ? "blur-sm opacity-50" : ""
        }`}>
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-slate-800">مزودون قريبون</p>
            <p className="mt-0.5 text-xs text-slate-500">اضغط لعرض التفاصيل والاتجاهات.</p>
          </div>

          <div className="max-h-full divide-y divide-slate-100 overflow-y-auto">
            {providers.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <i className="fa-solid fa-search text-lg" />
                </div>
                <p className="text-sm font-bold text-slate-700">لا يوجد نتائج</p>
                <p className="mt-1 text-xs text-slate-500">حاول تغيير الفلاتر أو البحث</p>
              </div>
            )}

            {providers.map((provider) => {
              const isOpen = isProviderOpenNow(provider);
              const isSelected = selectedProvider?.id === provider.id;
              const distance = userLocation
                ? haversineKm(userLocation[0], userLocation[1], provider.lat, provider.lng)
                : null;

              return (
                <article
                  key={provider.id}
                  onClick={() => {
                    selectProvider(provider.id, true);
                  }}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50/80"} border-r-4 ${
                    provider.type === "doctor" ? "border-blue-500" : "border-emerald-500"
                  } p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <i
                          className={`fa-solid text-lg ${
                            provider.type === "doctor" ? "fa-stethoscope text-blue-600" : "fa-pills text-emerald-600"
                          }`}
                        />
                        <p className="text-sm font-bold text-slate-900">{provider.name}</p>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">{provider.address}</p>
                      {provider.type === "doctor" && provider.specialty && (
                        <p className="mt-1 text-xs font-semibold text-blue-600">{provider.specialty}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                        provider.type === "pharmacy"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {provider.type === "doctor" ? "طبيب" : "صيدلية"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2.5 py-1 font-bold ${
                        isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {getStatusLabel(isOpen)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600" dir="ltr">
                      {provider.openFrom} - {provider.openTo}
                    </span>
                    {distance !== null && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700" dir="ltr">
                        📍 {formatDistance(distance)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectProvider(provider.id);
                        focusProvider(provider);
                      }}
                      className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      <i className="fa-solid fa-map-pin mr-1" /> تركيز
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openDirections(provider);
                      }}
                      disabled={isRouting}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 ${
                        provider.type === "doctor"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      <i className="fa-solid fa-directions mr-1" />
                      {isRouting ? "جاري..." : "ذهاب إلى"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <ProviderDetailsPanel
        open={detailsOpen && !!selectedProvider}
        provider={selectedProvider}
        isOpenNow={selectedProvider ? isProviderOpenNow(selectedProvider) : false}
        onClose={() => setDetailsOpen(false)}
        onViewDetails={() => selectedProvider && openSearchDetails(selectedProvider)}
        onBookAppointment={() => selectedProvider && bookAppointmentPlaceholder(selectedProvider)}
        onGetDirections={() => selectedProvider && openDirections(selectedProvider)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[65] -translate-x-1/2 px-4">
          <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm font-bold text-slate-800 shadow-2xl backdrop-blur">
            {toast}
          </div>
        </div>
      )}
    </section>
  );
}
