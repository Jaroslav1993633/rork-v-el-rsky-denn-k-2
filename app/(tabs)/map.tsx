import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { MapPin, Edit3, Save, X, Satellite, Map as MapIcon, Navigation, ExternalLink } from 'lucide-react-native';
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

// Interactive web map with OpenStreetMap
const WebMapView: React.FC<MapViewProps> = ({ location, onLocationChange, isEditing, mapType, onMapTypeChange }) => {
  const [markerPosition, setMarkerPosition] = useState({ x: 50, y: 50 }); // Center by default
  const [mapCenter, setMapCenter] = useState({ lat: location.latitude, lng: location.longitude });
  const [isDragging, setIsDragging] = useState(false);
  
  const zoom = 14;
  
  // Simple coordinate conversion for display
  const handleMapClick = (event: any) => {
    if (!isEditing) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Keep marker within bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));
    
    setMarkerPosition({ x: boundedX, y: boundedY });
    
    // Simple lat/lng calculation based on position
    if (onLocationChange) {
      const latOffset = (boundedY - 50) * -0.01; // Negative because Y increases downward
      const lngOffset = (boundedX - 50) * 0.01;
      
      onLocationChange({
        latitude: mapCenter.lat + latOffset,
        longitude: mapCenter.lng + lngOffset,
      });
    }
  };
  
  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15`;
    window.open(url, '_blank');
  };
  
  return (
    <div
      style={{
        ...styles.webMapContainer,
        position: 'relative',
        cursor: isEditing ? 'crosshair' : 'default',
        backgroundImage: mapType === 'satellite' 
          ? `url(https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${location.longitude},${location.latitude},${zoom}/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw)`
          : `url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${location.longitude},${location.latitude},${zoom}/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={handleMapClick}
    >
      {/* Fallback pattern if map doesn't load */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, #f0f9ff 25%, transparent 25%), linear-gradient(-45deg, #f0f9ff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f9ff 75%), linear-gradient(-45deg, transparent 75%, #f0f9ff 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        opacity: 0.1,
        zIndex: 0,
      }} />
      
      {/* Flight radius circles */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        border: '3px solid #ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '210px',
        height: '210px',
        borderRadius: '50%',
        border: '3px solid #f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        opacity: 0.8,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '3px solid #22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        opacity: 0.9,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      
      {/* Apiary marker */}
      <div style={{
        position: 'absolute',
        top: `${markerPosition.y}%`,
        left: `${markerPosition.x}%`,
        transform: 'translate(-50%, -50%)',
        width: '28px',
        height: '28px',
        backgroundColor: '#22c55e',
        borderRadius: '50%',
        border: '4px solid white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: isEditing ? 'grab' : 'default',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: 'white',
          borderRadius: '50%',
        }} />
      </div>
      
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 5,
      }}>
        {/* Map type toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <button
            style={{
              padding: '10px 14px',
              border: 'none',
              backgroundColor: mapType === 'standard' ? '#3b82f6' : 'transparent',
              color: mapType === 'standard' ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => onMapTypeChange('standard')}
          >
            <MapIcon size={16} />
            Mapa
          </button>
          <button
            style={{
              padding: '10px 14px',
              border: 'none',
              backgroundColor: mapType === 'satellite' ? '#3b82f6' : 'transparent',
              color: mapType === 'satellite' ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => onMapTypeChange('satellite')}
          >
            <Satellite size={16} />
            Satelit
          </button>
        </div>
        
        {/* Open in maps button */}
        <button
          style={{
            padding: '10px 14px',
            border: 'none',
            backgroundColor: 'rgba(34, 197, 94, 0.95)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onClick={openInMaps}
        >
          <ExternalLink size={16} />
          Otvoriť v Google Maps
        </button>
      </div>
      
      {/* Coordinate display */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#374151',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 5,
      }}>
        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </div>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '14px',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#374151',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: '200px',
        zIndex: 5,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>Letové vzdialenosti:</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#22c55e', borderRadius: '50%', marginRight: '10px' }} />
          <span>2 km - efektívna</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '10px' }} />
          <span>3,5 km - dobrá</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '10px' }} />
          <span>5 km - neefektívna</span>
        </div>
      </div>
      
      {isEditing && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 5,
        }}>
          Kliknite na mapu pre zmenu polohy
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
            web: `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15`,
          });
          if (url) {
            if (Platform.OS === 'web') {
              window.open(url, '_blank');
            } else {
              Linking.openURL(url).catch(() => {
                Alert.alert('Chyba', 'Nepodarilo sa otvoriť mapy');
              });
            }
          }
        }}
      >
        <Navigation size={20} color="white" />
        <Text style={styles.openMapButtonText}>Navigovať</Text>
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