import React, { useState } from 'react';
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { X, Hexagon } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';

const hiveTypes = [
  { value: 'odlozenec', label: 'Odloženec' },
  { value: 'roj', label: 'Roj' },
  { value: 'zabehnutaRodina', label: 'Zabehnutá rodina' },
  { value: 'kupeneVcelstvo', label: 'Kúpené včelstvo' },
] as const;

const queenStatuses = [
  { value: 'stara', label: 'Stará matka' },
  { value: 'nova', label: 'Nová matka' },
  { value: 'vylahne', label: 'Ide sa vyliahnuť' },
] as const;

const queenEggLaying = [
  { value: 'lozi', label: 'Loží' },
  { value: 'nelozi', label: 'Neloží' },
] as const;

const queenColors = [
  { color: '#f3f4f6', name: 'Neoznačená' },
  { color: '#ffffff', name: 'Biela' },
  { color: '#ffff00', name: 'Žltá' },
  { color: '#ff0000', name: 'Červená' },
  { color: '#00ff00', name: 'Zelená' },
  { color: '#0000ff', name: 'Modrá' }
];

export default function AddHiveModal() {
  const { addHive, apiaries, getCurrentApiary } = useBeekeeping();
  const currentApiary = getCurrentApiary();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'odlozenec' | 'roj' | 'zabehnutaRodina' | 'kupeneVcelstvo'>('odlozenec');
  const [frameCount, setFrameCount] = useState('10');
  const [queenStatus, setQueenStatus] = useState<'stara' | 'nova' | 'vylahne'>('stara');
  const [queenColor, setQueenColor] = useState('#f3f4f6');
  const [queenColorName, setQueenColorName] = useState('Neoznačená');
  const [queenEggLayingStatus, setQueenEggLayingStatus] = useState<'lozi' | 'nelozi'>('lozi');
  const [colonyFoundingDate, setColonyFoundingDate] = useState('');
  const [selectedApiaryId, setSelectedApiaryId] = useState<string | undefined>(currentApiary?.id);

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Chyba: Zadajte názov úľa');
      } else {
        console.log('Chyba: Zadajte názov úľa');
      }
      return;
    }

    const frameCountNum = parseInt(frameCount);
    if (isNaN(frameCountNum) || frameCountNum <= 0) {
      if (Platform.OS === 'web') {
        alert('Chyba: Zadajte platný počet rámikov');
      } else {
        console.log('Chyba: Zadajte platný počet rámikov');
      }
      return;
    }

    // Parse colony founding date or use current date
    let foundingDate = new Date();
    if (colonyFoundingDate.trim()) {
      const dateParts = colonyFoundingDate.trim().split('.');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000) {
          const customDate = new Date(year, month, day, 12, 0, 0);
          if (!isNaN(customDate.getTime()) && 
              customDate.getDate() === day && 
              customDate.getMonth() === month && 
              customDate.getFullYear() === year) {
            foundingDate = customDate;
          }
        }
      }
    }

    addHive({
      name: name.trim(),
      type,
      frameCount: frameCountNum,
      queenStatus,
      queenColor: queenColorName,
      queenEggLaying: queenEggLayingStatus,
      colonyFoundingDate: foundingDate.toISOString(),
      apiaryId: selectedApiaryId,
    });

    router.back();
  };

  const TypeSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Typ rodiny</Text>
      <View style={styles.typeGrid}>
        {hiveTypes.map((hiveType) => (
          <TouchableOpacity
            key={hiveType.value}
            style={[
              styles.typeOption,
              type === hiveType.value && styles.selectedType,
            ]}
            onPress={() => setType(hiveType.value)}
          >
            <Text style={[
              styles.typeText,
              type === hiveType.value && styles.selectedTypeText,
            ]}>
              {hiveType.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const QueenStatusSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Stav matky</Text>
      <View style={styles.statusGrid}>
        {queenStatuses.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusOption,
              queenStatus === status.value && styles.selectedStatus,
            ]}
            onPress={() => setQueenStatus(status.value)}
          >
            <Text style={[
              styles.statusText,
              queenStatus === status.value && styles.selectedStatusText,
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const QueenEggLayingSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Stav matky - kladenie vajíčok</Text>
      <View style={styles.statusGrid}>
        {queenEggLaying.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusOption,
              queenEggLayingStatus === status.value && styles.selectedStatus,
            ]}
            onPress={() => setQueenEggLayingStatus(status.value)}
          >
            <Text style={[
              styles.statusText,
              queenEggLayingStatus === status.value && styles.selectedStatusText,
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ColorSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Farba matky</Text>
      <View style={styles.colorGrid}>
        {queenColors.map((colorItem) => (
          <TouchableOpacity
            key={colorItem.color}
            style={[
              styles.colorOption,
              { backgroundColor: colorItem.color },
              queenColor === colorItem.color && styles.selectedColor,
              (colorItem.color === '#ffffff' || colorItem.color === '#f3f4f6') && styles.whiteColor,
            ]}
            onPress={() => {
              setQueenColor(colorItem.color);
              setQueenColorName(colorItem.name);
            }}
          />
        ))}
      </View>
      <Text style={styles.selectedColorText}>Vybraná farba: {queenColorName}</Text>
    </View>
  );

  const ApiarySelector = () => {
    if (!currentApiary) {
      return (
        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Vcelnica (voliteľné)</Text>
          <View style={styles.statusGrid}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedApiaryId === undefined && styles.selectedStatus,
              ]}
              onPress={() => setSelectedApiaryId(undefined)}
            >
              <Text style={[
                styles.statusText,
                selectedApiaryId === undefined && styles.selectedStatusText,
              ]}>
                Bez vcelnice
              </Text>
            </TouchableOpacity>
            {apiaries.map((apiary) => (
              <TouchableOpacity
                key={apiary.id}
                style={[
                  styles.statusOption,
                  selectedApiaryId === apiary.id && styles.selectedStatus,
                ]}
                onPress={() => setSelectedApiaryId(apiary.id)}
              >
                <Text style={[
                  styles.statusText,
                  selectedApiaryId === apiary.id && styles.selectedStatusText,
                ]}>
                  {apiary.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    
    // When in a specific apiary, show it as fixed
    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.label}>Včelnica</Text>
        <View style={styles.fixedApiaryContainer}>
          <Text style={styles.fixedApiaryText}>{currentApiary.name}</Text>
          <Text style={styles.fixedApiaryNote}>Úľ bude pridaný do tejto včelnice</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Hexagon color="#22c55e" size={24} />
              </View>
              <Text style={styles.title}>Nový úľ</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Názov úľa *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="napr. Úľ č. 1"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <TypeSelector />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Počet rámikov</Text>
              <TextInput
                style={styles.input}
                value={frameCount}
                onChangeText={setFrameCount}
                placeholder="10"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dátum založenia rodiny</Text>
              <TextInput
                style={styles.input}
                value={colonyFoundingDate}
                onChangeText={setColonyFoundingDate}
                placeholder="DD.MM.YYYY - nechajte prázdne pre dnešný dátum"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <QueenStatusSelector />

            <QueenEggLayingSelector />

            <ColorSelector />

            <ApiarySelector />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Zrušiť</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Uložiť</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedType: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  typeText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedTypeText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedStatus: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectedStatusText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#111827',
  },
  whiteColor: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#22c55e',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedColorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  fixedApiaryContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
  },
  fixedApiaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    textAlign: 'center',
  },
  fixedApiaryNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});