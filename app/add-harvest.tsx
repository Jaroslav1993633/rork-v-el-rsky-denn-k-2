import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Save, Calendar } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type YieldType = 'med' | 'pel' | 'propolis' | 'vosk';

export default function AddHarvestScreen() {
  const { getCurrentApiaryHives, addYield, getCurrentApiary } = useBeekeeping();
  const currentApiary = getCurrentApiary();
  const hives = getCurrentApiaryHives();
  const insets = useSafeAreaInsets();
  
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);
  const [yieldType, setYieldType] = useState<YieldType>('med');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const yieldTypes = [
    { value: 'med' as YieldType, label: 'Med' },
    { value: 'pel' as YieldType, label: 'Peľ' },
    { value: 'propolis' as YieldType, label: 'Propolis' },
    { value: 'vosk' as YieldType, label: 'Vosk' },
  ];

  const handleSave = () => {
    console.log('=== SAVE YIELD DEBUG ===');
    console.log('handleSave called');
    console.log('selectedHiveIds:', selectedHiveIds);
    console.log('amount:', amount, 'type:', typeof amount);
    console.log('yieldType:', yieldType);
    console.log('date:', date);
    console.log('notes:', notes);
    console.log('hives available:', hives.length);
    console.log('currentApiary:', currentApiary);
    
    if (selectedHiveIds.length === 0) {
      console.log('ERROR: No hives selected');
      Alert.alert('Chyba', 'Vyberte aspoň jeden úľ');
      return;
    }
    
    const numAmount = Number(amount);
    console.log('numAmount:', numAmount, 'isNaN:', isNaN(numAmount), 'isPositive:', numAmount > 0);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      console.log('ERROR: Invalid amount');
      Alert.alert('Chyba', 'Zadajte platné množstvo');
      return;
    }

    try {
      const amountPerHive = numAmount / selectedHiveIds.length;
      console.log('amountPerHive:', amountPerHive);
      console.log('About to add yields for hives:', selectedHiveIds);

      selectedHiveIds.forEach((hiveId, index) => {
        const yieldData = {
          hiveId,
          type: yieldType,
          amount: amountPerHive,
          unit: 'kg',
          date: new Date(date).toISOString(),
          notes: notes.trim() || undefined,
        };
        console.log(`Adding yield ${index + 1}/${selectedHiveIds.length}:`, yieldData);
        addYield(yieldData);
        console.log(`Yield ${index + 1} added successfully`);
      });

      console.log('All yields added successfully');
      const hiveText = selectedHiveIds.length === 1 ? 'úľa' : `${selectedHiveIds.length} úľov`;
      Alert.alert('Úspech', `Výnos bol pridaný pre ${hiveText}`, [
        { text: 'OK', onPress: () => {
          console.log('Navigating back');
          router.back();
        }}
      ]);
    } catch (error) {
      console.error('Error saving yield:', error);
      console.error('Error details:', JSON.stringify(error));
      Alert.alert('Chyba', 'Nepodarilo sa uložiť výnos');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK');
  };

  const adjustDate = (days: number) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          title: 'Pridať výnos',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft color="#111827" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Save color="#22c55e" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Výber úľov</Text>
          {currentApiary && (
            <Text style={styles.sectionSubtitle}>Včelnica: {currentApiary.name}</Text>
          )}
          {selectedHiveIds.length > 0 && (
            <Text style={styles.selectedCount}>
              Vybrané: {selectedHiveIds.length} {selectedHiveIds.length === 1 ? 'úľ' : 'úľov'}
            </Text>
          )}

          {hives.length === 0 ? (
            <View style={styles.noHivesContainer}>
              <Text style={styles.noHivesText}>
                {currentApiary 
                  ? `Žiadne úle v včelnici ${currentApiary.name}`
                  : 'Žiadne úle k dispozícii'
                }
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.selectAllContainer}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => {
                    if (selectedHiveIds.length === hives.length) {
                      setSelectedHiveIds([]);
                    } else {
                      setSelectedHiveIds(hives.map(h => h.id));
                    }
                  }}
                >
                  <Text style={styles.selectAllText}>
                    {selectedHiveIds.length === hives.length ? 'Zrušiť výber' : 'Vybrať všetky'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.hivesList}>
                {hives.map(hive => {
                  const isSelected = selectedHiveIds.includes(hive.id);
                  return (
                    <TouchableOpacity
                      key={hive.id}
                      style={[
                        styles.hiveItem,
                        isSelected && styles.hiveItemSelected
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedHiveIds(prev => prev.filter(id => id !== hive.id));
                        } else {
                          setSelectedHiveIds(prev => [...prev, hive.id]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.hiveItemText,
                        isSelected && styles.hiveItemTextSelected
                      ]}>
                        {hive.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typ výnosu</Text>
          <View style={styles.typesList}>
            {yieldTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeItem,
                  yieldType === type.value && styles.typeItemSelected
                ]}
                onPress={() => setYieldType(type.value)}
              >
                <Text style={[
                  styles.typeItemText,
                  yieldType === type.value && styles.typeItemTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Množstvo (kg)</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.unitLabel}>kg</Text>
            {selectedHiveIds.length > 1 && (
              <Text style={styles.distributionNote}>
                Množstvo bude rozdelené medzi {selectedHiveIds.length} úľov
                ({(Number(amount) / selectedHiveIds.length || 0).toFixed(2)} kg na úľ)
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dátum</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateControls}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => adjustDate(-1)}
              >
                <Text style={styles.dateButtonText}>-1 deň</Text>
              </TouchableOpacity>
              
              <View style={styles.dateDisplay}>
                <Calendar color="#6b7280" size={20} />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => adjustDate(1)}
              >
                <Text style={styles.dateButtonText}>+1 deň</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.todayButton}
              onPress={() => setDate(new Date().toISOString().split('T')[0])}
            >
              <Text style={styles.todayButtonText}>Dnes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poznámky (voliteľné)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Pridajte poznámky k výnosu..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
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
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  hivesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hiveItem: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hiveItemSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  hiveItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  hiveItemTextSelected: {
    color: '#ffffff',
  },
  typesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeItem: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  typeItemSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  typeItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  typeItemTextSelected: {
    color: '#ffffff',
  },
  amountContainer: {
    gap: 16,
  },
  amountInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  unitsList: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  unitItem: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 50,
    alignItems: 'center',
  },
  unitItemSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  unitItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  unitItemTextSelected: {
    color: '#ffffff',
  },
  selectAllContainer: {
    marginBottom: 12,
  },
  selectAllButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedCount: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 12,
  },
  unitLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 8,
  },
  distributionNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateContainer: {
    gap: 16,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  todayButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  noHivesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noHivesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
    fontWeight: '500',
  },
});