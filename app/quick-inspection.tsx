import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuickInspectionScreen() {
  const { hives, addInspection } = useBeekeeping();
  const insets = useSafeAreaInsets();
  const [selectedHiveId, setSelectedHiveId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSave = () => {
    if (!selectedHiveId) {
      Alert.alert('Chyba', 'Prosím vyberte úľ');
      return;
    }

    if (!notes.trim()) {
      Alert.alert('Chyba', 'Prosím zadajte poznámky k prehliadke');
      return;
    }

    addInspection({
      hiveId: selectedHiveId,
      date: new Date().toISOString(),
      notes: notes.trim(),
    });

    Alert.alert('Úspech', 'Prehliadka bola pridaná', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#6b7280" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Rýchla prehliadka</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Check color="#22c55e" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poznámky k prehliadke</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Opíšte čo ste robili pri prehliadke..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vyberte úľ</Text>
          <View style={styles.hivesCompactGrid}>
            {hives.map((hive) => (
              <TouchableOpacity
                key={hive.id}
                style={[
                  styles.compactHiveItem,
                  selectedHiveId === hive.id && styles.selectedCompactHiveItem
                ]}
                onPress={() => setSelectedHiveId(hive.id)}
              >
                <View style={[
                  styles.checkbox,
                  selectedHiveId === hive.id && styles.selectedCheckbox
                ]}>
                  {selectedHiveId === hive.id && (
                    <Check color="#ffffff" size={12} />
                  )}
                </View>
                <Text style={[
                  styles.compactHiveName,
                  selectedHiveId === hive.id && styles.selectedCompactHiveName
                ]}>
                  {hive.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  hivesCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactHiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  selectedCompactHiveItem: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  compactHiveName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  selectedCompactHiveName: {
    color: '#22c55e',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
});