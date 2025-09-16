import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Edit3, 
  Plus, 
  Calendar, 
  FileText, 
  Trash2,
  Save,
  X
} from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const hiveTypeLabels = {
  odlozenec: 'Odloženec',
  roj: 'Roj',
  zabehnutaRodina: 'Zabehnutá rodina',
  kupeneVcelstvo: 'Kúpené včelstvo',
};

const queenStatusLabels = {
  stara: 'Stará matka',
  nova: 'Nová matka',
  vylahne: 'Ide sa vyliahnuť',
};

const queenColors = [
  'Neoznačená',
  'Biela',
  'Žltá', 
  'Červená',
  'Zelená',
  'Modrá'
];

export default function HiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    hives, 
    inspections, 
    tasks, 
    yields,
    updateHive, 
    deleteHive,
    addInspection,
    updateInspection,
    deleteInspection,
    addTask,
    updateTask,
    deleteTask,
    addYield,
    updateYield,
    deleteYield
  } = useBeekeeping();
  const insets = useSafeAreaInsets();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFrameCount, setEditFrameCount] = useState('');
  const [editType, setEditType] = useState<'odlozenec' | 'roj' | 'zabehnutaRodina' | 'kupeneVcelstvo'>('zabehnutaRodina');
  const [editQueenEggLaying, setEditQueenEggLaying] = useState<'lozi' | 'nelozi'>('lozi');
  const [editQueenStatus, setEditQueenStatus] = useState<'stara' | 'nova' | 'vylahne'>('stara');
  const [editQueenColor, setEditQueenColor] = useState('');
  const [editColonyFoundingDate, setEditColonyFoundingDate] = useState('');
  const [newInspectionNote, setNewInspectionNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newYieldAmount, setNewYieldAmount] = useState('');
  const [newYieldType, setNewYieldType] = useState<'med' | 'vosk'>('med');
  const [newYieldDate, setNewYieldDate] = useState('');
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddYield, setShowAddYield] = useState(false);
  const [editingYieldId, setEditingYieldId] = useState<string | null>(null);
  const [editYieldAmount, setEditYieldAmount] = useState('');
  const [editYieldType, setEditYieldType] = useState<'med' | 'vosk'>('med');
  const [editYieldDate, setEditYieldDate] = useState('');
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [editInspectionNote, setEditInspectionNote] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');

  const hive = hives.find(h => h.id === id);
  const hiveInspections = inspections.filter(i => i.hiveId === id).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const hiveTasks = tasks.filter(t => t.hiveId === id && !t.completed);
  const hiveYields = yields.filter(y => y.hiveId === id).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (!hive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Úľ sa nenašiel</Text>
      </View>
    );
  }

  const handleEdit = () => {
    setEditName(hive.name);
    setEditFrameCount(hive.frameCount.toString());
    // If hive has 'ine' type (old data), default to 'zabehnutaRodina'
    const validTypes = ['odlozenec', 'roj', 'zabehnutaRodina', 'kupeneVcelstvo'] as const;
    const typeToSet = validTypes.includes(hive.type as any) ? hive.type : 'zabehnutaRodina';
    setEditType(typeToSet as any);
    setEditQueenStatus(hive.queenStatus);
    setEditQueenColor(hive.queenColor);
    setEditQueenEggLaying(hive.queenEggLaying ?? 'lozi');
    
    const foundingDate = new Date(hive.colonyFoundingDate);
    const formattedFoundingDate = `${foundingDate.getDate().toString().padStart(2, '0')}.${(foundingDate.getMonth() + 1).toString().padStart(2, '0')}.${foundingDate.getFullYear()}`;
    setEditColonyFoundingDate(formattedFoundingDate);
    
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte názov úľa');
      }
      return;
    }

    const frameCount = parseInt(editFrameCount);
    if (isNaN(frameCount) || frameCount <= 0) {
      if (Platform.OS === 'web') {
        alert('Zadajte platný počet rámikov');
      }
      return;
    }

    if (!editQueenColor) {
      if (Platform.OS === 'web') {
        alert('Vyberte farbu matky');
      }
      return;
    }

    // Parse colony founding date
    let foundingDate = new Date(hive.colonyFoundingDate);
    if (editColonyFoundingDate.trim()) {
      const dateParts = editColonyFoundingDate.trim().split('.');
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

    updateHive(hive.id, {
      name: editName.trim(),
      frameCount: frameCount,
      type: editType,
      queenStatus: editQueenStatus,
      queenColor: editQueenColor,
      queenEggLaying: editQueenEggLaying,
      colonyFoundingDate: foundingDate.toISOString(),
    });
    setIsEditing(false);
  };

  const handleDeleteHive = () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('Naozaj chcete zmazať tento úľ? Táto akcia sa nedá vrátiť.');
      if (confirmed) {
        deleteHive(hive.id);
        router.back();
      }
    } else {
      Alert.alert(
        'Zmazať úľ',
        'Naozaj chcete zmazať tento úľ? Táto akcia sa nedá vrátiť.',
        [
          { text: 'Zrušiť', style: 'cancel' },
          { 
            text: 'Zmazať', 
            style: 'destructive',
            onPress: () => {
              deleteHive(hive.id);
              router.back();
            }
          }
        ]
      );
    }
  };

  const handleAddInspection = () => {
    if (!newInspectionNote.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte poznámku k prehliadke');
      }
      return;
    }

    addInspection({
      hiveId: hive.id,
      date: new Date().toISOString(),
      notes: newInspectionNote.trim(),
    });
    setNewInspectionNote('');
    setShowAddInspection(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte názov úlohy');
      } else {
        Alert.alert('Chyba', 'Zadajte názov úlohy');
      }
      return;
    }

    if (!newTaskDate.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte dátum');
      } else {
        Alert.alert('Chyba', 'Zadajte dátum');
      }
      return;
    }

    // Parse the date in DD.MM.YYYY format
    const dateParts = newTaskDate.trim().split('.');
    if (dateParts.length !== 3) {
      if (Platform.OS === 'web') {
        alert('Neplatný formát dátumu. Použite DD.MM.YYYY');
      } else {
        Alert.alert('Chyba', 'Neplatný formát dátumu. Použite DD.MM.YYYY');
      }
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11 || year < 2020) {
      if (Platform.OS === 'web') {
        alert('Neplatný dátum');
      } else {
        Alert.alert('Chyba', 'Neplatný dátum');
      }
      return;
    }

    const taskDate = new Date(year, month, day, 12, 0, 0);
    if (isNaN(taskDate.getTime()) || 
        taskDate.getDate() !== day || 
        taskDate.getMonth() !== month || 
        taskDate.getFullYear() !== year) {
      if (Platform.OS === 'web') {
        alert('Neplatný dátum');
      } else {
        Alert.alert('Chyba', 'Neplatný dátum');
      }
      return;
    }

    addTask({
      hiveId: hive.id,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      dueDate: taskDate.toISOString(),
      completed: false,
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDate('');
    setShowAddTask(false);
  };

  const handleAddYield = () => {
    const amount = parseFloat(newYieldAmount);
    if (isNaN(amount) || amount <= 0) {
      if (Platform.OS === 'web') {
        alert('Zadajte platné množstvo');
      }
      return;
    }

    let yieldDate = new Date();
    if (newYieldDate.trim()) {
      const dateParts = newYieldDate.trim().split('.');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2020) {
          const customDate = new Date(year, month, day, 12, 0, 0);
          if (!isNaN(customDate.getTime()) && 
              customDate.getDate() === day && 
              customDate.getMonth() === month && 
              customDate.getFullYear() === year) {
            yieldDate = customDate;
          }
        }
      }
    }

    addYield({
      hiveId: hive.id,
      type: newYieldType,
      amount: amount,
      unit: 'kg',
      date: yieldDate.toISOString(),
    });
    setNewYieldAmount('');
    setNewYieldDate('');
    setShowAddYield(false);
  };

  const handleEditYield = (yieldItem: any) => {
    setEditingYieldId(yieldItem.id);
    setEditYieldAmount(yieldItem.amount.toString());
    setEditYieldType(yieldItem.type);
    
    const yieldDate = new Date(yieldItem.date);
    const formattedDate = `${yieldDate.getDate().toString().padStart(2, '0')}.${(yieldDate.getMonth() + 1).toString().padStart(2, '0')}.${yieldDate.getFullYear()}`;
    setEditYieldDate(formattedDate);
  };

  const handleSaveYieldEdit = () => {
    const amount = parseFloat(editYieldAmount);
    if (isNaN(amount) || amount <= 0) {
      if (Platform.OS === 'web') {
        alert('Zadajte platné množstvo');
      }
      return;
    }

    let yieldDate = new Date();
    if (editYieldDate.trim()) {
      const dateParts = editYieldDate.trim().split('.');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2020) {
          const customDate = new Date(year, month, day, 12, 0, 0);
          if (!isNaN(customDate.getTime()) && 
              customDate.getDate() === day && 
              customDate.getMonth() === month && 
              customDate.getFullYear() === year) {
            yieldDate = customDate;
          }
        }
      }
    }

    if (editingYieldId) {
      updateYield(editingYieldId, {
        type: editYieldType,
        amount: amount,
        date: yieldDate.toISOString(),
      });
      setEditingYieldId(null);
      setEditYieldAmount('');
      setEditYieldType('med');
      setEditYieldDate('');
    }
  };

  const handleCancelYieldEdit = () => {
    setEditingYieldId(null);
    setEditYieldAmount('');
    setEditYieldType('med');
    setEditYieldDate('');
  };

  const handleEditInspection = (inspection: any) => {
    setEditingInspectionId(inspection.id);
    setEditInspectionNote(inspection.notes);
  };

  const handleSaveInspectionEdit = () => {
    if (!editInspectionNote.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte poznámku k prehliadke');
      }
      return;
    }

    if (editingInspectionId) {
      updateInspection(editingInspectionId, {
        notes: editInspectionNote.trim(),
      });
      setEditingInspectionId(null);
      setEditInspectionNote('');
    }
  };

  const handleCancelInspectionEdit = () => {
    setEditingInspectionId(null);
    setEditInspectionNote('');
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    
    const taskDate = new Date(task.dueDate);
    const formattedDate = `${taskDate.getDate().toString().padStart(2, '0')}.${(taskDate.getMonth() + 1).toString().padStart(2, '0')}.${taskDate.getFullYear()}`;
    setEditTaskDate(formattedDate);
  };

  const handleSaveTaskEdit = () => {
    if (!editTaskTitle.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte názov úlohy');
      }
      return;
    }

    if (!editTaskDate.trim()) {
      if (Platform.OS === 'web') {
        alert('Zadajte dátum');
      }
      return;
    }

    // Parse the date in DD.MM.YYYY format
    const dateParts = editTaskDate.trim().split('.');
    if (dateParts.length !== 3) {
      if (Platform.OS === 'web') {
        alert('Neplatný formát dátumu. Použite DD.MM.YYYY');
      }
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11 || year < 2020) {
      if (Platform.OS === 'web') {
        alert('Neplatný dátum');
      }
      return;
    }

    const taskDate = new Date(year, month, day, 12, 0, 0);
    if (isNaN(taskDate.getTime()) || 
        taskDate.getDate() !== day || 
        taskDate.getMonth() !== month || 
        taskDate.getFullYear() !== year) {
      if (Platform.OS === 'web') {
        alert('Neplatný dátum');
      }
      return;
    }

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim(),
        dueDate: taskDate.toISOString(),
      });
      setEditingTaskId(null);
      setEditTaskTitle('');
      setEditTaskDescription('');
      setEditTaskDate('');
    }
  };

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskDate('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          {isEditing ? (
            <TextInput
              style={styles.headerEditInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Názov úľa"
            />
          ) : (
            <Text style={styles.title}>{hive.name}</Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setIsEditing(false)}
              >
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Save color="#ffffff" size={20} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Edit3 color="#6b7280" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteHive}
              >
                <Trash2 color="#ffffff" size={20} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Základné informácie</Text>
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Typ rodiny:</Text>
                <View style={styles.typeSelector}>
                  {Object.entries(hiveTypeLabels).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.typeOption,
                        editType === key && styles.selectedType,
                      ]}
                      onPress={() => setEditType(key as any)}
                    >
                      <Text style={[
                        styles.typeText,
                        editType === key && styles.selectedTypeText,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Počet rámikov:</Text>
                <TextInput
                  style={styles.editInput}
                  value={editFrameCount}
                  onChangeText={setEditFrameCount}
                  keyboardType="numeric"
                  placeholder="Počet rámikov"
                />
              </View>
              
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Stav matky:</Text>
                <View style={styles.statusSelector}>
                  {Object.entries(queenStatusLabels).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.statusOption,
                        editQueenStatus === key && styles.selectedStatus,
                      ]}
                      onPress={() => setEditQueenStatus(key as any)}
                    >
                      <Text style={[
                        styles.statusText,
                        editQueenStatus === key && styles.selectedStatusText,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.editRow}>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setEditQueenEggLaying(editQueenEggLaying === 'lozi' ? 'nelozi' : 'lozi')}
                >
                  <View style={[styles.checkbox, editQueenEggLaying === 'lozi' && styles.checkboxChecked]}>
                    {editQueenEggLaying === 'lozi' && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Matka loží</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Farba matky:</Text>
                <View style={styles.colorSelector}>
                  {queenColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        editQueenColor === color && styles.selectedColorOption,
                      ]}
                      onPress={() => setEditQueenColor(color)}
                    >
                      <Text style={[
                        styles.colorText,
                        editQueenColor === color && styles.selectedColorText,
                      ]}>
                        {color}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Dátum založenia rodiny:</Text>
                <TextInput
                  style={styles.editInput}
                  value={editColonyFoundingDate}
                  onChangeText={setEditColonyFoundingDate}
                  placeholder="DD.MM.YYYY"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Typ rodiny:</Text>
                <Text style={styles.infoValue}>{hiveTypeLabels[hive.type] || 'Iné'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Počet rámikov:</Text>
                <Text style={styles.infoValue}>{hive.frameCount}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stav matky:</Text>
                <Text style={styles.infoValue}>{queenStatusLabels[hive.queenStatus]}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Farba matky:</Text>
                <Text style={styles.infoValue}>{hive.queenColor}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Matka loží:</Text>
                <Text style={styles.infoValue}>{(hive.queenEggLaying ?? 'lozi') === 'lozi' ? 'Áno' : 'Nie'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dátum založenia rodiny:</Text>
                <Text style={styles.infoValue}>{new Date(hive.colonyFoundingDate).toLocaleDateString('sk-SK')}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Denník prehliadok</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddInspection(true)}
            >
              <Plus color="#22c55e" size={20} />
            </TouchableOpacity>
          </View>
          
          {showAddInspection && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.textArea}
                value={newInspectionNote}
                onChangeText={setNewInspectionNote}
                placeholder="Poznámky k prehliadke..."
                multiline
                numberOfLines={3}
              />
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddInspection(false);
                    setNewInspectionNote('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Zrušiť</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveFormButton}
                  onPress={handleAddInspection}
                >
                  <Text style={styles.saveButtonText}>Uložiť</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {hiveInspections.map((inspection) => (
            <View key={inspection.id} style={styles.listItem}>
              {editingInspectionId === inspection.id ? (
                <View style={styles.editInspectionForm}>
                  <TextInput
                    style={styles.textArea}
                    value={editInspectionNote}
                    onChangeText={setEditInspectionNote}
                    placeholder="Poznámky k prehliadke..."
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleCancelInspectionEdit}
                    >
                      <Text style={styles.cancelButtonText}>Zrušiť</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.saveFormButton}
                      onPress={handleSaveInspectionEdit}
                    >
                      <Text style={styles.saveButtonText}>Uložiť</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemDate}>{formatDate(inspection.date)}</Text>
                    <View style={styles.inspectionActions}>
                      <TouchableOpacity 
                        onPress={() => handleEditInspection(inspection)}
                        style={styles.editInspectionButton}
                      >
                        <Edit3 color="#3b82f6" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteInspection(inspection.id)}
                      >
                        <Trash2 color="#ef4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.listItemText}>{inspection.notes}</Text>
                </>
              )}
            </View>
          ))}
          
          {hiveInspections.length === 0 && (
            <Text style={styles.emptyText}>Žiadne prehliadky</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nadchádzajúce úlohy</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddTask(true)}
            >
              <Plus color="#22c55e" size={20} />
            </TouchableOpacity>
          </View>
          
          {showAddTask && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Názov úlohy"
              />
              <TextInput
                style={styles.textArea}
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                placeholder="Popis úlohy (voliteľné)"
                multiline
                numberOfLines={2}
              />
              <TextInput
                style={styles.input}
                value={newTaskDate}
                onChangeText={setNewTaskDate}
                placeholder="Dátum (DD.MM.YYYY) - napr. 15.12.2024"
                keyboardType="numeric"
              />
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddTask(false);
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setNewTaskDate('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Zrušiť</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveFormButton}
                  onPress={handleAddTask}
                >
                  <Text style={styles.saveButtonText}>Uložiť</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {hiveTasks.map((task) => (
            <View key={task.id} style={styles.listItem}>
              {editingTaskId === task.id ? (
                <View style={styles.editTaskForm}>
                  <TextInput
                    style={styles.input}
                    value={editTaskTitle}
                    onChangeText={setEditTaskTitle}
                    placeholder="Názov úlohy"
                  />
                  <TextInput
                    style={styles.textArea}
                    value={editTaskDescription}
                    onChangeText={setEditTaskDescription}
                    placeholder="Popis úlohy (voliteľné)"
                    multiline
                    numberOfLines={2}
                  />
                  <TextInput
                    style={styles.input}
                    value={editTaskDate}
                    onChangeText={setEditTaskDate}
                    placeholder="Dátum (DD.MM.YYYY)"
                    keyboardType="numeric"
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleCancelTaskEdit}
                    >
                      <Text style={styles.cancelButtonText}>Zrušiť</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.saveFormButton}
                      onPress={handleSaveTaskEdit}
                    >
                      <Text style={styles.saveButtonText}>Uložiť</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>{task.title}</Text>
                    <View style={styles.taskActions}>
                      <TouchableOpacity 
                        onPress={() => handleEditTask(task)}
                        style={styles.editTaskButton}
                      >
                        <Edit3 color="#3b82f6" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => updateTask(task.id, { completed: true })}
                        style={styles.completeButton}
                      >
                        <Text style={styles.completeButtonText}>Hotovo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteTask(task.id)}
                      >
                        <Trash2 color="#ef4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.listItemDate}>Termín: {formatDate(task.dueDate)}</Text>
                  {task.description && (
                    <Text style={styles.listItemText}>{task.description}</Text>
                  )}
                </>
              )}
            </View>
          ))}
          
          {hiveTasks.length === 0 && (
            <Text style={styles.emptyText}>Žiadne úlohy</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Výnosy</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddYield(true)}
            >
              <Plus color="#22c55e" size={20} />
            </TouchableOpacity>
          </View>
          
          {showAddYield && (
            <View style={styles.addForm}>
              <View style={styles.yieldTypeSelector}>
                {(['med', 'vosk'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.yieldTypeOption,
                      newYieldType === type && styles.selectedYieldType,
                    ]}
                    onPress={() => setNewYieldType(type)}
                  >
                    <Text style={[
                      styles.yieldTypeText,
                      newYieldType === type && styles.selectedYieldTypeText,
                    ]}>
                      {type === 'med' ? 'Med' : 'Vosk'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={newYieldAmount}
                onChangeText={setNewYieldAmount}
                placeholder="Množstvo (kg)"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={newYieldDate}
                onChangeText={setNewYieldDate}
                placeholder="Dátum (DD.MM.YYYY) - nechajte prázdne pre dnešný dátum"
                keyboardType="numeric"
              />
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddYield(false);
                    setNewYieldAmount('');
                    setNewYieldDate('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Zrušiť</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveFormButton}
                  onPress={handleAddYield}
                >
                  <Text style={styles.saveButtonText}>Uložiť</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {hiveYields.map((yieldItem) => (
            <View key={yieldItem.id} style={styles.listItem}>
              {editingYieldId === yieldItem.id ? (
                <View style={styles.editYieldForm}>
                  <View style={styles.yieldTypeSelector}>
                    {(['med', 'vosk'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.yieldTypeOption,
                          editYieldType === type && styles.selectedYieldType,
                        ]}
                        onPress={() => setEditYieldType(type)}
                      >
                        <Text style={[
                          styles.yieldTypeText,
                          editYieldType === type && styles.selectedYieldTypeText,
                        ]}>
                          {type === 'med' ? 'Med' : 'Vosk'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editYieldAmount}
                    onChangeText={setEditYieldAmount}
                    placeholder="Množstvo (kg)"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={editYieldDate}
                    onChangeText={setEditYieldDate}
                    placeholder="Dátum (DD.MM.YYYY)"
                    keyboardType="numeric"
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={handleCancelYieldEdit}
                    >
                      <Text style={styles.cancelButtonText}>Zrušiť</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.saveFormButton}
                      onPress={handleSaveYieldEdit}
                    >
                      <Text style={styles.saveButtonText}>Uložiť</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>
                      {yieldItem.type === 'med' ? 'Med' : 'Vosk'}
                    </Text>
                    <View style={styles.yieldActions}>
                      <TouchableOpacity 
                        onPress={() => handleEditYield(yieldItem)}
                        style={styles.editYieldButton}
                      >
                        <Edit3 color="#3b82f6" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteYield(yieldItem.id)}
                      >
                        <Trash2 color="#ef4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.listItemDate}>{formatDate(yieldItem.date)}</Text>
                  <Text style={styles.yieldAmount}>{yieldItem.amount} {yieldItem.unit}</Text>
                </>
              )}
            </View>
          ))}
          
          {hiveYields.length === 0 && (
            <Text style={styles.emptyText}>Žiadne výnosy</Text>
          )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerEditInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  editInputSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 2,
    minWidth: 60,
    textAlign: 'right',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  saveFormButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  listItem: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  listItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  listItemText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  yieldTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  yieldTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedYieldType: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  yieldTypeText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedYieldTypeText: {
    color: '#ffffff',
  },
  yieldAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
  editForm: {
    gap: 16,
  },
  editRow: {
    gap: 8,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedType: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedTypeText: {
    color: '#ffffff',
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedStatus: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedStatusText: {
    color: '#ffffff',
  },
  dateInputContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  dateInputYear: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    flex: 1.5,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedColorOption: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  colorText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedColorText: {
    color: '#ffffff',
  },
  yieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editYieldButton: {
    padding: 2,
  },
  editYieldForm: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  inspectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInspectionButton: {
    padding: 2,
  },
  editInspectionForm: {
    gap: 12,
  },
  editTaskButton: {
    padding: 2,
  },
  editTaskForm: {
    gap: 12,
  },
});