'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (loc: { latitude: number; longitude: number; address: string }) => void;
}

export default function LocationSelectorMap({
  initialLat = 12.9716,
  initialLng = 77.5946,
  initialAddress = 'Bangalore, Karnataka',
  onLocationSelect,
}: LocationSelectorProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [address, setAddress] = useState<string>(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Popular quick location presets for demo/instant selection
  const presets = [
    { name: 'Jayanagar 4th Block', lat: 12.9299, lng: 77.585, addr: '4th Block, Jayanagar, Bangalore' },
    { name: 'Koramangala 5th Block', lat: 12.9352, lng: 77.6186, addr: '5th Block, Koramangala, Bangalore' },
    { name: 'Indiranagar 100ft Rd', lat: 12.9784, lng: 77.6408, addr: '100ft Road, Indiranagar, Bangalore' },
    { name: 'BTM Layout 1st Stage', lat: 12.915, lng: 77.61, addr: '1st Stage, BTM Layout, Bangalore' },
    { name: 'HSR Layout Sector 2', lat: 12.911, lng: 77.638, addr: 'Sector 2, HSR Layout, Bangalore' },
  ];

  // Dynamically load Leaflet on client side to avoid SSR issues
  useEffect(() => {
    let isMounted = true;

    async function loadLeaflet() {
      if (typeof window === 'undefined') return;

      // Add Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');

      // Fix Leaflet's default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        setIsConfirmed(false);
        await reverseGeocode(position.lat, position.lng);
      });

      map.on('click', async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setLat(clickLat);
        setLng(clickLng);
        marker.setLatLng([clickLat, clickLng]);
        setIsConfirmed(false);
        await reverseGeocode(clickLat, clickLng);
      });

      mapInstanceRef.current = map;
      setLeafletLoaded(true);
    }

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when coordinates change
  const updateMapPosition = (newLat: number, newLng: number, newAddress?: string) => {
    setLat(newLat);
    setLng(newLng);
    if (newAddress) setAddress(newAddress);
    setIsConfirmed(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 14);
      markerRef.current.setLatLng([newLat, newLng]);
    }
  };

  // Reverse geocoding via Nominatim
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Clean display name
        const cleanAddr = data.display_name.split(',').slice(0, 4).join(', ');
        setAddress(cleanAddr);
      }
    } catch {
      // Fallback
      setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
    }
  };

  // Address search via Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        updateMapPosition(newLat, newLng, result.display_name.split(',').slice(0, 4).join(', '));
      } else {
        alert('Location not found. Try selecting one of the popular landmarks below.');
      }
    } catch (err) {
      alert('Could not search location. Please click on the map directly.');
    } finally {
      setIsSearching(false);
    }
  };

  // HTML5 Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;
        updateMapPosition(curLat, curLng);
        await reverseGeocode(curLat, curLng);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback to central demo Bangalore coords
        updateMapPosition(12.9299, 77.585, 'Jayanagar, Bangalore');
        setIsLocating(false);
      },
      { timeout: 7000 }
    );
  };

  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Assistance Location
          </h4>
          <p className="text-xs text-slate-500">
            Click on map, drag the pin, search, or use your current location.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors shadow-sm"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-teal-600" />
          )}
          Use Current Location
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search neighborhood, landmark, or street..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Preset landmarks */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-slate-600">
        <span className="font-medium text-slate-400">Quick presets:</span>
        {presets.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => updateMapPosition(p.lat, p.lng, p.addr)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg border border-slate-200 text-xs transition"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 z-0 mb-4 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-teal-600" /> Loading interactive map...
          </div>
        )}
      </div>

      {/* Formatted Address Display & Confirmation */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Selected Formatted Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setIsConfirmed(false);
            }}
            placeholder="Detailed address, landmark, apartment / house #"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Coordinates: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E (Auto-calculated)</span>
            <span className="text-teal-700 font-medium">Used for dynamic radius volunteer matching</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirmLocation}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
            isConfirmed
              ? 'bg-emerald-600 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isConfirmed ? 'Location Confirmed ✓' : 'Confirm Selected Location'}
        </button>
      </div>
    </div>
  );
}
