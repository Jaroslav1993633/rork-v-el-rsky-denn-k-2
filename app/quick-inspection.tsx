import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { X, Check, Droplets, Bug, Heart } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActionType = 'inspection' | 'feeding' | 'treatment' | 'health';

const ACTION_CONFIGS = {
  inspection: {
    label: 'Prehliadka úľa',
    icon: Check,
    color: '#3b82f6',
    multiSelect: false,
  },
  feeding: {
    label: 'Kŕmenie',
    icon: Droplets,
    color: '#f59e0b',
    multiSelect: true,
  },
  treatment: {
    label: 'Liečba',
    icon: Bug,
    color: '#ef4444',
    multiSelect: true,
  },
  health: {
    label: 'Zdravotná kontrola',
    icon: Heart,
    color: '#10b981',
    multiSelect: true,
  },
};

export default function QuickInspectionScreen() {
  const { hives, addInspection } = useBeekeeping();
  const insets = useSafeAreaInsets();
  const [actionType, setActionType] = useState<ActionType>('inspection');
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const currentConfig = ACTION_CONFIGS[actionType];
  const allowsMultiSelect = currentConfig.multiSelect;

  const handleHiveToggle = (hiveId: string) => {
    if (!allowsMultiSelect) {
      setSelectedHiveIds([hiveId]);
    } else {
      setSelectedHiveIds(prev => {
        if (prev.includes(hiveId)) {
          return prev.filter(id => id !== hiveId);
        }
        return [...prev, hiveId];
      });
    }
  };

  const handleSelectAll = (value: boolean) => {
    setSelectAll(value);
    if (value) {
      setSelectedHiveIds(hives.map(h => h.id));
    } else {
      setSelectedHiveIds([]);
    }
  };

  const handleSave = () => {
    console.log('handleSave called', { selectedHiveIds, notes: notes.trim(), actionType });
    
    if (selectedHiveIds.length === 0) {
      Alert.alert('Chyba', 'Prosím vyberte aspoň jeden úľ');
      return;
    }

    if (!notes.trim()) {
      Alert.alert('Chyba', `Prosím zadajte poznámky k akcii: ${currentConfig.label}`);
      return;
    }

    const date = new Date().toISOString();
    const actionNotes = `[${currentConfig.label}] ${notes.trim()}`;
    
    try {
      selectedHiveIds.forEach(hiveId => {
        const inspectionData = {
          hiveId,
          date,
          notes: actionNotes,
        };
        console.log('Adding inspection for hive:', hiveId, inspectionData);
        addInspection(inspectionData);
      });
      
      console.log('All inspections added successfully');
      
      setNotes('');
      setSelectedHiveIds([]);
      setSelectAll(false);
      
      const message = selectedHiveIds.length === 1 
        ? `${currentConfig.label} bola pridaná`
        : `${currentConfig.label} bola pridaná pre ${selectedHiveIds.length} úľov`;
      
      Alert.alert('Úspech', message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding inspections:', error);
      Alert.alert('Chyba', `Nepodarilo sa pridať ${currentConfig.label.toLowerCase()}`);
    }
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
          <Text style={styles.sectionTitle}>Typ akcie</Text>
          <View style={styles.actionTypes}>
            {(Object.keys(ACTION_CONFIGS) as ActionType[]).map((type) => {
              const config = ACTION_CONFIGS[type];
              const Icon = config.icon;
              const isSelected = actionType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.actionTypeButton,
                    isSelected && { backgroundColor: config.color + '20', borderColor: config.color }
                  ]}
                  onPress={() => {
                    setActionType(type);
                    setSelectedHiveIds([]);
                    setSelectAll(false);
                  }}
                >
                  <Icon 
                    size={20} 
                    color={isSelected ? config.color : '#6b7280'}
                  />
                  <Text style={[
                    styles.actionTypeLabel,
                    isSelected && { color: config.color }
                  ]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poznámky k akcii</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={`Opíšte detaily akcie: ${currentConfig.label}...`}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {allowsMultiSelect ? 'Vyberte úle' : 'Vyberte úľ'}
              {selectedHiveIds.length > 0 && ` (${selectedHiveIds.length})`}
            </Text>
            {allowsMultiSelect && hives.length > 3 && (
              <View style={styles.selectAllContainer}>
                <Text style={styles.selectAllLabel}>Vybrať všetky</Text>
                <Switch
                  value={selectAll}
                  onValueChange={handleSelectAll}
                  trackColor={{ false: '#e5e7eb', true: currentConfig.color + '60' }}
                  thumbColor={selectAll ? currentConfig.color : '#f3f4f6'}
                />
              </View>
            )}
          </View>
          
          <View style={styles.hivesCompactGrid}>
            {hives.map((hive) => {
              const isSelected = selectedHiveIds.includes(hive.id);
              return (
                <TouchableOpacity
                  key={hive.id}
                  style={[
                    styles.compactHiveItem,
                    isSelected && {
                      backgroundColor: currentConfig.color + '10',
                      borderColor: currentConfig.color,
                    }
                  ]}
                  onPress={() => handleHiveToggle(hive.id)}
                >
                  <View style={[
                    styles.checkbox,
                    isSelected && {
                      backgroundColor: currentConfig.color,
                      borderColor: currentConfig.color,
                    }
                  ]}>
                    {isSelected && (
                      <Check color="#ffffff" size={12} />
                    )}
                  </View>
                  <Text style={[
                    styles.compactHiveName,
                    isSelected && {
                      color: currentConfig.color,
                      fontWeight: '600',
                    }
                  ]}>
                    {hive.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  actionTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  actionTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
});