import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { Apiary } from '@/types/beekeeping';

interface ApiaryMapProps {
  apiary: Apiary;
  style?: any;
}

const FLIGHT_RANGES = [
  { distance: 2000, color: 'rgba(34, 197, 94, 0.2)', strokeColor: '#22c55e' }, // 2km - green
  { distance: 3500, color: 'rgba(245, 158, 11, 0.15)', strokeColor: '#f59e0b' }, // 3.5km - orange
  { distance: 5000, color: 'rgba(239, 68, 68, 0.1)', strokeColor: '#ef4444' }, // 5km - red
];



// Web fallback component
function WebMapView({ apiary, style }: ApiaryMapProps) {
  return (
    <View style={[styles.webFallback, style]}>
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapText}>{apiary.name}</Text>
        <Text style={styles.webMapSubtext}>
          {apiary.location.address || `${apiary.location.latitude.toFixed(4)}, ${apiary.location.longitude.toFixed(4)}`}
        </Text>
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

export default function ApiaryMap({ apiary, style }: ApiaryMapProps) {
  // Always use web fallback for now to avoid bundling issues
  return <WebMapView apiary={apiary} style={style} />;
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
  webMapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  webMapSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
});