import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { X, Check, Droplets } from 'lucide-react-native';
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
  const [notes, setNotes] = useState('');
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [successOpacity] = useState(new Animated.Value(0));

  const yieldTypes = [
    { value: 'med' as YieldType, label: 'Med' },
    { value: 'pel' as YieldType, label: 'Peľ' },
    { value: 'propolis' as YieldType, label: 'Propolis' },
    { value: 'vosk' as YieldType, label: 'Vosk' },
  ];

  const handleSave = async () => {
    console.log('=== SAVE YIELD DEBUG ===');
    console.log('handleSave called');
    console.log('selectedHiveIds:', selectedHiveIds);
    console.log('amount:', amount, 'type:', typeof amount);
    console.log('yieldType:', yieldType);
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

    setIsSaving(true);

    try {
      // NEDELÍME množstvo - každý úľ dostane plné množstvo
      console.log('Adding full amount to each hive:', numAmount);
      console.log('About to add yields for hives:', selectedHiveIds);

      selectedHiveIds.forEach((hiveId, index) => {
        const yieldData = {
          hiveId,
          type: yieldType,
          amount: numAmount, // Plné množstvo pre každý úľ
          unit: 'kg',
          date: new Date().toISOString(), // Vždy aktuálny dátum
          notes: notes.trim() || undefined,
        };
        console.log(`Adding yield ${index + 1}/${selectedHiveIds.length}:`, yieldData);
        addYield(yieldData);
        console.log(`Yield ${index + 1} added successfully`);
      });

      console.log('All yields added successfully');
      
      // Zobrazenie success správy
      setShowSuccessMessage(true);
      Animated.sequence([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowSuccessMessage(false);
      });
      
      // Reset formulára
      setAmount('');
      setNotes('');
      setSelectedHiveIds([]);
      setSelectAll(false);
      
      // Krátke čakanie pre lepší UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hiveText = selectedHiveIds.length === 1 ? 'úľa' : `${selectedHiveIds.length} úľov`;
      Alert.alert(
        '✅ BOLO ULOŽENÉ!', 
        `Výnos ${numAmount} kg ${yieldType} bol pridaný pre ${hiveText}`, 
        [
          { 
            text: 'Späť na prehľad', 
            onPress: () => router.back(),
            style: 'default'
          },
          { 
            text: 'Pridať ďalší výnos', 
            style: 'cancel' 
          }
        ]
      );
    } catch (error) {
      console.error('Error saving yield:', error);
      console.error('Error details:', JSON.stringify(error));
      Alert.alert('❌ Chyba', 'Nepodarilo sa uložiť výnos. Skúste to znovu.');
    } finally {
      setIsSaving(false);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          title: 'Pridať výnos',
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#6b7280" size={24} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Pridať výnos</Text>
          {currentApiary && (
            <Text style={styles.subtitle}>{currentApiary.name}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Check color="#22c55e" size={24} />
          )}
        </TouchableOpacity>
      </View>

      {showSuccessMessage && (
        <Animated.View style={[styles.successBanner, { opacity: successOpacity }]}>
          <Check color="#ffffff" size={20} />
          <Text style={styles.successText}>Výnos bol úspešne pridaný!</Text>
          <TouchableOpacity 
            style={styles.closeBannerButton}
            onPress={() => {
              setShowSuccessMessage(false);
              successOpacity.setValue(0);
            }}
          >
            <X color="#ffffff" size={16} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Vyberte úle
              {selectedHiveIds.length > 0 && ` (${selectedHiveIds.length})`}
            </Text>
            {hives.length > 1 && (
              <View style={styles.selectAllContainer}>
                <Text style={styles.selectAllLabel}>Vybrať všetky</Text>
                <Switch
                  value={selectAll}
                  onValueChange={handleSelectAll}
                  trackColor={{ false: '#e5e7eb', true: '#22c55e60' }}
                  thumbColor={selectAll ? '#22c55e' : '#f3f4f6'}
                />
              </View>
            )}
          </View>
          
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
            <View style={styles.hivesCompactGrid}>
              {hives.map(hive => {
                const isSelected = selectedHiveIds.includes(hive.id);
                return (
                  <TouchableOpacity
                    key={hive.id}
                    style={[
                      styles.compactHiveItem,
                      isSelected && styles.compactHiveItemSelected
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedHiveIds(prev => prev.filter(id => id !== hive.id));
                        if (selectAll) setSelectAll(false);
                      } else {
                        setSelectedHiveIds(prev => [...prev, hive.id]);
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.selectedCheckbox
                    ]}>
                      {isSelected && (
                        <Check color="#ffffff" size={12} />
                      )}
                    </View>
                    <Text style={[
                      styles.compactHiveName,
                      isSelected && styles.selectedCompactHiveName
                    ]}>
                      {hive.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
                {Number(amount) || 0} kg bude pridané do každého z {selectedHiveIds.length} úľov
              </Text>
            )}
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  saveButton: {
    padding: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 8,
  },
  successText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  closeBannerButton: {
    padding: 4,
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
  compactHiveItemSelected: {
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

  notesInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
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