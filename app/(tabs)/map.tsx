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

interface MapViewProps {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  isEditing: boolean;
}

// Simple coordinate-based map visualization
const SimpleMapView: React.FC<MapViewProps> = ({ location, onLocationChange, isEditing }) => {
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (event: any) => {
    if (!isEditing) return;
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  
  const handleMouseMove = (event: any) => {
    if (!isDragging || !isEditing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;
    
    // Keep within bounds
    const boundedX = Math.max(20, Math.min(rect.width - 20, newX));
    const boundedY = Math.max(20, Math.min(rect.height - 20, newY));
    
    setDragPosition({ x: boundedX, y: boundedY });
    
    // Convert position to approximate coordinates (simplified)
    if (onLocationChange) {
      const latOffset = (boundedY - rect.height / 2) * -0.001;
      const lngOffset = (boundedX - rect.width / 2) * 0.001;
      onLocationChange({
        latitude: location.latitude + latOffset,
        longitude: location.longitude + lngOffset,
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    // Reset drag position when location changes externally
    setDragPosition({ x: 0, y: 0 });
  }, [location]);
  
  return (
    <div
      style={{
        ...styles.webMapContainer,
        position: 'relative',
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%)',
        cursor: isEditing ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Flight radius circles */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        border: '2px solid #ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '210px',
        height: '210px',
        borderRadius: '50%',
        border: '2px solid #f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        opacity: 0.8,
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '2px solid #22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        opacity: 0.9,
      }} />
      
      {/* Apiary marker */}
      <div style={{
        position: 'absolute',
        top: dragPosition.y || '50%',
        left: dragPosition.x || '50%',
        transform: 'translate(-50%, -50%)',
        width: '24px',
        height: '24px',
        backgroundColor: '#22c55e',
        borderRadius: '50%',
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: isEditing ? 'grab' : 'default',
        zIndex: 10,
      }} />
      
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
const MapViewComponent = Platform.OS === 'web' ? SimpleMapView : MobileMapView;

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
    overflow: 'hidden',
  } as any,
});