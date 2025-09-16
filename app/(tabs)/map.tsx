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
import { MapPin, Edit3, Save, X } from 'lucide-react-native';
import * as Location from 'expo-location';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  isEditing: boolean;
}

// Web Map Component
const WebMapView: React.FC<MapViewProps> = ({ location, onLocationChange, isEditing }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const initializeMap = React.useCallback(() => {
    const mapElement = document.getElementById('google-map');
    if (!mapElement || !window.google) return;
    
    const map = new window.google.maps.Map(mapElement, {
      center: { lat: location.latitude, lng: location.longitude },
      zoom: 13,
      mapTypeId: 'satellite',
    });
    
    // Add marker for apiary
    const marker = new window.google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: map,
      title: 'Včelnica',
      draggable: isEditing,
    });
    
    // Add flight radius circles
    const circles = [
      { radius: 2000, color: '#22c55e' },
      { radius: 3500, color: '#f59e0b' },
      { radius: 5000, color: '#ef4444' },
    ];
    
    circles.forEach(({ radius, color }) => {
      new window.google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.15,
        map: map,
        center: { lat: location.latitude, lng: location.longitude },
        radius: radius,
      });
    });
    
    if (isEditing && onLocationChange) {
      marker.addListener('dragend', (event: any) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        onLocationChange({
          latitude: newLat,
          longitude: newLng,
        });
      });
    }
  }, [location, isEditing, onLocationChange]);
  
  useEffect(() => {
    // Load Google Maps API for web
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTuTlWnAGHEFHYttlxlXRIe0&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    if (mapLoaded && location) {
      initializeMap();
    }
  }, [mapLoaded, location, initializeMap]);
  
  return (
    <div
      id="google-map"
      style={styles.webMapContainer}
    >
      {!mapLoaded && (
        <div style={styles.webMapLoading}>
          <Text>Načítava sa mapa...</Text>
        </div>
      )}
    </div>
  );
};

// Mobile Map Component
const MobileMapView: React.FC<MapViewProps> = ({ location }) => {
  return (
    <View style={styles.mobileMapContainer}>
      <View style={styles.mobileMapHeader}>
        <MapPin size={24} color="#22c55e" />
        <Text style={styles.mobileMapTitle}>Poloha včelnice</Text>
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
    alignItems: 'center',
    marginBottom: 20,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  webMapLoading: {
    textAlign: 'center',
    color: '#6b7280',
  } as any,
});