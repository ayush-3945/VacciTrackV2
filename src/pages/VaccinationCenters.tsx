import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Clock,
  ShieldCheck,
  Building2,
  Stethoscope,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { centersAPI, childrenAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';

// Center Interface
export interface VaccineCenterData {
  _id: string;
  name: string;
  type: 'government_phc' | 'district_hospital' | 'private_clinic';
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  contactNumber: string;
  timing: string;
  availableVaccines: string[];
  isGovernmentFree: boolean;
  liveStockStatus: 'in_stock' | 'limited' | 'out_of_stock';
  rating: number;
  capacityPerDay: number;
}

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Custom DivIcon Generators for Leaflet
const createMarkerIcon = (type: string, isSelected: boolean) => {
  let bgColor = 'bg-emerald-600';
  let borderColor = 'border-emerald-300';
  let iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  if (type === 'district_hospital') {
    bgColor = 'bg-blue-600';
    borderColor = 'border-blue-300';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
        <path d="M10 9h4"/><path d="M12 7v4"/>
      </svg>
    `;
  } else if (type === 'private_clinic') {
    bgColor = 'bg-purple-600';
    borderColor = 'border-purple-300';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
        <circle cx="20" cy="10" r="2"/>
      </svg>
    `;
  }

  const pulseClass = isSelected ? 'scale-125 ring-4 ring-primary ring-offset-2' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${pulseClass}">
        <div class="w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor} shadow-lg flex items-center justify-center">
          ${iconSvg}
        </div>
        <div class="absolute -bottom-1 w-2 h-2 ${bgColor} rotate-45"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-8 h-8 bg-rose-500/30 rounded-full animate-ping"></span>
      <div class="w-7 h-7 bg-rose-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Map Controller Component for Pan/Zoom & Sizing
const MapController: React.FC<{
  centerCoords?: [number, number];
  zoomLevel?: number;
}> = ({ centerCoords, zoomLevel = 14 }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [map]);

  useEffect(() => {
    if (centerCoords && centerCoords[0] && centerCoords[1]) {
      map.flyTo(centerCoords, zoomLevel, {
        duration: 1.2,
      });
    }
  }, [centerCoords, zoomLevel, map]);
  return null;
};

const VaccinationCenters: React.FC = () => {
  const { user } = useAuth();
  const [centers, setCenters] = useState<VaccineCenterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<VaccineCenterData | null>(null);

  // User Geolocation (Default to AIIMS New Delhi if denied/unavailable)
  const defaultCoords: [number, number] = [28.5672, 77.21];
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapTarget, setMapTarget] = useState<[number, number]>(defaultCoords);
  const [mapZoom, setMapZoom] = useState(13);

  // Booking Modal State
  const [bookingModalCenter, setBookingModalCenter] = useState<VaccineCenterData | null>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [manualChildName, setManualChildName] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [requestedVaccine, setRequestedVaccine] = useState<string>('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  // Load Centers from API
  useEffect(() => {
    const fetchCenters = async () => {
      setLoading(true);
      try {
        const data = await centersAPI.getAll({
          type: selectedType,
          search: searchQuery,
          inStockOnly,
        });
        setCenters(data);
        if (data.length > 0 && !selectedCenter) {
          setSelectedCenter(data[0]);
        }
      } catch (err) {
        console.error('Failed to load centers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCenters();
  }, [selectedType, inStockOnly, searchQuery]);

  // Load user children if logged in
  useEffect(() => {
    if (user) {
      childrenAPI.getAll().then(data => {
        setChildrenList(data);
        if (data.length > 0) {
          setSelectedChildId(data[0]._id);
        }
      }).catch(console.error);
    }
  }, [user]);

  // Handle Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setMapTarget([coords.lat, coords.lng]);
        setMapZoom(14);
        setIsLocating(false);
      },
      err => {
        console.warn('Geolocation denied or timed out, using default Delhi location:', err);
        setUserCoords({ lat: defaultCoords[0], lng: defaultCoords[1] });
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Auto-detect on first load
  useEffect(() => {
    handleDetectLocation();
  }, []);

  // Compute centers with distance
  const centersWithDistance = useMemo(() => {
    const originLat = userCoords?.lat || defaultCoords[0];
    const originLng = userCoords?.lng || defaultCoords[1];

    return centers.map(c => ({
      ...c,
      distanceKm: calculateDistance(originLat, originLng, c.coordinates.lat, c.coordinates.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [centers, userCoords]);

  // Select center and pan map
  const handleSelectCenter = (center: VaccineCenterData) => {
    setSelectedCenter(center);
    setMapTarget([center.coordinates.lat, center.coordinates.lng]);
    setMapZoom(15);
  };

  // Open Google Maps Directions
  const handleOpenDirections = (center: VaccineCenterData) => {
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : 'current+location';
    const destination = `${center.coordinates.lat},${center.coordinates.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Handle Book Slot
  const handleBookSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalCenter) return;

    setIsBookingSubmitting(true);
    try {
      const childObj = childrenList.find(c => c._id === selectedChildId);
      const childName = childObj ? childObj.name : manualChildName || 'Child';

      const bookingPayload = {
        centerId: bookingModalCenter._id,
        childName,
        preferredDate: preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        vaccineRequested: requestedVaccine || 'Routine NIS 2025 Dose',
        userId: user?._id || user?.id,
        parentName: user?.name,
        parentPhone: user?.phone,
      };

      const result = await centersAPI.bookSlot(bookingPayload);
      setBookingSuccessData(result);
    } catch (err: any) {
      alert(err.message || 'Failed to book slot. Please try again.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        {/* Top Control Bar */}
        <section className="bg-card border-b border-border px-4 py-3.5 sm:px-6 shadow-xs z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold font-display text-foreground flex items-center gap-2">
                    Vaccination Centers & Hospitals
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Live Locator
                    </span>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Discover Government PHCs, District Hospitals & Authorized Pediatric Centers with live stock
                  </p>
                </div>
              </div>
            </div>

            {/* GPS Locate Me Button & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="gap-1.5 rounded-xl border-border bg-background hover:bg-muted text-xs font-semibold"
              >
                <Navigation className={cn('w-3.5 h-3.5 text-teal-600', isLocating && 'animate-spin')} />
                {isLocating ? 'Locating...' : 'Locate Me (GPS)'}
              </Button>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Pincode, Hospital..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="max-w-7xl mx-auto flex items-center gap-2 mt-3 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 pl-1">
              <Filter className="w-3 h-3 text-primary" /> Filter:
            </span>

            {[
              { id: 'all', label: 'All Centers' },
              { id: 'government_phc', label: '🟢 Govt Free PHCs', icon: ShieldCheck },
              { id: 'district_hospital', label: '🔵 District / AIIMS', icon: Building2 },
              { id: 'private_clinic', label: '🟣 Private Clinics', icon: Stethoscope },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedType(f.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
                  selectedType === f.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                )}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ml-auto',
                inStockOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              )}
            >
              ✓ In-Stock Only
            </button>
          </div>
        </section>

        {/* Split Screen Workspace: Center Cards List + Interactive Leaflet Map */}
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-[calc(100vh-145px)]">
          {/* Left Column: Center Cards Directory */}
          <div className="w-full lg:w-[460px] xl:w-[500px] h-[45vh] lg:h-full overflow-y-auto bg-card border-r border-border p-3 sm:p-4 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Showing <strong>{centersWithDistance.length}</strong> Centers near you</span>
              {userCoords && (
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  📍 Origin: Live GPS
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Finding nearby verified centers...</p>
              </div>
            ) : centersWithDistance.length === 0 ? (
              <div className="py-12 text-center p-6 bg-muted/40 rounded-2xl border border-dashed border-border space-y-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">No Centers Found</h4>
                <p className="text-xs text-muted-foreground">Try clearing search filters or checking a different pincode.</p>
                <Button size="sm" variant="outline" onClick={() => { setSearchQuery(''); setSelectedType('all'); setInStockOnly(false); }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              centersWithDistance.map(center => {
                const isSelected = selectedCenter?._id === center._id;

                return (
                  <motion.div
                    key={center._id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleSelectCenter(center)}
                    className={cn(
                      'p-4 rounded-2xl border transition-all cursor-pointer relative',
                      isSelected
                        ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                        : 'bg-card hover:bg-muted/40 border-border shadow-xs'
                    )}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                              center.type === 'government_phc' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                              center.type === 'district_hospital' && 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
                              center.type === 'private_clinic' && 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                            )}
                          >
                            {center.type === 'government_phc' ? 'Govt PHC' : center.type === 'district_hospital' ? 'Hospital / AIIMS' : 'Private Clinic'}
                          </span>

                          {center.isGovernmentFree && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Free NIS
                            </span>
                          )}

                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-md text-[10px] font-medium ml-auto',
                              center.liveStockStatus === 'in_stock' && 'text-emerald-600 bg-emerald-500/10',
                              center.liveStockStatus === 'limited' && 'text-amber-600 bg-amber-500/10',
                              center.liveStockStatus === 'out_of_stock' && 'text-rose-600 bg-rose-500/10'
                            )}
                          >
                            ● {center.liveStockStatus === 'in_stock' ? 'In Stock' : center.liveStockStatus === 'limited' ? 'Limited' : 'Out of Stock'}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-foreground mt-1.5 leading-snug">
                          {center.name}
                        </h3>

                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {center.address}, {center.city} - {center.pincode}
                        </p>
                      </div>

                      {/* Distance Badge */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="px-2 py-1 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300 text-xs font-bold whitespace-nowrap">
                          📍 {center.distanceKm} km
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">★ {center.rating}</span>
                      </div>
                    </div>

                    {/* Timings and Phone */}
                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {center.timing}
                      </span>
                      <a
                        href={`tel:${center.contactNumber}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-teal-600 hover:underline ml-auto"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    </div>

                    {/* Vaccines Available Pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {center.availableVaccines.slice(0, 5).map((vac, vIdx) => (
                        <span
                          key={vIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border"
                        >
                          {vac}
                        </span>
                      ))}
                      {center.availableVaccines.length > 5 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground bg-muted font-medium">
                          +{center.availableVaccines.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenDirections(center);
                        }}
                        className="flex-1 rounded-xl text-xs h-8 gap-1 border-border hover:bg-muted font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600" /> Directions
                      </Button>

                      <Button
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setBookingModalCenter(center);
                          setRequestedVaccine(center.availableVaccines[0] || 'Pentavalent');
                          setBookingSuccessData(null);
                        }}
                        className="flex-1 rounded-xl text-xs h-8 gap-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book Slot
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Right Column: Leaflet Interactive Map View */}
          <div className="flex-1 w-full h-[55vh] lg:h-full min-h-[500px] relative z-0">
            <MapContainer
              center={mapTarget}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%', minHeight: '500px' }}
              className="w-full h-full"
            >
              {/* TileLayer with ultra-reliable CARTO Voyager tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />

              <MapController centerCoords={mapTarget} zoomLevel={mapZoom} />

              {/* User Live Location Marker */}
              {userCoords && (
                <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocationIcon}>
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="font-bold text-xs text-rose-600">📍 You Are Here</p>
                      <p className="text-[10px] text-muted-foreground">Live GPS Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Vaccine Centers Markers */}
              {centersWithDistance.map(center => {
                const isSelected = selectedCenter?._id === center._id;

                return (
                  <Marker
                    key={center._id}
                    position={[center.coordinates.lat, center.coordinates.lng]}
                    icon={createMarkerIcon(center.type, isSelected)}
                    eventHandlers={{
                      click: () => handleSelectCenter(center),
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-2 max-w-[260px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                              center.type === 'government_phc' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {center.type === 'government_phc' ? 'Govt PHC' : 'Hospital'}
                          </span>
                          {center.isGovernmentFree && (
                            <span className="text-[9px] font-bold text-emerald-600">Free NIS 2025</span>
                          )}
                          <span className="ml-auto text-[10px] font-bold text-teal-700">
                            {center.distanceKm} km
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-gray-900 leading-tight">
                          {center.name}
                        </h4>

                        <p className="text-[11px] text-gray-600 mt-1">
                          {center.address}
                        </p>

                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {center.timing}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-gray-200 flex gap-1.5">
                          <button
                            onClick={() => handleOpenDirections(center)}
                            className="flex-1 py-1 rounded bg-teal-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Directions
                          </button>
                          <a
                            href={`tel:${center.contactNumber}`}
                            className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-[11px] font-semibold flex items-center justify-center"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-md p-3 rounded-2xl border border-border shadow-lg z-[400] text-xs space-y-1.5 hidden sm:block">
              <span className="font-bold text-[11px] text-foreground block mb-1">Center Types</span>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span>Govt PHC (100% Free)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span>AIIMS / District Hospital</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                <span>Private Pediatric Clinic</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span>Your Live Location</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Slot Modal */}
      <AnimatePresence>
        {bookingModalCenter && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold font-display text-lg text-white">Book Walk-in Slot</h3>
                  <p className="text-xs text-teal-100">{bookingModalCenter.name}</p>
                </div>
                <button
                  onClick={() => setBookingModalCenter(null)}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {bookingSuccessData ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-14 h-14 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">Appointment Confirmed!</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Your vaccination token has been generated. Show this booking ID at the registration desk.
                    </p>

                    <div className="p-4 bg-muted/60 rounded-2xl border border-border max-w-xs mx-auto text-left text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Booking ID:</span>
                        <strong className="text-teal-600 font-mono text-sm">{bookingSuccessData.bookingId}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Child:</span>
                        <strong className="text-foreground">{bookingSuccessData.childName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <strong className="text-foreground">{bookingSuccessData.preferredDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Center:</span>
                        <strong className="text-foreground line-clamp-1">{bookingSuccessData.centerName}</strong>
                      </div>
                    </div>

                    <Button
                      onClick={() => setBookingModalCenter(null)}
                      className="w-full mt-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleBookSlotSubmit} className="space-y-4">
                    {/* Child Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Select Child
                      </label>
                      {childrenList.length > 0 ? (
                        <select
                          value={selectedChildId}
                          onChange={e => setSelectedChildId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          {childrenList.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({new Date(c.dateOfBirth).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Enter Child Full Name"
                          value={manualChildName}
                          onChange={e => setManualChildName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      )}
                    </div>

                    {/* Preferred Date */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={preferredDate}
                        onChange={e => setPreferredDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {/* Requested Vaccine */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Vaccine Needed
                      </label>
                      <select
                        value={requestedVaccine}
                        onChange={e => setRequestedVaccine(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {bookingModalCenter.availableVaccines.map((vac, idx) => (
                          <option key={idx} value={vac}>
                            {vac} (NIS 2025)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-xs text-teal-800 dark:text-teal-200">
                      ℹ️ Free registration under National Immunization Schedule (NIS 2025). No fee required at government centers.
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBookingModalCenter(null)}
                        className="flex-1 rounded-xl text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isBookingSubmitting}
                        className="flex-1 rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                      >
                        {isBookingSubmitting ? 'Confirming...' : 'Confirm Slot'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaccinationCenters;
