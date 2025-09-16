import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import type { Apiary } from '@/types/beekeeping';

// Conditionally import react-native-maps only on native platforms
let MapView: any, Marker: any, Circle: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Circle = maps.Circle;
}

interface ApiaryMapProps {
  apiary: Apiary;
  style?: any;
}

const FLIGHT_RANGES = [
  { distance: 2000, color: 'rgba(34, 197, 94, 0.2)', strokeColor: '#22c55e' }, // 2km - green
  { distance: 3500, color: 'rgba(245, 158, 11, 0.15)', strokeColor: '#f59e0b' }, // 3.5km - orange
  { distance: 5000, color: 'rgba(239, 68, 68, 0.1)', strokeColor: '#ef4444' }, // 5km - red
];

export default function ApiaryMap({ apiary, style }: ApiaryMapProps) {
  if (Platform.OS === 'web') {
    // Fallback for web - show a simple placeholder
    return (
      <View style={[styles.webFallback, style]}>
        <View style={styles.webMapPlaceholder}>
          <View style={styles.webMarker} />
          {FLIGHT_RANGES.map((range, index) => (
            <View
              key={range.distance}
              style={[
                styles.webCircle,
                {
                  width: 80 + index * 40,
                  height: 80 + index * 40,
                  borderColor: range.strokeColor,
                  backgroundColor: range.color,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  const region = {
    latitude: apiary.location.latitude,
    longitude: apiary.location.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Flight range circles */}
        {FLIGHT_RANGES.map((range) => (
          <Circle
            key={range.distance}
            center={{
              latitude: apiary.location.latitude,
              longitude: apiary.location.longitude,
            }}
            radius={range.distance}
            fillColor={range.color}
            strokeColor={range.strokeColor}
            strokeWidth={2}
          />
        ))}
        
        {/* Apiary marker */}
        <Marker
          coordinate={{
            latitude: apiary.location.latitude,
            longitude: apiary.location.longitude,
          }}
          title={apiary.name}
          description={apiary.location.address || 'Vcelnica'}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webMapPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  webMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    position: 'absolute',
    zIndex: 10,
  },
  webCircle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
  },
});