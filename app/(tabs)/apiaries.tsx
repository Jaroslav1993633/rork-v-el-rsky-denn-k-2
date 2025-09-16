import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Plus, Edit3, Trash2, Navigation, ExternalLink } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import type { Apiary } from '@/types/beekeeping';

const FLIGHT_RANGES = [
  { distance: 2, label: '2 km - efektívna letová vzdialenosť', color: '#22c55e' },
  { distance: 3.5, label: '3,5 km - dobrá letová vzdialenosť', color: '#f59e0b' },
  { distance: 5, label: '5 km - neefektívna letová vzdialenosť', color: '#ef4444' },
];

export default function ApiariesScreen() {
  const { apiaries, hives, addApiary, updateApiary, deleteApiary } = useBeekeeping();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApiary, setEditingApiary] = useState<Apiary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      address: '',
      description: '',
    });
  };

  const handleAddApiary = () => {
    if (!formData.name.trim() || !formData.latitude.trim() || !formData.longitude.trim()) {
      Alert.alert('Chyba', 'Vyplňte názov vcelnice a súradnice.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Chyba', 'Neplatné súradnice. Zadajte platné GPS súradnice.');
      return;
    }

    addApiary({
      name: formData.name.trim(),
      location: {
        latitude: lat,
        longitude: lng,
        address: formData.address.trim() || undefined,
      },
      description: formData.description.trim() || undefined,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditApiary = () => {
    if (!editingApiary || !formData.name.trim() || !formData.latitude.trim() || !formData.longitude.trim()) {
      Alert.alert('Chyba', 'Vyplňte názov vcelnice a súradnice.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Chyba', 'Neplatné súradnice. Zadajte platné GPS súradnice.');
      return;
    }

    updateApiary(editingApiary.id, {
      name: formData.name.trim(),
      location: {
        latitude: lat,
        longitude: lng,
        address: formData.address.trim() || undefined,
      },
      description: formData.description.trim() || undefined,
    });

    resetForm();
    setEditingApiary(null);
  };

  const handleDeleteApiary = (apiary: Apiary) => {
    const hivesInApiary = hives.filter(hive => hive.apiaryId === apiary.id && !hive.isDeleted);
    
    if (hivesInApiary.length > 0) {
      Alert.alert(
        'Nemožno zmazať',
        `Vcelnica obsahuje ${hivesInApiary.length} úľov. Najprv presuňte alebo zrušte úle.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Zmazať vcelicu',
      `Naozaj chcete zmazať vcelicu "${apiary.name}"?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Zmazať',
          style: 'destructive',
          onPress: () => deleteApiary(apiary.id),
        },
      ]
    );
  };

  const openInMaps = (apiary: Apiary) => {
    const { latitude, longitude } = apiary.location;
    const label = encodeURIComponent(apiary.name);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    }
  };

  const openEditModal = (apiary: Apiary) => {
    setEditingApiary(apiary);
    setFormData({
      name: apiary.name,
      latitude: apiary.location.latitude.toString(),
      longitude: apiary.location.longitude.toString(),
      address: apiary.location.address || '',
      description: apiary.description || '',
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingApiary(null);
    resetForm();
  };

  const getHiveCountForApiary = (apiaryId: string) => {
    return hives.filter(hive => hive.apiaryId === apiaryId && !hive.isDeleted).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vcelnice</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#ffffff" size={20} />
          <Text style={styles.addButtonText}>Pridať</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {apiaries.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin color="#9ca3af" size={48} />
            <Text style={styles.emptyTitle}>Žiadne vcelnice</Text>
            <Text style={styles.emptyDescription}>
              Pridajte svoju prvú vcelicu a sledujte letový radius vašich včiel
            </Text>
          </View>
        ) : (
          apiaries.map((apiary) => {
            const hiveCount = getHiveCountForApiary(apiary.id);
            
            return (
              <TouchableOpacity 
                key={apiary.id} 
                style={styles.apiaryCard}
                onPress={() => router.push(`/apiary/${apiary.id}`)}
              >
                <View style={styles.apiaryHeader}>
                  <View style={styles.apiaryInfo}>
                    <Text style={styles.apiaryName}>{apiary.name}</Text>
                    <Text style={styles.apiaryLocation}>
                      {apiary.location.address || `${apiary.location.latitude.toFixed(6)}, ${apiary.location.longitude.toFixed(6)}`}
                    </Text>
                    <Text style={styles.hiveCount}>
                      {hiveCount} {hiveCount === 1 ? 'úľ' : hiveCount < 5 ? 'úle' : 'úľov'}
                    </Text>
                  </View>
                  
                  <View style={styles.apiaryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openInMaps(apiary)}
                    >
                      <ExternalLink color="#6b7280" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(apiary)}
                    >
                      <Edit3 color="#6b7280" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteApiary(apiary)}
                    >
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {apiary.description && (
                  <Text style={styles.apiaryDescription}>{apiary.description}</Text>
                )}

                <View style={styles.flightRanges}>
                  <Text style={styles.flightRangesTitle}>Letový radius včiel:</Text>
                  {FLIGHT_RANGES.map((range) => (
                    <View key={range.distance} style={styles.flightRange}>
                      <View style={[styles.rangeIndicator, { backgroundColor: range.color }]} />
                      <Text style={styles.rangeLabel}>{range.label}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showAddModal || editingApiary !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelButton}>Zrušiť</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingApiary ? 'Upraviť vcelicu' : 'Pridať vcelicu'}
            </Text>
            <TouchableOpacity
              onPress={editingApiary ? handleEditApiary : handleAddApiary}
            >
              <Text style={styles.saveButton}>Uložiť</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Názov vcelnice *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Napr. Hlavná vcelnica"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GPS súradnice *</Text>
              <View style={styles.coordinatesRow}>
                <TextInput
                  style={[styles.textInput, styles.coordinateInput]}
                  value={formData.latitude}
                  onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                  placeholder="Zemepisná šírka"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.textInput, styles.coordinateInput]}
                  value={formData.longitude}
                  onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                  placeholder="Zemepisná dĺžka"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.inputHint}>
                Príklad: 48.148598, 17.107748
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresa</Text>
              <TextInput
                style={styles.textInput}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Napr. Bratislava, Slovensko"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Popis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Dodatočné informácie o vcelnici..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.infoBox}>
              <Navigation color="#3b82f6" size={20} />
              <Text style={styles.infoText}>
                GPS súradnice môžete získať z Google Maps alebo inej mapovej aplikácie. 
                Dlho stlačte na miesto na mape a skopírujte súradnice.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  apiaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  apiaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  apiaryInfo: {
    flex: 1,
  },
  apiaryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  apiaryLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  hiveCount: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  apiaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  apiaryDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  flightRanges: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  flightRangesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  flightRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rangeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
    marginLeft: 8,
  },
});