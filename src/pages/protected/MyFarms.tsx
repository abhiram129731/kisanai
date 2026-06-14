import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFarms } from '../../context/FarmContext';
import type { Farm, FarmTimelineEvent } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Plus, Trash2, ShieldCheck, Eye, Layers, Undo, Save, Activity, CloudSun, AlertTriangle } from 'lucide-react';
import * as turf from '@turf/turf';
import { api } from '../../services/api';


// Declare Leaflet global object L provided by the CDN
declare const L: any;

export const MyFarms: React.FC = () => {
  const { farms, addFarm, updateFarm, deleteFarm, addTimelineEvent } = useFarms();
  const { t } = useLanguage();

  const [activeFarmId, setActiveFarmId] = useState<string | null>(farms[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Farm form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Cotton');
  const [area, setArea] = useState<number>(3);
  const [soilType, setSoilType] = useState('Loam Soil');
  const [irrigation, setIrrigation] = useState('Drip Irrigation');
  const [notes, setNotes] = useState('');
  
  // Map drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [newFarmDrawingPoints, setNewFarmDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);

  // Leaflet references
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const polygonInstanceRef = useRef<any>(null);
  
  const addFarmMapRef = useRef<HTMLDivElement | null>(null);
  const addFarmMapInstanceRef = useRef<any>(null);
  const addFarmMarkersGroupRef = useRef<any>(null);
  const addFarmPolygonInstanceRef = useRef<any>(null);
  const gpsMarkerRef = useRef<any>(null);
  const addGpsMarkerRef = useRef<any>(null);

  // GPS Telemetry and Weather States
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Idle');
  
  const [activeWeather, setActiveWeather] = useState<any | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  const validateCoordinates = (lat: number, lng: number): boolean => {
    console.log(`[Coordinate Debugger] Validating coordinates: lat=${lat}, lng=${lng}`);
    // Check for latitude/longitude swap for India
    if (lat > 68 && lat < 98 && lng > 8 && lng < 38) {
      console.error(`[Coordinate Error] Swapped coordinates detected! Latitude (${lat}) and Longitude (${lng}) appear to be reversed for India.`);
      return false;
    }
    if (lat < 8 || lat > 38 || lng < 68 || lng > 98) {
      console.warn(`[Coordinate Warning] Coordinates lat=${lat}, lng=${lng} are located outside standard Indian agricultural land.`);
    }
    return true;
  };

  const fetchUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errMsg = "Geolocation is not supported by your browser.";
        setGpsError(errMsg);
        setGpsStatus('Failed');
        resolve({ lat: 20.5937, lng: 78.9629 });
        return;
      }

      setGpsLoading(true);
      setGpsError(null);
      setGpsStatus('Requesting Permission');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`[GPS Success] Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m`);
          setGpsLoading(false);
          setGpsAccuracy(accuracy);
          setGpsStatus('Success');
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.warn("[GPS Error] Code:", err.code, "Message:", err.message);
          let msg = "Failed to retrieve location.";
          if (err.code === 1) {
            msg = "Location permission denied. Please enable location access in your browser settings.";
          } else if (err.code === 2) {
            msg = "GPS location signal unavailable. Using fallback location.";
          } else if (err.code === 3) {
            msg = "Location request timed out. Using fallback location.";
          }
          setGpsError(msg);
          setGpsLoading(false);
          setGpsStatus('Failed');
          resolve({ lat: 20.5937, lng: 78.9629 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const activeFarm = useMemo(() => {
    return farms.find(f => f.id === activeFarmId) || farms[0] || null;
  }, [farms, activeFarmId]);

  // Auto-select first farm or newly created farm
  const prevFarmsLengthRef = useRef<number>(farms.length);
  useEffect(() => {
    if (!activeFarmId && farms.length > 0) {
      setActiveFarmId(farms[0].id);
    } else if (farms.length > prevFarmsLengthRef.current) {
      const newFarm = farms[farms.length - 1];
      if (newFarm) {
        setActiveFarmId(newFarm.id);
      }
    }
    prevFarmsLengthRef.current = farms.length;
  }, [farms, activeFarmId]);

  // Load weather and AI advisory for active farm coordinates
  useEffect(() => {
    if (!activeFarm) {
      setActiveWeather(null);
      return;
    }
    
    let isMounted = true;
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        let lat = 20.5937;
        let lng = 78.9629;
        if (activeFarm.coordinates && activeFarm.coordinates.length > 0) {
          lat = activeFarm.coordinates[0].lat;
          lng = activeFarm.coordinates[0].lng;
        } else if (activeFarm.location) {
          const parts = activeFarm.location.split(',');
          if (parts.length === 2) {
            const p1 = parseFloat(parts[0]);
            const p2 = parseFloat(parts[1]);
            if (!isNaN(p1) && !isNaN(p2)) {
              lat = p1;
              lng = p2;
            }
          }
        }
        
        validateCoordinates(lat, lng);
        const data = await api.weather.get(lat, lng, activeFarm.crop);
        if (isMounted) {
          console.log("[MyFarms Weather] Weather data loaded:", data);
          setActiveWeather(data);
        }
      } catch (err) {
        console.error("[MyFarms Weather] Failed to load weather:", err);
      } finally {
        if (isMounted) {
          setLoadingWeather(false);
        }
      }
    };
    
    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [activeFarm]);


  // Timeline entry state
  const [eventAction, setEventAction] = useState('');
  const [eventCategory, setEventCategory] = useState<'sowing' | 'fertilizer' | 'disease' | 'treatment' | 'harvest' | 'general'>('general');

  // Initialize and clean up Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center at India Center fallback
    let center: [number, number] = [20.5937, 78.9629];
    let zoom = 5;

    if (activeFarm && activeFarm.coordinates && activeFarm.coordinates.length > 0) {
      center = [activeFarm.coordinates[0].lat, activeFarm.coordinates[0].lng];
      zoom = activeFarm.coordinates.length > 2 ? 16 : 15;
    }

    try {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // Google Hybrid Layer
      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });

      // Esri Satellite Layer
      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // OpenStreetMap Layer
      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      // Google Roadmap Layer
      const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });

      // Default to hybrid
      googleHybrid.addTo(map);

      // Layer selector
      L.control.layers({
        "Satellite (Google)": googleHybrid,
        "Satellite (Esri)": esriSatellite,
        "Standard Map (OSM)": osmStandard,
        "Terrain (Google)": googleRoadmap
      }, null, { position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 250);

      if (!drawMode) {
        // Render all saved farms
        farms.forEach((f) => {
          if (f.coordinates && f.coordinates.length > 2) {
            const latlngs = f.coordinates.map(c => [c.lat, c.lng]);
            const isActive = f.id === activeFarm?.id;
            const polygon = L.polygon(latlngs, {
              color: isActive ? '#22C55E' : '#3b82f6',
              fillColor: isActive ? '#22C55E' : '#3b82f6',
              fillOpacity: isActive ? 0.35 : 0.15,
              weight: isActive ? 4 : 2,
              dashArray: isActive ? '' : '4, 4'
            }).addTo(map);

            polygon.bindTooltip(`${f.name} (${f.area} ac)`, { permanent: false, direction: 'center' });

            if (isActive) {
              map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
            }
          } else if (f.coordinates && f.coordinates.length > 0) {
            const isActive = f.id === activeFarm?.id;
            const pinIcon = L.divIcon({
              className: 'custom-map-marker',
              html: `<div style="background-color: ${isActive ? '#22C55E' : '#3b82f6'}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            f.coordinates.forEach((c) => {
              const marker = L.marker([c.lat, c.lng], { icon: pinIcon }).addTo(map);
              marker.bindTooltip(f.name, { permanent: false, direction: 'top' });
            });
            if (isActive) {
              map.setView([f.coordinates[0].lat, f.coordinates[0].lng], 16);
            }
          }
        });

        if (!activeFarm || !activeFarm.coordinates || activeFarm.coordinates.length === 0) {
          // Geolocate user to center map directly if no active farm coordinates exist
          fetchUserLocation().then(({ lat, lng }) => {
            if (!mapInstanceRef.current) return;
            const map = mapInstanceRef.current;
            map.setView([lat, lng], 17);
            
            if (gpsMarkerRef.current) {
              map.removeLayer(gpsMarkerRef.current);
            }
            const gpsIcon = L.divIcon({
              className: 'gps-pulse-marker',
              html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px #3b82f6; animation: pulse 1.5s infinite;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            gpsMarkerRef.current = L.marker([lat, lng], { icon: gpsIcon }).addTo(map);
            gpsMarkerRef.current.bindTooltip("Your Location", { permanent: false, direction: 'top' });
          });
        }
      } else {
        // In Drawing Mode, clear points state and map listener
        setDrawingPoints([]);

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setDrawingPoints(prev => [...prev, { lat, lng }]);
        });
      }
    } catch (err) {
      console.error('Leaflet Map failed to load:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      gpsMarkerRef.current = null;
    };
  }, [activeFarmId, drawMode, farms]);

  // Sync drawn polyline/polygon to map
  useEffect(() => {
    if (!mapInstanceRef.current || !drawMode) return;

    const map = mapInstanceRef.current;

    // Clear previous drawing layers
    if (markersGroupRef.current) {
      map.removeLayer(markersGroupRef.current);
    }
    if (polygonInstanceRef.current) {
      map.removeLayer(polygonInstanceRef.current);
    }

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    const drawingPinIcon = L.divIcon({
      className: 'custom-drawing-pin',
      html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.45);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    drawingPoints.forEach((pt, idx) => {
      const m = L.marker([pt.lat, pt.lng], { icon: drawingPinIcon }).addTo(markersGroup);
      m.bindTooltip((idx + 1).toString(), { permanent: true, direction: 'top', className: 'marker-tooltip-num' });
    });

    if (drawingPoints.length > 1) {
      const latlngs = drawingPoints.map(p => [p.lat, p.lng]);
      if (drawingPoints.length > 2) {
        polygonInstanceRef.current = L.polygon(latlngs, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.25,
          weight: 3
        }).addTo(map);
      } else {
        polygonInstanceRef.current = L.polyline(latlngs, {
          color: '#3B82F6',
          weight: 3
        }).addTo(map);
      }
    }
  }, [drawingPoints, drawMode]);

  // Helper for geodesic calculations using Turf.js
  const calculateGeodesicArea = (points: { lat: number; lng: number }[]) => {
    if (points.length < 3) return { acres: 0, hectares: 0, sqm: 0, perimeter: 0 };
    try {
      const coords = points.map(p => [p.lng, p.lat]);
      coords.push([points[0].lng, points[0].lat]); // Close the polygon ring
      const polygon = turf.polygon([coords]);
      const sqm = turf.area(polygon);
      
      // Standard metric & Indian agricultural conversions:
      // 1 Hectare = 10,000 square meters
      // 1 Acre = sqm * 0.000247105
      const hectares = Number((sqm / 10000).toFixed(4));
      const acres = Number((sqm * 0.000247105).toFixed(4));
      
      // Calculate perimeter using turf.length
      const line = turf.lineString(coords);
      const perimeterMeters = Math.round(turf.length(line, { units: 'meters' }));
      
      return {
        sqm: Math.round(sqm),
        hectares,
        acres,
        perimeter: perimeterMeters
      };
    } catch (e) {
      console.error("Turf geodesic area calculation error:", e);
      return { acres: 0, hectares: 0, sqm: 0, perimeter: 0 };
    }
  };

  const boundaryCalculations = useMemo(() => {
    return calculateGeodesicArea(drawingPoints);
  }, [drawingPoints]);

  const newFarmCalculations = useMemo(() => {
    return calculateGeodesicArea(newFarmDrawingPoints);
  }, [newFarmDrawingPoints]);

  useEffect(() => {
    if (newFarmCalculations.acres > 0) {
      setArea(newFarmCalculations.acres);
    }
  }, [newFarmCalculations.acres]);

  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const updateGPSMarker = (map: any, lat: number, lng: number, markerRef: React.MutableRefObject<any>) => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    const gpsIcon = L.divIcon({
      className: 'gps-pulse-marker',
      html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #3b82f6; animation: pulse 1.5s infinite;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    markerRef.current = L.marker([lat, lng], { icon: gpsIcon }).addTo(map);
    markerRef.current.bindTooltip("Current Position", { permanent: false, direction: 'top' });
  };

  const startTracking = (isNewFarm: boolean) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    if (confirm("Start GPS Walk Mapping? This will automatically record boundary points as you walk around the field. Ensure GPS/location services are enabled on your device.")) {
      if (isNewFarm) {
        setNewFarmDrawingPoints([]);
      } else {
        setDrawingPoints([]);
      }
      setIsTracking(true);

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`[GPS Walk] Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m`);

          const newPt = { lat: latitude, lng: longitude };

          if (isNewFarm) {
            setNewFarmDrawingPoints((prev) => {
              if (prev.length === 0) return [newPt];
              const lastPt = prev[prev.length - 1];
              const from = turf.point([lastPt.lng, lastPt.lat]);
              const to = turf.point([newPt.lng, newPt.lat]);
              const dist = turf.distance(from, to, { units: 'meters' });
              // Record point if moved at least 2.5 meters
              if (dist >= 2.5) return [...prev, newPt];
              return prev;
            });

            if (addFarmMapInstanceRef.current) {
              const map = addFarmMapInstanceRef.current;
              map.setView([latitude, longitude], 18);
              updateGPSMarker(map, latitude, longitude, addGpsMarkerRef);
            }
          } else {
            setDrawingPoints((prev) => {
              if (prev.length === 0) return [newPt];
              const lastPt = prev[prev.length - 1];
              const from = turf.point([lastPt.lng, lastPt.lat]);
              const to = turf.point([newPt.lng, newPt.lat]);
              const dist = turf.distance(from, to, { units: 'meters' });
              if (dist >= 2.5) return [...prev, newPt];
              return prev;
            });

            if (mapInstanceRef.current) {
              const map = mapInstanceRef.current;
              map.setView([latitude, longitude], 18);
              updateGPSMarker(map, latitude, longitude, gpsMarkerRef);
            }
          }
        },
        (err) => {
          console.error("GPS tracking error:", err);
          alert(`Failed to track GPS location: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      watchIdRef.current = id;
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    alert("GPS Walk Mapping stopped.");
  };

  const handleViewAllFarms = () => {
    if (!mapInstanceRef.current || farms.length === 0) return;
    const map = mapInstanceRef.current;
    const allLatLngs: any[] = [];
    farms.forEach(f => {
      if (f.coordinates && f.coordinates.length > 0) {
        f.coordinates.forEach(c => allLatLngs.push([c.lat, c.lng]));
      }
    });

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleUndo = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  const handleSaveBoundary = () => {
    if (drawingPoints.length < 3) {
      alert('Please select at least 3 points to enclose your farm boundary.');
      return;
    }

    if (activeFarm) {
      updateFarm(activeFarm.id, {
        coordinates: drawingPoints,
        area: boundaryCalculations.acres,
        areaHectares: boundaryCalculations.hectares,
        areaSqm: boundaryCalculations.sqm
      });

      addTimelineEvent(activeFarm.id, {
        date: new Date().toISOString().split('T')[0],
        action: `Farm Boundary Redrawn: ${boundaryCalculations.acres} Acres, ${boundaryCalculations.hectares} Hectares, ${boundaryCalculations.sqm} m², Perimeter ${boundaryCalculations.perimeter}m.`,
        category: 'general'
      });

      alert(t('farm.boundarySaved'));
      setDrawMode(false);
      setDrawingPoints([]);
    }
  };

  const handleAddTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarm || !eventAction) return;

    addTimelineEvent(activeFarm.id, {
      date: new Date().toISOString().split('T')[0],
      action: eventAction,
      category: eventCategory
    });
    setEventAction('');
  };

  // Add Farm Map Picker & Drawing initialization
  useEffect(() => {
    if (!showAddForm || !addFarmMapRef.current) return;

    if (addFarmMapInstanceRef.current) {
      addFarmMapInstanceRef.current.remove();
      addFarmMapInstanceRef.current = null;
    }

    try {
      const map = L.map(addFarmMapRef.current, {
        center: [20.5937, 78.9629], // India Center fallback
        zoom: 5,
        zoomControl: true,
      });

      // Google Hybrid Layer
      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });

      // Esri Satellite Layer
      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // OpenStreetMap Layer
      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      // Google Roadmap Layer
      const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });

      // Default to hybrid
      googleHybrid.addTo(map);

      // Layer selector
      L.control.layers({
        "Satellite (Google)": googleHybrid,
        "Satellite (Esri)": esriSatellite,
        "Standard Map (OSM)": osmStandard,
        "Terrain (Google)": googleRoadmap
      }, null, { position: 'topright' }).addTo(map);

      // Geolocate user to center map directly
      fetchUserLocation().then(({ lat, lng }) => {
        if (!addFarmMapRef.current || !addFarmMapInstanceRef.current) return;
        const map = addFarmMapInstanceRef.current;
        map.setView([lat, lng], 17);
        
        if (addGpsMarkerRef.current) {
          map.removeLayer(addGpsMarkerRef.current);
        }
        const gpsIcon = L.divIcon({
          className: 'gps-pulse-marker',
          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px #3b82f6; animation: pulse 1.5s infinite;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        addGpsMarkerRef.current = L.marker([lat, lng], { icon: gpsIcon }).addTo(map);
        addGpsMarkerRef.current.bindTooltip("Your Location", { permanent: false, direction: 'top' });
      });

      addFarmMapInstanceRef.current = map;
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 250);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setNewFarmDrawingPoints(prev => [...prev, { lat, lng }]);
      });
    } catch (err) {
      console.error('Add farm Leaflet Map failed to load:', err);
    }

    return () => {
      if (addFarmMapInstanceRef.current) {
        addFarmMapInstanceRef.current.remove();
        addFarmMapInstanceRef.current = null;
      }
      addGpsMarkerRef.current = null;
    };
  }, [showAddForm]);

  // Sync new farm drawn polyline/polygon to its map
  useEffect(() => {
    if (!addFarmMapInstanceRef.current || !showAddForm) return;

    const map = addFarmMapInstanceRef.current;

    // Clear previous drawing layers
    if (addFarmMarkersGroupRef.current) {
      map.removeLayer(addFarmMarkersGroupRef.current);
    }
    if (addFarmPolygonInstanceRef.current) {
      map.removeLayer(addFarmPolygonInstanceRef.current);
    }

    const markersGroup = L.layerGroup().addTo(map);
    addFarmMarkersGroupRef.current = markersGroup;

    const drawingPinIcon = L.divIcon({
      className: 'custom-drawing-pin',
      html: `<div style="background-color: #3B82F6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.45);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    newFarmDrawingPoints.forEach((pt, idx) => {
      const m = L.marker([pt.lat, pt.lng], { icon: drawingPinIcon }).addTo(markersGroup);
      m.bindTooltip((idx + 1).toString(), { permanent: true, direction: 'top', className: 'marker-tooltip-num' });
    });

    if (newFarmDrawingPoints.length > 1) {
      const latlngs = newFarmDrawingPoints.map(p => [p.lat, p.lng]);
      if (newFarmDrawingPoints.length > 2) {
        addFarmPolygonInstanceRef.current = L.polygon(latlngs, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.25,
          weight: 3
        }).addTo(map);
      } else {
        addFarmPolygonInstanceRef.current = L.polyline(latlngs, {
          color: '#3B82F6',
          weight: 3
        }).addTo(map);
      }
    }
    
    if (newFarmDrawingPoints.length > 0) {
      const first = newFarmDrawingPoints[0];
      setLocation(`${first.lat.toFixed(6)}, ${first.lng.toFixed(6)}`);
    }
  }, [newFarmDrawingPoints, showAddForm]);

  const handleUndoNewFarmPoint = () => {
    setNewFarmDrawingPoints(prev => prev.slice(0, -1));
  };

  const handleClearNewFarmBoundary = () => {
    setNewFarmDrawingPoints([]);
    setLocation('');
  };

  const handleLocateNewFarm = () => {
    fetchUserLocation().then(({ lat, lng }) => {
      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (addFarmMapInstanceRef.current) {
        const map = addFarmMapInstanceRef.current;
        map.setView([lat, lng], 17);
        
        if (addGpsMarkerRef.current) {
          map.removeLayer(addGpsMarkerRef.current);
        }
        const gpsIcon = L.divIcon({
          className: 'gps-pulse-marker',
          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px #3b82f6; animation: pulse 1.5s infinite;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        addGpsMarkerRef.current = L.marker([lat, lng], { icon: gpsIcon }).addTo(map);
        addGpsMarkerRef.current.bindTooltip("Your Location", { permanent: false, direction: 'top' });
      }
    });
  };

  const [searching, setSearching] = useState(false);

  const handleSearchLocation = async () => {
    if (!location) {
      alert("Please enter a location query first.");
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
        headers: {
          'User-Agent': 'KisanAI-Agritech-Platform'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (addFarmMapInstanceRef.current) {
          const map = addFarmMapInstanceRef.current;
          map.setView([lat, lng], 15);
        }
      } else {
        alert("Location not found on map. Please try manually clicking the map or try another name.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      alert("Location search is temporarily unavailable. Please place a pin manually on the map.");
    } finally {
      setSearching(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (newFarmDrawingPoints.length < 3) {
      alert('Please select at least 3 points on the map to draw your farm boundary.');
      return;
    }

    const finalLocation = location || `${newFarmDrawingPoints[0].lat.toFixed(6)}, ${newFarmDrawingPoints[0].lng.toFixed(6)}`;

    addFarm({
      name,
      location: finalLocation,
      crop,
      area: newFarmCalculations.acres,
      areaHectares: newFarmCalculations.hectares,
      areaSqm: newFarmCalculations.sqm,
      soilType,
      irrigationMethod: irrigation,
      notes,
      coordinates: newFarmDrawingPoints
    });

    setName('');
    setLocation('');
    setNotes('');
    setNewFarmDrawingPoints([]);
    setShowAddForm(false);
  };

  return (
    <div className="farms-container">
      {/* Sidebar List of Farms */}
      <aside className="farms-list-sidebar glass-card">
        <div className="list-sidebar-header flex-between">
          <h3>My Plots</h3>
          <button className="btn btn-primary btn-sm flex-center" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Add Plot
          </button>
        </div>

        <div className="farms-nav-list">
          {farms.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No farms added.</p>
          ) : (
            farms.map((f) => (
              <button 
                key={f.id}
                className={`farm-list-btn ${activeFarm?.id === f.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveFarmId(f.id);
                  setDrawMode(false);
                  setDrawingPoints([]);
                }}
              >
                <div className="btn-details flex-between">
                  <span className="btn-name">{f.name}</span>
                  <span className="badge badge-success">{f.crop}</span>
                </div>
                <div className="btn-meta text-muted flex-between">
                  <span>{f.location.split(',')[0]}</span>
                  <span>{f.area} Acres</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Farm Details Section */}
      <main className="farm-details-main">
        {showAddForm ? (
          <motion.div 
            className="add-farm-card glass-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-header flex-between">
              <h2>Add New Farm Profile</h2>
              <div className="flex-center" style={{ gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary flex-center" onClick={() => setShowAddForm(false)}>
                  🗺️ View Farms
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateFarm} className="add-farm-form">
              <div className="form-group">
                <label className="form-label">Farm Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="e.g. Farm A (Karimnagar)" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (City/Village or Coordinates)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="e.g. Karimnagar, Telangana" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ flex: 1, minWidth: '180px' }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleSearchLocation}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search Map'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary flex-center"
                    onClick={handleLocateNewFarm}
                    style={{ gap: '0.25rem' }}
                  >
                    📍 Locate Me
                  </button>
                  {!isTracking ? (
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-center"
                      onClick={() => startTracking(true)}
                      style={{ gap: '0.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}
                    >
                      🚶 Start Mapping
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-danger flex-center"
                      onClick={stopTracking}
                      style={{ gap: '0.25rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', animation: 'pulse 1.5s infinite' }}
                    >
                      🛑 Stop Mapping
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Select Farm Location & Draw Boundary (Tap at least 3 points):</label>
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleUndoNewFarmPoint}
                      disabled={newFarmDrawingPoints.length === 0}
                    >
                      Undo Point
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleClearNewFarmBoundary}
                      disabled={newFarmDrawingPoints.length === 0}
                    >
                      Clear Map
                    </button>
                  </div>
                </div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div 
                    ref={addFarmMapRef} 
                    id="add-farm-leaflet-map" 
                    style={{ width: '100%', height: '250px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', overflow: 'hidden', marginBottom: '0.5rem' }}
                  />
                  {gpsLoading && (
                    <div className="gps-loading-overlay flex-center flex-column" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: '0.5rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      zIndex: 30,
                      color: '#ffffff',
                      gap: '0.75rem',
                      backdropFilter: 'blur(3px)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div className="spinner" style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ fontSize: '0.80rem', fontWeight: 600 }}>GPS Telemetry Link: {gpsStatus}...</span>
                    </div>
                  )}
                  {gpsError && (
                    <div className="gps-error-banner" style={{
                      position: 'absolute',
                      bottom: '15px',
                      left: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.95)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 20,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      ⚠️ {gpsError}
                    </div>
                  )}
                </div>
                <div className="flex-between font-xs text-muted">
                  <span>
                    {newFarmDrawingPoints.length > 0 
                      ? `Selected points: ${newFarmDrawingPoints.length}` 
                      : 'Click/Tap on the satellite map above to draw the outline of your farm.'}
                  </span>
                  {newFarmDrawingPoints.length > 2 && (
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      🌾 Area: {newFarmCalculations.acres} ac | {newFarmCalculations.hectares} ha | {newFarmCalculations.sqm} m² | 📏 Perimeter: {newFarmCalculations.perimeter}m
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row flex-between">
                <div className="form-group flex-1" style={{ marginRight: '1rem' }}>
                  <label className="form-label">Crop Type</label>
                  <select className="form-input" value={crop} onChange={(e) => setCrop(e.target.value)}>
                    <option value="Cotton">Cotton (పత్తి / कपास)</option>
                    <option value="Paddy">Paddy (Rice) (వరి / धान)</option>
                    <option value="Maize">Maize (Corn) (మొక్కజొన్న / मक्का)</option>
                    <option value="Wheat">Wheat (గోధుమ / गेहूं)</option>
                    <option value="Sugarcane">Sugarcane (చెరకు / गन्ना)</option>
                    <option value="Groundnut">Groundnut (వేరుశనగ / मूंगфली)</option>
                    <option value="Turmeric">Turmeric (పసుపు / हल्दी)</option>
                    <option value="Chilli">Chilli (మిరప / मिर्च)</option>
                    <option value="Pulses">Pulses (పప్పుధాన్యాలు / दलहन)</option>
                    <option value="Vegetables">Vegetables (కూరగాయలు / सब्जियां)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Farm Area (Acres)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min={1} 
                    value={area} 
                    onChange={(e) => setArea(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row flex-between">
                <div className="form-group flex-1" style={{ marginRight: '1rem' }}>
                  <label className="form-label">Soil Profile</label>
                  <select className="form-input" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                    <option value="Loam Soil">Loam Soil</option>
                    <option value="Clay Soil">Clay Soil</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Irrigation System</label>
                  <select className="form-input" value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                    <option value="Drip Irrigation">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler Irrigation</option>
                    <option value="Flood Irrigation">Flood Irrigation</option>
                    <option value="Rainfed">Rainfed (Dryland)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="e.g. soil NPK report, slope parameters, previous yield records..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Farm Profile</button>
            </form>
          </motion.div>
        ) : activeFarm ? (
          <div className="farm-info-layout">
            {/* Row 1: Profile Details & Satellite Map drawing */}
            <section className="farm-info-grid">
              {/* Profile details */}
              <div className="detail-profile-card glass-card">
                <div className="profile-header flex-between">
                  <div>
                    <h2>{activeFarm.name}</h2>
                    <p className="text-muted"><MapPin size={14} style={{ verticalAlign: 'text-bottom' }} /> {activeFarm.location}</p>
                  </div>
                  <button 
                    className="btn btn-secondary delete-farm-btn"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this farm? This deletes all transaction histories associated.')) {
                        deleteFarm(activeFarm.id);
                      }
                    }}
                    title="Delete Farm Profile"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="details-grid-specs">
                  <div className="spec-row">
                    <span className="spec-label">Acreage</span>
                    <span className="spec-value">{activeFarm.area} Acres</span>
                  </div>
                  {activeFarm.areaHectares !== undefined && activeFarm.areaHectares !== null && (
                    <div className="spec-row">
                      <span className="spec-label">Hectares</span>
                      <span className="spec-value">{activeFarm.areaHectares} ha</span>
                    </div>
                  )}
                  {activeFarm.areaSqm !== undefined && activeFarm.areaSqm !== null && (
                    <div className="spec-row">
                      <span className="spec-label">Square Meters</span>
                      <span className="spec-value">{activeFarm.areaSqm} m²</span>
                    </div>
                  )}
                  <div className="spec-row">
                    <span className="spec-label">Soil Chemistry</span>
                    <span className="spec-value">{activeFarm.soilType}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Water Feed</span>
                    <span className="spec-value">{activeFarm.irrigationMethod}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Active Crop</span>
                    <span className="spec-value badge badge-success">{activeFarm.crop}</span>
                  </div>
                </div>

                {activeFarm.notes && (
                  <div className="profile-notes">
                    <h4>Notes</h4>
                    <p>{activeFarm.notes}</p>
                  </div>
                )}
              </div>

              {/* Map boundary widget */}
              <div className="map-drawing-card glass-card">
                <div className="map-header flex-between">
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <Layers size={18} />
                    <h3>GPS Boundary Drawing Tool</h3>
                  </div>
                  {!drawMode ? (
                    <div className="flex-center" style={{ gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm flex-center" onClick={handleViewAllFarms} style={{ gap: '0.25rem' }}>
                        🗺️ View Farms
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDrawMode(true)}>
                        Draw Boundary
                      </button>
                    </div>
                  ) : (
                    <div className="flex-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm flex-center"
                        onClick={() => {
                          fetchUserLocation().then(({ lat, lng }) => {
                            if (mapInstanceRef.current) {
                              const map = mapInstanceRef.current;
                              map.setView([lat, lng], 17);
                              updateGPSMarker(map, lat, lng, gpsMarkerRef);
                            }
                          });
                        }}
                      >
                        📍 Locate Me
                      </button>

                      {!isTracking ? (
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm flex-center"
                          onClick={() => startTracking(false)}
                          style={{ gap: '0.25rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}
                        >
                          🚶 Start Mapping
                        </button>
                      ) : (
                        <button 
                          type="button"
                          className="btn btn-danger btn-sm flex-center"
                          onClick={stopTracking}
                          style={{ gap: '0.25rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', animation: 'pulse 1.5s infinite' }}
                        >
                          🛑 Stop Mapping
                        </button>
                      )}

                      <button className="btn btn-secondary btn-sm flex-center" onClick={handleUndo}>
                        <Undo size={14} /> Undo
                      </button>
                      <button className="btn btn-primary btn-sm flex-center" onClick={handleSaveBoundary}>
                        <Save size={14} /> Save Farm
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setDrawMode(false);
                        setDrawingPoints([]);
                      }}>Cancel</button>
                    </div>
                  )}
                </div>

                {/* Leaflet satellite map viewport */}
                <div className="simulated-map-viewport relative">
                  <div 
                    ref={mapRef} 
                    id="farm-leaflet-map" 
                    style={{ width: '100%', height: '100%', zIndex: 1 }}
                  />

                  {drawMode && (
                    <div className="map-draw-banner" style={{ zIndex: 10 }}>
                      Tap inside your field on the satellite map to add boundary fence pins.
                    </div>
                  )}

                  {gpsLoading && (
                    <div className="gps-loading-overlay flex-center flex-column" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      zIndex: 30,
                      color: '#ffffff',
                      gap: '0.75rem',
                      backdropFilter: 'blur(3px)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>GPS Telemetry Link: {gpsStatus}...</span>
                    </div>
                  )}

                  {gpsError && (
                    <div className="gps-error-banner" style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.95)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 20,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      ⚠️ {gpsError}
                    </div>
                  )}

                  {/* Calculations Overlay widget */}
                  {drawMode && drawingPoints.length > 2 && (
                    <div className="boundary-stats-badge" style={{ zIndex: 10 }}>
                      <div>📏 Perimeter: <strong>{boundaryCalculations.perimeter} m</strong></div>
                      <div>🌾 Acres: <strong>{boundaryCalculations.acres} ac</strong></div>
                      <div>🌍 Hectares: <strong>{boundaryCalculations.hectares} ha</strong></div>
                      <div>📐 Area: <strong>{boundaryCalculations.sqm} m²</strong></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Weather & AI Advisory Card */}
            <div className="weather-advisory-card glass-card" style={{ padding: '2rem', marginTop: '0.5rem' }}>
              <div className="card-header-weather flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div className="flex-center" style={{ gap: '0.5rem' }}>
                  <CloudSun size={20} className="text-primary" style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Weather & AI Agronomic Advisory</h3>
                </div>
                {activeWeather && (
                  <span className="weather-updated-badge font-xs" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📍 {activeFarm.crop} Microclimate
                  </span>
                )}
              </div>

              {loadingWeather ? (
                <div className="flex-center flex-column" style={{ padding: '2rem 0', gap: '1rem' }}>
                  <div className="spinner" style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--color-primary)',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p className="text-muted font-xs">Loading local weather telemetry & advisor...</p>
                </div>
              ) : activeWeather ? (
                <div className="weather-advisory-content">
                  <div className="weather-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="weather-temp-box flex-center" style={{ gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '2rem' }}>
                        {activeWeather.description === 'Rainy' ? '🌧️' : activeWeather.description === 'Cloudy' ? '🌥️' : '☀️'}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, margin: 0 }}>{activeWeather.currentTemp}°C</h4>
                        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem', margin: 0 }}>{activeWeather.description}</p>
                      </div>
                    </div>
                    
                    <div className="weather-stat-box" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span className="text-muted">Rain Chance</span>
                        <strong style={{ color: '#3b82f6' }}>{activeWeather.rainChance}%</strong>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${activeWeather.rainChance}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div className="weather-stat-box" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span className="text-muted">Humidity</span>
                        <strong style={{ color: '#10b981' }}>{activeWeather.humidity}%</strong>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${activeWeather.humidity}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div className="weather-stat-box" style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span className="text-muted">Wind Speed</span>
                        <strong>{activeWeather.windSpeed} km/h</strong>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        💨 {activeWeather.windSpeed > 15 ? 'Moderate breeze' : 'Gentle wind'}
                      </div>
                    </div>
                  </div>

                  {activeWeather.alerts && activeWeather.alerts.length > 0 && (
                    <div className="weather-alert-banner" style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <AlertTriangle size={16} />
                      {activeWeather.alerts[0]}
                    </div>
                  )}

                  <div className="ai-advisory-box" style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '1.5px dashed rgba(34, 197, 94, 0.3)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div className="flex-center" style={{ gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                      <ShieldCheck size={18} />
                      <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>Gemini AI Agronomic Advisor</h4>
                    </div>
                    <div className="advisory-text" style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-line'
                    }}>
                      {activeWeather.recommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted font-xs text-center" style={{ margin: 0 }}>Unable to load weather telemetry.</p>
              )}
            </div>

            {/* Row 2: timeline tracker & append timeline logs form */}
            <section className="farm-timeline-layout">
              <div className="timeline-activity-card glass-card">
                <div className="timeline-activity-header flex-between">
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <Activity size={18} />
                    <h3>{t('farm.timeline')}</h3>
                  </div>
                </div>

                <div className="timeline-flow-list">
                  {activeFarm.timeline.length === 0 ? (
                    <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No milestones logged for this plot.</p>
                  ) : (
                    activeFarm.timeline.map((event) => (
                      <div key={event.id} className={`timeline-flow-item category-${event.category}`}>
                        <div className="timeline-badge-marker"></div>
                        <div className="timeline-event-body">
                          <span className="timeline-event-date">{event.date}</span>
                          <p className="timeline-event-desc">{event.action}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add event to timeline */}
              <div className="timeline-post-card glass-card">
                <h3>Log Farm Action</h3>
                <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>Record fertilizing or crop milestones on timeline.</p>
                
                <form onSubmit={handleAddTimeline} className="timeline-form flex-column">
                  <div className="form-group">
                    <label className="form-label">Action Description</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. Sowing Bt Cotton Seeds" 
                      value={eventAction}
                      onChange={(e) => setEventAction(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Milestone Category</label>
                    <select 
                      className="form-input" 
                      value={eventCategory} 
                      onChange={(e) => setEventCategory(e.target.value as any)}
                    >
                      <option value="general">General</option>
                      <option value="sowing">Sowing</option>
                      <option value="fertilizer">Fertilizer</option>
                      <option value="disease">Disease Scan</option>
                      <option value="treatment">Treatment</option>
                      <option value="harvest">Harvest</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary">Add to Timeline</button>
                </form>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-center" style={{ height: '50vh' }}>No Farm selected. Add a plot to get started.</div>
        )}
      </main>

      <style>{`
        .farms-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          width: 100%;
        }

        .farms-list-sidebar {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .list-sidebar-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .farms-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .farm-list-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .farm-list-btn:hover {
          border-color: var(--text-muted);
        }

        .farm-list-btn.active {
          border-color: var(--color-primary);
          background-color: var(--color-light-green);
        }

        html[data-theme='dark'] .farm-list-btn.active {
          background-color: rgba(22, 163, 74, 0.15);
        }

        .btn-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .btn-meta {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        /* Detail main layout */
        .farm-details-main {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .farm-info-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .farm-info-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1.5rem;
        }

        .detail-profile-card {
          background-color: var(--bg-primary);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .delete-farm-btn {
          color: var(--color-danger);
          padding: 0.5rem;
          height: 36px;
        }

        .delete-farm-btn:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }

        .details-grid-specs {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }

        .spec-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .spec-value {
          font-weight: 700;
        }

        .profile-notes h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .profile-notes p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Map drawing card visual style */
        .map-drawing-card {
          background-color: var(--bg-primary);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .simulated-map-viewport {
          height: 320px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: #1e293b;
          border: 1px solid var(--border-color);
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }



        /* Custom marker classes */
        .custom-map-marker, .custom-drawing-pin {
          background: transparent !important;
          border: none !important;
        }

        .marker-tooltip-num {
          background-color: #3b82f6 !important;
          border: 1px solid #ffffff !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 0.7rem !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: var(--radius-sm) !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
        }

        .map-draw-banner {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: rgba(15, 23, 42, 0.8);
          color: #f8fafc;
          font-size: 0.75rem;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
          z-index: 20;
          backdrop-filter: blur(4px);
        }

        .boundary-stats-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background-color: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.8rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          color: #1e293b;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          box-shadow: var(--shadow-md);
        }

        html[data-theme='dark'] .boundary-stats-badge {
          background-color: rgba(30, 41, 59, 0.95);
          color: #f8fafc;
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* Timeline Activity grid elements */
        .farm-timeline-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1.5rem;
        }

        .timeline-activity-card {
          background-color: var(--bg-primary);
          padding: 2rem;
        }

        .timeline-flow-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          padding-left: 1.5rem;
          margin-top: 1.5rem;
        }

        .timeline-flow-list::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 4px;
          bottom: 0;
          width: 2px;
          background-color: var(--border-color);
        }

        .timeline-flow-item {
          position: relative;
        }

        .timeline-badge-marker {
          position: absolute;
          left: -19px;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: var(--radius-full);
          background-color: var(--border-color);
          border: 2px solid var(--bg-primary);
        }

        .timeline-flow-item.category-sowing .timeline-badge-marker {
          background-color: #3B82F6;
        }

        .timeline-flow-item.category-fertilizer .timeline-badge-marker {
          background-color: #F59E0B;
        }

        .timeline-flow-item.category-disease .timeline-badge-marker {
          background-color: var(--color-danger);
        }

        .timeline-flow-item.category-harvest .timeline-badge-marker {
          background-color: var(--color-primary);
        }

        .timeline-event-body {
          display: flex;
          flex-direction: column;
        }

        .timeline-event-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .timeline-event-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
          font-weight: 500;
        }

        .timeline-post-card {
          background-color: var(--bg-primary);
          padding: 2rem;
          height: fit-content;
        }

        .add-farm-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 1024px) {
          .farms-container {
            grid-template-columns: 1fr;
          }
          .farm-info-grid {
            grid-template-columns: 1fr;
          }
          .farm-timeline-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
