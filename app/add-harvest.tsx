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

type YieldType = 'med' | 'pel' | 'propolis' | 'ine';

export default function AddHarvestScreen() {
  const { getCurrentApiaryHives, addYield, getCurrentApiary } = useBeekeeping();
  const currentApiary = getCurrentApiary();
  const hives = getCurrentApiaryHives();
  const insets = useSafeAreaInsets();
  
  const [selectedHiveId, setSelectedHiveId] = useState<string>('');
  const [yieldType, setYieldType] = useState<YieldType>('med');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('kg');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const yieldTypes = [
    { value: 'med' as YieldType, label: 'Med' },
    { value: 'pel' as YieldType, label: 'Peľ' },
    { value: 'propolis' as YieldType, label: 'Propolis' },
    { value: 'ine' as YieldType, label: 'Iné' },
  ];

  const units = ['kg', 'g', 'l', 'ml', 'ks'];

  const handleSave = () => {
    if (!selectedHiveId) {
      Alert.alert('Chyba', 'Vyberte úľ');
      return;
    }
    
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Chyba', 'Zadajte platné množstvo');
      return;
    }

    addYield({
      hiveId: selectedHiveId,
      type: yieldType,
      amount: Number(amount),
      unit,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });

    Alert.alert('Úspech', 'Úroda bola pridaná', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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
          title: 'Pridať úrodu',
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
          <Text style={styles.sectionTitle}>Výber úľa</Text>
          {currentApiary && (
            <Text style={styles.sectionSubtitle}>Včelnica: {currentApiary.name}</Text>
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
            <View style={styles.hivesList}>
              {hives.map(hive => (
                <TouchableOpacity
                  key={hive.id}
                  style={[
                    styles.hiveItem,
                    selectedHiveId === hive.id && styles.hiveItemSelected
                  ]}
                  onPress={() => setSelectedHiveId(hive.id)}
                >
                  <Text style={[
                    styles.hiveItemText,
                    selectedHiveId === hive.id && styles.hiveItemTextSelected
                  ]}>
                    {hive.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typ úrody</Text>
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
          <Text style={styles.sectionTitle}>Množstvo a jednotka</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.unitsList}>
              {units.map(unitOption => (
                <TouchableOpacity
                  key={unitOption}
                  style={[
                    styles.unitItem,
                    unit === unitOption && styles.unitItemSelected
                  ]}
                  onPress={() => setUnit(unitOption)}
                >
                  <Text style={[
                    styles.unitItemText,
                    unit === unitOption && styles.unitItemTextSelected
                  ]}>
                    {unitOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            placeholder="Pridajte poznámky k úrode..."
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
});