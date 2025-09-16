import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Plus, Bell, Calendar, CheckCircle, Circle, X, Trash2, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Task } from '@/types/beekeeping';

export default function RemindersScreen() {
  const { tasks, hives, updateTask, addTask, deleteTask } = useBeekeeping();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);

  const getHiveName = (hiveId: string) => {
    const hive = hives.find(h => h.id === hiveId);
    return hive?.name || 'Neznámy úľ';
  };

  const getHiveNames = (task: Task) => {
    // Use hiveIds if available, otherwise fall back to single hiveId
    const ids = task.hiveIds || [task.hiveId];
    const names = ids.map(id => getHiveName(id));
    
    if (names.length === 0) return 'Neznámy úľ';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(' a ');
    return `${names.slice(0, -1).join(', ')} a ${names[names.length - 1]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string) => {
    const taskDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const toggleTaskCompletion = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed: !completed });
  };

  const handleSaveTask = () => {
    if (!newTaskTitle.trim() || !newTaskDate.trim() || selectedHiveIds.length === 0) {
      Alert.alert('Chyba', 'Vyplňte všetky povinné polia a vyberte aspoň jeden úľ');
      return;
    }

    // Parse the date in DD.MM.YYYY format
    const dateParts = newTaskDate.trim().split('.');
    if (dateParts.length !== 3) {
      Alert.alert('Chyba', 'Neplatný formát dátumu. Použite DD.MM.YYYY');
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11 || year < 2020) {
      Alert.alert('Chyba', 'Neplatný dátum');
      return;
    }

    const dueDate = new Date(year, month, day, 12, 0, 0);
    if (isNaN(dueDate.getTime()) || 
        dueDate.getDate() !== day || 
        dueDate.getMonth() !== month || 
        dueDate.getFullYear() !== year) {
      Alert.alert('Chyba', 'Neplatný dátum');
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        dueDate: dueDate.toISOString(),
        hiveId: selectedHiveIds[0], // Keep first ID for backward compatibility
        hiveIds: selectedHiveIds,
      });
    } else {
      // Create a task for each selected hive if multiple are selected
      if (selectedHiveIds.length === 1) {
        addTask({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          dueDate: dueDate.toISOString(),
          hiveId: selectedHiveIds[0],
          hiveIds: selectedHiveIds,
          completed: false,
        });
      } else {
        // Create one task with multiple hive IDs
        addTask({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          dueDate: dueDate.toISOString(),
          hiveId: selectedHiveIds[0], // For backward compatibility
          hiveIds: selectedHiveIds,
          completed: false,
        });
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDate('');
    setSelectedHiveIds([]);
    setEditingTask(null);
    setShowAddModal(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    // Use hiveIds if available, otherwise use single hiveId
    setSelectedHiveIds(task.hiveIds || [task.hiveId]);
    
    // Format date to DD.MM.YYYY
    const date = new Date(task.dueDate);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    setNewTaskDate(formattedDate);
    
    setShowAddModal(true);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Zmazať úlohu',
      `Naozaj chcete zmazať úlohu "${taskTitle}"?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Zmazať', style: 'destructive', onPress: () => deleteTask(taskId) },
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const overdue = isOverdue(item.dueDate) && !item.completed;
    
    return (
      <View style={[
        styles.taskCard,
        item.completed && styles.completedTask,
        overdue && styles.overdueTask,
      ]}>
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleTaskCompletion(item.id, item.completed)}
            >
              <View style={styles.taskIcon}>
                {item.completed ? (
                  <CheckCircle color="#22c55e" size={24} />
                ) : (
                  <Circle color="#6b7280" size={24} />
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.taskInfo}>
              <Text style={[
                styles.taskTitle,
                item.completed && styles.completedText,
              ]}>
                {item.title}
              </Text>
              <Text style={styles.taskHive}>
                {getHiveNames(item)}
              </Text>
            </View>
            
            {!item.completed && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditTask(item)}
              >
                <Edit3 color="#6b7280" size={18} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.taskDetails}>
            <View style={styles.taskDate}>
              <Calendar color={overdue ? "#dc2626" : "#6b7280"} size={16} />
              <Text style={[
                styles.taskDateText,
                overdue && styles.overdueText,
              ]}>
                {formatDate(item.dueDate)}
                {overdue && ' (Po termíne)'}
              </Text>
            </View>
            
            {item.description && (
              <Text style={[
                styles.taskDescription,
                item.completed && styles.completedText,
              ]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        {item.completed && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTask(item.id, item.title)}
          >
            <Trash2 color="#dc2626" size={20} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Bell color="#d1d5db" size={64} />
      <Text style={styles.emptyTitle}>Žiadne pripomienky</Text>
      <Text style={styles.emptyDescription}>
        Naplánujte si úlohy pre vaše úle a nikdy nezabudnite na dôležité práce
      </Text>
    </View>
  );

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.closeButton}>
          <X color="#6b7280" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Pripomienky</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#22c55e" size={24} />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={[...pendingTasks, ...completedTasks]}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              {pendingTasks.length > 0 && (
                <Text style={styles.sectionTitle}>
                  Aktívne úlohy ({pendingTasks.length})
                </Text>
              )}
            </View>
          )}
          ListFooterComponent={() => (
            completedTasks.length > 0 ? (
              <View style={styles.completedSection}>
                <Text style={styles.sectionTitle}>
                  Dokončené ({completedTasks.length})
                </Text>
              </View>
            ) : null
          )}
        />
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Upraviť úlohu' : 'Nová úloha'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={resetForm}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Názov úlohy *</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Napríklad: Kontrola matky"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.inputLabel}>Vyberte úle</Text>
                {hives.filter(hive => !hive.isDeleted).length > 1 && (
                  <View style={styles.selectAllContainer}>
                    <Text style={styles.selectAllLabel}>Označiť všetky</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleSwitch,
                        selectedHiveIds.length === hives.filter(hive => !hive.isDeleted).length && styles.toggleSwitchActive
                      ]}
                      onPress={() => {
                        const allHiveIds = hives.filter(hive => !hive.isDeleted).map(h => h.id);
                        setSelectedHiveIds(selectedHiveIds.length === allHiveIds.length ? [] : allHiveIds);
                      }}
                    >
                      <View style={[
                        styles.toggleThumb,
                        selectedHiveIds.length === hives.filter(hive => !hive.isDeleted).length && styles.toggleThumbActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.pickerContainer}>
                {hives.filter(hive => !hive.isDeleted).map((hive) => {
                  const isSelected = selectedHiveIds.includes(hive.id);
                  return (
                    <TouchableOpacity
                      key={hive.id}
                      style={[
                        styles.hiveOption,
                        isSelected && styles.selectedHiveOption,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedHiveIds(selectedHiveIds.filter(id => id !== hive.id));
                        } else {
                          setSelectedHiveIds([...selectedHiveIds, hive.id]);
                        }
                      }}
                    >
                      <View style={styles.hiveOptionContent}>
                        <View style={styles.checkbox}>
                          {isSelected && <CheckCircle color="#ffffff" size={16} />}
                        </View>
                        <Text style={[
                          styles.hiveOptionText,
                          isSelected && styles.selectedHiveOptionText,
                        ]}>
                          {hive.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dátum (DD.MM.YYYY) *</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskDate}
                onChangeText={setNewTaskDate}
                placeholder="15.12.2024"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Popis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                placeholder="Voliteľný popis úlohy..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSaveTask}
            >
              <Text style={styles.addButtonText}>
                {editingTask ? 'Uložiť zmeny' : 'Pridať úlohu'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  completedSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
  },
  completedTask: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  overdueTask: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  taskIcon: {
    // No margin needed as it's inside checkboxContainer
  },
  taskInfo: {
    flex: 1,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  taskHive: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDetails: {
    gap: 8,
  },
  taskDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#22c55e',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  hiveOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedHiveOption: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  hiveOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiveOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedHiveOptionText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});