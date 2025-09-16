import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { MapPin, Edit3, Save, X, Satellite, Map as MapIcon } from 'lucide-react-native';
import * as Location from 'expo-location';

interface MapViewProps {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  isEditing: boolean;
  mapType: 'standard' | 'satellite';
  onMapTypeChange: (type: 'standard' | 'satellite') => void;
}

// OpenStreetMap-based map visualization
const WebMapView: React.FC<MapViewProps> = ({ location, onLocationChange, isEditing, mapType, onMapTypeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [markerPosition, setMarkerPosition] = useState({ x: 0, y: 0 });
  
  const zoom = 15;
  const tileSize = 256;
  
  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (lat: number, lng: number) => {
    const x = (lng + 180) / 360 * Math.pow(2, zoom) * tileSize;
    const latRad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom) * tileSize;
    return { x, y };
  };
  
  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    const lng = x / (Math.pow(2, zoom) * tileSize) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / (Math.pow(2, zoom) * tileSize);
    const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { latitude: lat, longitude: lng };
  };
  
  const centerPixel = latLngToPixel(location.latitude, location.longitude);
  const mapWidth = 600;
  const mapHeight = 400;
  
  // Calculate tile bounds
  const startX = Math.floor((centerPixel.x - mapWidth / 2) / tileSize);
  const startY = Math.floor((centerPixel.y - mapHeight / 2) / tileSize);
  const endX = Math.ceil((centerPixel.x + mapWidth / 2) / tileSize);
  const endY = Math.ceil((centerPixel.y + mapHeight / 2) / tileSize);
  
  const handleMouseDown = (event: any) => {
    if (!isEditing) return;
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragStart({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  
  const handleMouseMove = (event: any) => {
    if (!isDragging || !isEditing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    // Keep within bounds
    const boundedX = Math.max(20, Math.min(rect.width - 20, currentX));
    const boundedY = Math.max(20, Math.min(rect.height - 20, currentY));
    
    setMarkerPosition({ x: boundedX, y: boundedY });
    
    // Convert to lat/lng
    if (onLocationChange) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = boundedX - centerX;
      const offsetY = boundedY - centerY;
      
      const pixelX = centerPixel.x + offsetX;
      const pixelY = centerPixel.y + offsetY;
      
      const newLocation = pixelToLatLng(pixelX, pixelY);
      onLocationChange(newLocation);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const getTileUrl = (x: number, y: number, z: number) => {
    if (mapType === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  };
  
  // Calculate flight radius circles in pixels
  const metersPerPixel = 156543.03392 * Math.cos(location.latitude * Math.PI / 180) / Math.pow(2, zoom);
  const radius2km = (2000 / metersPerPixel);
  const radius3_5km = (3500 / metersPerPixel);
  const radius5km = (5000 / metersPerPixel);
  
  return (
    <div
      style={{
        ...styles.webMapContainer,
        position: 'relative',
        cursor: isEditing ? 'crosshair' : 'default',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map tiles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}>
        {Array.from({ length: endY - startY + 1 }, (_, i) => startY + i).map(y =>
          Array.from({ length: endX - startX + 1 }, (_, i) => startX + i).map(x => {
            const tileX = (x * tileSize) - (centerPixel.x - mapWidth / 2);
            const tileY = (y * tileSize) - (centerPixel.y - mapHeight / 2);
            
            return (
              <img
                key={`${x}-${y}`}
                src={getTileUrl(x, y, zoom)}
                style={{
                  position: 'absolute',
                  left: tileX,
                  top: tileY,
                  width: tileSize,
                  height: tileSize,
                  pointerEvents: 'none',
                }}
                alt="Map tile"
              />
            );
          })
        )}
      </div>
      
      {/* Flight radius circles */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: radius5km * 2,
        height: radius5km * 2,
        borderRadius: '50%',
        border: '2px solid #ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        opacity: 0.7,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: radius3_5km * 2,
        height: radius3_5km * 2,
        borderRadius: '50%',
        border: '2px solid #f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        opacity: 0.8,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: radius2km * 2,
        height: radius2km * 2,
        borderRadius: '50%',
        border: '2px solid #22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        opacity: 0.9,
        pointerEvents: 'none',
      }} />
      
      {/* Apiary marker */}
      <div style={{
        position: 'absolute',
        top: markerPosition.y || '50%',
        left: markerPosition.x || '50%',
        transform: 'translate(-50%, -50%)',
        width: '24px',
        height: '24px',
        backgroundColor: '#22c55e',
        borderRadius: '50%',
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: isEditing ? 'grab' : 'default',
        zIndex: 10,
        pointerEvents: isEditing ? 'auto' : 'none',
      }} />
      
      {/* Map type toggle */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <button
          style={{
            padding: '8px 12px',
            border: 'none',
            backgroundColor: mapType === 'standard' ? '#3b82f6' : 'transparent',
            color: mapType === 'standard' ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onClick={() => onMapTypeChange('standard')}
        >
          <MapIcon size={14} />
          Mapa
        </button>
        <button
          style={{
            padding: '8px 12px',
            border: 'none',
            backgroundColor: mapType === 'satellite' ? '#3b82f6' : 'transparent',
            color: mapType === 'satellite' ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onClick={() => onMapTypeChange('satellite')}
        >
          <Satellite size={14} />
          Satelit
        </button>
      </div>
      
      {/* Coordinate display */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#374151',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </div>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#374151',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '180px',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Letové vzdialenosti:</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%', marginRight: '8px' }} />
          <span>2 km - efektívna</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '8px' }} />
          <span>3,5 km - dobrá</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }} />
          <span>5 km - neefektívna</span>
        </div>
      </div>
      
      {isEditing && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          Kliknite a ťahajte pre zmenu polohy
        </div>
      )}
    </div>
  );
};

// Mobile Map Component
const MobileMapView: React.FC<MapViewProps> = ({ location, mapType, onMapTypeChange }) => {
  return (
    <View style={styles.mobileMapContainer}>
      <View style={styles.mobileMapHeader}>
        <View style={styles.mobileMapTitleContainer}>
          <MapPin size={24} color="#22c55e" />
          <Text style={styles.mobileMapTitle}>Poloha včelnice</Text>
        </View>
        
        <View style={styles.mapTypeToggle}>
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === 'standard' && styles.mapTypeButtonActive]}
            onPress={() => onMapTypeChange('standard')}
          >
            <MapIcon size={16} color={mapType === 'standard' ? 'white' : '#374151'} />
            <Text style={[styles.mapTypeButtonText, mapType === 'standard' && styles.mapTypeButtonTextActive]}>Mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === 'satellite' && styles.mapTypeButtonActive]}
            onPress={() => onMapTypeChange('satellite')}
          >
            <Satellite size={16} color={mapType === 'satellite' ? 'white' : '#374151'} />
            <Text style={[styles.mapTypeButtonText, mapType === 'satellite' && styles.mapTypeButtonTextActive]}>Satelit</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>Súradnice:</Text>
        <Text style={styles.locationValue}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        {location.address && (
          <>
            <Text style={styles.locationLabel}>Adresa:</Text>
            <Text style={styles.locationValue}>{location.address}</Text>
          </>
        )}
      </View>
      
      <View style={styles.radiusInfo}>
        <Text style={styles.radiusTitle}>Letové vzdialenosti včiel:</Text>
        <View style={styles.radiusItem}>
          <View style={[styles.radiusColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.radiusText}>2 km - efektívna letová vzdialenosť</Text>
        </View>
        <View style={styles.radiusItem}>
          <View style={[styles.radiusColor, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.radiusText}>3,5 km - dobrá letová vzdialenosť</Text>
        </View>
        <View style={styles.radiusItem}>
          <View style={[styles.radiusColor, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.radiusText}>5 km - neefektívna letová vzdialenosť</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.openMapButton}
        onPress={() => {
          const url = Platform.select({
            ios: `maps:${location.latitude},${location.longitude}`,
            android: `geo:${location.latitude},${location.longitude}?z=13`,
          });
          if (url) {
            console.log('Opening native maps:', url);
          }
        }}
      >
        <MapPin size={20} color="white" />
        <Text style={styles.openMapButtonText}>Otvoriť v mapách</Text>
      </TouchableOpacity>
    </View>
  );
};

// Platform-specific map component
const MapViewComponent = Platform.OS === 'web' ? WebMapView : MobileMapView;

export default function MapScreen() {
  const { getCurrentApiary, updateApiary } = useBeekeeping();
  const [isEditing, setIsEditing] = useState(false);
  const [tempLocation, setTempLocation] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  
  const currentApiary = getCurrentApiary();
  
  if (!currentApiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noApiaryContainer}>
          <MapPin size={48} color="#6b7280" />
          <Text style={styles.noApiaryText}>Žiadna včelnica nie je vybraná</Text>
          <Text style={styles.noApiarySubtext}>
            Vyberte včelnicu v sekcii úle pre zobrazenie mapy
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const handleLocationChange = (newLocation: { latitude: number; longitude: number }) => {
    setTempLocation({
      ...currentApiary.location,
      ...newLocation,
    });
  };
  
  const handleSaveLocation = () => {
    if (tempLocation) {
      updateApiary(currentApiary.id, {
        location: tempLocation,
      });
      setTempLocation(null);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setTempLocation(null);
    setIsEditing(false);
  };
  
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert('Chyba', 'Povolenie na prístup k polohe bolo zamietnuté');
        }
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: currentApiary.location.address,
      };
      
      setTempLocation(newLocation);
      setIsEditing(true);
    } catch {
      if (Platform.OS !== 'web') {
        Alert.alert('Chyba', 'Nepodarilo sa získať aktuálnu polohu');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  const displayLocation = tempLocation || currentApiary.location;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mapa včelnice</Text>
          <Text style={styles.subtitle}>{currentApiary.name}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.headerButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <X size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.saveButton]}
                onPress={handleSaveLocation}
              >
                <Save size={20} color="#22c55e" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <MapViewComponent
          location={displayLocation}
          onLocationChange={handleLocationChange}
          isEditing={isEditing}
          mapType={mapType}
          onMapTypeChange={setMapType}
        />
      </View>
      
      {isEditing && (
        <View style={styles.editingPanel}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <MapPin size={20} color="white" />
            <Text style={styles.currentLocationButtonText}>
              {isLoadingLocation ? 'Získavam polohu...' : 'Použiť aktuálnu polohu'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.editingHint}>
            {Platform.OS === 'web' 
              ? 'Presuňte značku na mape pre zmenu polohy včelnice'
              : 'Použite tlačidlo vyššie pre nastavenie aktuálnej polohy'
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#dcfce7',
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mobileMapContainer: {
    flex: 1,
    padding: 20,
  },
  mobileMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mobileMapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileMapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  locationInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  radiusInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  radiusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  radiusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  radiusText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  openMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editingPanel: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  currentLocationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editingHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  noApiaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noApiaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  noApiarySubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#f3f4f6',
    position: 'relative',
    overflow: 'hidden',
  } as any,
  mapTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  mapTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  mapTypeButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  mapTypeButtonTextActive: {
    color: 'white',
  },
});