import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { MapPin, ExternalLink, Edit3, ArrowLeft } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import ApiaryMap from '@/components/ApiaryMap';

const FLIGHT_RANGES = [
  { distance: 2, label: '2 km - efektívna letová vzdialenosť', color: '#22c55e' },
  { distance: 3.5, label: '3,5 km - dobrá letová vzdialenosť', color: '#f59e0b' },
  { distance: 5, label: '5 km - neefektívna letová vzdialenosť', color: '#ef4444' },
];

export default function ApiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiaries, hives } = useBeekeeping();
  
  const apiary = apiaries.find(a => a.id === id);
  
  if (!apiary) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Vcelnica nenájdená' }} />
        <View style={styles.errorContainer}>
          <MapPin color="#9ca3af" size={48} />
          <Text style={styles.errorTitle}>Vcelnica nenájdená</Text>
          <Text style={styles.errorDescription}>
            Požadovaná vcelnica neexistuje alebo bola zmazaná.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#ffffff" size={20} />
            <Text style={styles.backButtonText}>Späť</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hivesInApiary = hives.filter(hive => hive.apiaryId === apiary.id && !hive.isDeleted);

  const openInMaps = () => {
    const { latitude, longitude } = apiary.location;
    const label = encodeURIComponent(apiary.name);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: apiary.name,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/apiaries')}
            >
              <Edit3 color="#22c55e" size={20} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <ApiaryMap apiary={apiary} style={styles.map} />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderLeft}>
              <MapPin color="#22c55e" size={24} />
              <Text style={styles.apiaryName}>{apiary.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={openInMaps}
            >
              <ExternalLink color="#6b7280" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Súradnice</Text>
              <Text style={styles.infoValue}>
                {apiary.location.latitude.toFixed(6)}, {apiary.location.longitude.toFixed(6)}
              </Text>
            </View>

            {apiary.location.address && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Adresa</Text>
                <Text style={styles.infoValue}>{apiary.location.address}</Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Počet úľov</Text>
              <Text style={styles.infoValue}>
                {hivesInApiary.length} {hivesInApiary.length === 1 ? 'úľ' : hivesInApiary.length < 5 ? 'úle' : 'úľov'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Vytvorené</Text>
              <Text style={styles.infoValue}>
                {new Date(apiary.createdAt).toLocaleDateString('sk-SK')}
              </Text>
            </View>
          </View>

          {apiary.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Popis</Text>
              <Text style={styles.descriptionText}>{apiary.description}</Text>
            </View>
          )}
        </View>

        {/* Flight Ranges Section */}
        <View style={styles.rangesSection}>
          <Text style={styles.sectionTitle}>Letový radius včiel</Text>
          <Text style={styles.sectionDescription}>
            Včely môžu lietať až do vzdialenosti 5 km od vcelnice, ale efektívnosť zberu nektáru klesá so vzdialenosťou.
          </Text>
          
          <View style={styles.rangesList}>
            {FLIGHT_RANGES.map((range) => (
              <View key={range.distance} style={styles.rangeItem}>
                <View style={[styles.rangeIndicator, { backgroundColor: range.color }]} />
                <Text style={styles.rangeLabel}>{range.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hives Section */}
        {hivesInApiary.length > 0 && (
          <View style={styles.hivesSection}>
            <Text style={styles.sectionTitle}>Úle v tejto vcelnici</Text>
            <View style={styles.hivesList}>
              {hivesInApiary.map((hive) => (
                <TouchableOpacity
                  key={hive.id}
                  style={styles.hiveItem}
                  onPress={() => router.push(`/hive/${hive.id}`)}
                >
                  <Text style={styles.hiveName}>{hive.name}</Text>
                  <Text style={styles.hiveType}>{hive.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  apiaryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  mapsButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  rangesSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  rangesList: {
    gap: 12,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  rangeLabel: {
    fontSize: 14,
    color: '#374151',
  },
  hivesSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  hivesList: {
    gap: 12,
  },
  hiveItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hiveName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  hiveType: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
  },
});