import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { BarChart3, TrendingUp, Hexagon, Calendar, RotateCcw, ChevronDown, ChevronUp, Plus, CalendarDays, Edit3, X, Pencil } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function StatisticsScreen() {
  const {
    hives,
    inspections,
    yields,
    monthlyStats,
    yearlyStats,
    getThisMonthInspections,
    getThisYearYield,
    resetMonthlyStats,
    resetYearlyStats,
    getHistoricalStats,
    getActiveHiveCount,
    getHiveCountByYear,
    updateYield,
    deleteYield,
  } = useBeekeeping();
  const insets = useSafeAreaInsets();
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  

  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedYearForStats, setSelectedYearForStats] = useState(currentYear);
  const [showHiveYields, setShowHiveYields] = useState(false);
  const [editingYield, setEditingYield] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [expandedHives, setExpandedHives] = useState<Set<string>>(new Set());

  const thisMonthInspections = getThisMonthInspections();
  const thisYearYield = getThisYearYield();
  const activeHives = hives.filter(hive => !hive.isDeleted);
  const activeHiveCount = getActiveHiveCount();
  
  // Debug logging
  console.log('Statistics - Total hives:', hives.length);
  console.log('Statistics - Active hives:', activeHives.length);
  console.log('Statistics - getActiveHiveCount():', activeHiveCount);
  console.log('Statistics - Hives data:', hives.map(h => ({ id: h.id, name: h.name, isDeleted: h.isDeleted })));
  const averageInspectionsPerHive = activeHiveCount > 0 ? (inspections.filter(inspection => {
    const hive = hives.find(h => h.id === inspection.hiveId);
    return hive && !hive.isDeleted;
  }).length / activeHiveCount).toFixed(1) : '0';
  
  const monthNames = [
    'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
    'Júl', 'August', 'September', 'Október', 'November', 'December'
  ];
  
  const handleResetMonth = () => {
    Alert.alert(
      'Resetovať mesačné štatistiky',
      `Naozaj chcete resetovať štatistiky pre ${monthNames[currentMonth]} ${currentYear}?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { 
          text: 'Resetovať', 
          style: 'destructive',
          onPress: resetMonthlyStats 
        }
      ]
    );
  };
  
  const handleResetYear = () => {
    Alert.alert(
      'Resetovať ročné štatistiky',
      `Naozaj chcete resetovať všetky štatistiky pre rok ${currentYear}?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { 
          text: 'Resetovať', 
          style: 'destructive',
          onPress: resetYearlyStats 
        }
      ]
    );
  };
  
  const getAvailableYears = () => {
    const years = new Set<number>();
    years.add(currentYear); // Always include current year
    yearlyStats.forEach(stat => years.add(stat.year));
    inspections.forEach(inspection => years.add(new Date(inspection.date).getFullYear()));
    yields.forEach(yieldItem => years.add(new Date(yieldItem.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  };
  
  const availableYears = getAvailableYears();

  const StatCard = ({ 
    title, 
    value, 
    subtitle,
    icon: Icon,
    color = "#22c55e",
    onReset
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any;
    color?: string;
    onReset?: () => void;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Icon color="#ffffff" size={20} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getYieldByType = (year?: number) => {
    const filteredYields = year 
      ? yields.filter(yieldItem => new Date(yieldItem.date).getFullYear() === year)
      : yields;
      
    const yieldByType = filteredYields.reduce((acc, yieldItem) => {
      const type = yieldItem.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += yieldItem.amount;
      return acc;
    }, {} as Record<string, number>);

    return yieldByType;
  };

  const getYieldByTypeAndHive = (year?: number) => {
    const filteredYields = year 
      ? yields.filter(yieldItem => new Date(yieldItem.date).getFullYear() === year)
      : yields;
      
    const yieldByHive = filteredYields.reduce((acc, yieldItem) => {
      const hive = hives.find(h => h.id === yieldItem.hiveId);
      let hiveName: string;
      
      if (hive) {
        if (hive.isDeleted && hive.deletedAt) {
          const deletedDate = new Date(hive.deletedAt).toLocaleDateString('sk-SK');
          hiveName = `${hive.name} - zrušený (${deletedDate})`;
        } else {
          hiveName = hive.name;
        }
      } else {
        hiveName = `Úľ ${yieldItem.hiveId}`;
      }
      
      if (!acc[hiveName]) {
        acc[hiveName] = { total: 0, byType: {}, yields: [] };
      }
      
      acc[hiveName].total += yieldItem.amount;
      acc[hiveName].yields.push(yieldItem);
      
      if (!acc[hiveName].byType[yieldItem.type]) {
        acc[hiveName].byType[yieldItem.type] = 0;
      }
      acc[hiveName].byType[yieldItem.type] += yieldItem.amount;
      
      return acc;
    }, {} as Record<string, { total: number; byType: Record<string, number>; yields: any[] }>);

    return yieldByHive;
  };

  const yieldByType = getYieldByType(selectedYearForStats);
  const yieldByHive = getYieldByTypeAndHive(selectedYearForStats);
  
  const getInspectionsByYear = (year: number) => {
    return inspections.filter(inspection => {
      const inspectionYear = new Date(inspection.date).getFullYear();
      return inspectionYear === year;
    }).length;
  };
  

  const yieldTypeLabels = {
    med: 'Med',
    pel: 'Peľ',
    propolis: 'Propolis',
    ine: 'Iné',
  };

  const handleEditYield = (yieldItem: any) => {
    setEditingYield(yieldItem);
    setEditAmount(yieldItem.amount.toString());
    setEditNotes(yieldItem.notes || '');
  };

  const handleSaveYield = () => {
    if (!editingYield || !editAmount.trim()) {
      Alert.alert('Chyba', 'Množstvo je povinné');
      return;
    }

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Chyba', 'Zadajte platné množstvo');
      return;
    }

    updateYield(editingYield.id, {
      amount,
      notes: editNotes.trim(),
    });

    setEditingYield(null);
    setEditAmount('');
    setEditNotes('');
    
    Alert.alert('Úspech', 'Výnos bol úspešne upravený');
  };

  const handleDeleteYield = (yieldItem: any) => {
    Alert.alert(
      'Zmazať výnos',
      'Naozaj chcete zmazať tento výnos?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Zmazať',
          style: 'destructive',
          onPress: () => {
            deleteYield(yieldItem.id);
            Alert.alert('Úspech', 'Výnos bol zmazaný');
          }
        }
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditingYield(null);
    setEditAmount('');
    setEditNotes('');
  };

  const toggleHiveExpansion = (hiveName: string) => {
    const newExpanded = new Set(expandedHives);
    if (newExpanded.has(hiveName)) {
      newExpanded.delete(hiveName);
    } else {
      newExpanded.add(hiveName);
    }
    setExpandedHives(newExpanded);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Štatistiky</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Celkový prehľad</Text>
            <TouchableOpacity 
              onPress={() => setShowYearPicker(!showYearPicker)}
              style={styles.yearPickerButton}
            >
              <CalendarDays color="#6b7280" size={20} />
              <Text style={styles.yearPickerText}>{selectedYearForStats}</Text>
              {showYearPicker ? (
                <ChevronUp color="#6b7280" size={16} />
              ) : (
                <ChevronDown color="#6b7280" size={16} />
              )}
            </TouchableOpacity>
          </View>
          
          {showYearPicker && (
            <View style={styles.yearPickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearPickerScroll}>
                {availableYears.map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearPickerItem,
                      selectedYearForStats === year && styles.yearPickerItemSelected
                    ]}
                    onPress={() => {
                      setSelectedYearForStats(year);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.yearPickerItemText,
                      selectedYearForStats === year && styles.yearPickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Rodiny v roku"
              value={getHiveCountByYear(selectedYearForStats)}
              icon={Hexagon}
              color="#22c55e"
            />
            <StatCard
              title={`Prehliadky ${selectedYearForStats}`}
              value={getInspectionsByYear(selectedYearForStats)}
              icon={Calendar}
              color="#3b82f6"
            />
            <StatCard
              title="Prehliadky tento mesiac"
              value={thisMonthInspections}
              subtitle={`${monthNames[currentMonth]} ${currentYear}`}
              icon={TrendingUp}
              color="#f59e0b"
            />
            <StatCard
              title={`Výnosy ${selectedYearForStats}`}
              value={`${getYieldByType(selectedYearForStats).med || 0} kg medu`}
              subtitle={`Celkové výnosy: ${Object.values(getYieldByType(selectedYearForStats)).reduce((sum, amount) => sum + amount, 0).toFixed(1)} kg`}
              icon={BarChart3}
              color="#8b5cf6"
            />
          </View>
        </View>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Výnosy podľa typu ({selectedYearForStats})</Text>
          <View style={styles.yieldList}>
            {Object.entries(yieldByType).map(([type, amount]) => (
              <View key={type} style={styles.yieldItem}>
                <Text style={styles.yieldType}>
                  {yieldTypeLabels[type as keyof typeof yieldTypeLabels] || type}
                </Text>
                <Text style={styles.yieldAmount}>{amount.toFixed(1)} kg</Text>
              </View>
            ))}
            {Object.keys(yieldByType).length === 0 && (
              <View style={styles.emptyYield}>
                <Text style={styles.emptyYieldText}>
                  Zatiaľ neboli zaznamenané žiadne výnosy pre rok {selectedYearForStats}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeaderClickable}
            onPress={() => setShowHiveYields(!showHiveYields)}
          >
            <View style={styles.sectionHeaderWithToggle}>
              <Text style={styles.sectionTitle}>Výnosy podľa rodín ({selectedYearForStats})</Text>
              {showHiveYields ? (
                <ChevronUp color="#6b7280" size={20} />
              ) : (
                <ChevronDown color="#6b7280" size={20} />
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              {Object.keys(yieldByHive).length} rodín s výnosmi • Kliknite pre zobrazenie/skrytie
            </Text>
          </TouchableOpacity>
          
          {showHiveYields && (
            <View style={styles.hiveYieldList}>
            {Object.entries(yieldByHive).map(([hiveName, data]) => {
              const isExpanded = expandedHives.has(hiveName);
              return (
                <View key={hiveName} style={styles.hiveYieldItem}>
                  <TouchableOpacity 
                    style={styles.hiveYieldHeader}
                    onPress={() => toggleHiveExpansion(hiveName)}
                  >
                    <View style={styles.hiveYieldHeaderContent}>
                      <Text style={styles.hiveYieldName}>{hiveName}</Text>
                      <View style={styles.hiveYieldHeaderRight}>
                        <TouchableOpacity
                          style={styles.editHiveButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (data.yields.length > 0) {
                              handleEditYield(data.yields[0]);
                            }
                          }}
                        >
                          <Pencil color="#6b7280" size={14} />
                        </TouchableOpacity>
                        <Text style={styles.hiveYieldTotal}>{data.total.toFixed(1)} kg</Text>
                        {isExpanded ? (
                          <ChevronUp color="#6b7280" size={16} />
                        ) : (
                          <ChevronDown color="#6b7280" size={16} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.hiveYieldBreakdown}>
                    {Object.entries(data.byType).map(([type, amount]) => (
                      <Text key={type} style={styles.hiveYieldType}>
                        {yieldTypeLabels[type as keyof typeof yieldTypeLabels] || type}: {amount.toFixed(1)} kg
                      </Text>
                    ))}
                  </View>
                  
                  {isExpanded && (
                    <View style={styles.yieldItemsList}>
                      {data.yields.map((yieldItem: any) => (
                        <View key={yieldItem.id} style={styles.individualYieldItem}>
                          <View style={styles.yieldItemInfo}>
                            <Text style={styles.yieldItemDate}>
                              {new Date(yieldItem.date).toLocaleDateString('sk-SK')}
                            </Text>
                            <Text style={styles.yieldItemDetails}>
                              {yieldTypeLabels[yieldItem.type as keyof typeof yieldTypeLabels] || yieldItem.type}: {yieldItem.amount} kg
                            </Text>
                            {yieldItem.notes && (
                              <Text style={styles.yieldItemNotes}>{yieldItem.notes}</Text>
                            )}
                          </View>
                          <View style={styles.yieldItemActions}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => handleEditYield(yieldItem)}
                            >
                              <Edit3 color="#3b82f6" size={16} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            {Object.keys(yieldByHive).length === 0 && (
              <View style={styles.emptyYield}>
                <Text style={styles.emptyYieldText}>
                  Zatiaľ neboli zaznamenané žiadne výnosy pre rok {selectedYearForStats}
                </Text>
              </View>
            )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typy rodín</Text>
          <View style={styles.hiveTypesList}>
            {Object.entries(
              hives.filter(hive => !hive.isDeleted).reduce((acc, hive) => {
                const type = hive.type;
                if (!acc[type]) {
                  acc[type] = 0;
                }
                acc[type]++;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => {
              const typeLabels = {
                odlozenec: 'Odloženec',
                roj: 'Roj',
                zabehnutaRodina: 'Zabehnutá rodina',
                kupeneVcelstvo: 'Kúpené včelstvo',
                ine: 'Iné',
              };
              
              return (
                <View key={type} style={styles.hiveTypeItem}>
                  <Text style={styles.hiveTypeLabel}>
                    {typeLabels[type as keyof typeof typeLabels] || type}
                  </Text>
                  <Text style={styles.hiveTypeCount}>{count}</Text>
                </View>
              );
            })}
            {hives.filter(hive => !hive.isDeleted).length === 0 && (
              <View style={styles.emptyHiveTypes}>
                <Text style={styles.emptyHiveTypesText}>
                  Zatiaľ neboli pridané žiadne rodiny
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-harvest')}
      >
        <Plus color="#ffffff" size={24} />
      </TouchableOpacity>

      <Modal
        visible={editingYield !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upraviť výnos</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>
            
            {editingYield && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Rodina:</Text>
                <Text style={styles.modalValue}>
                  {hives.find(h => h.id === editingYield.hiveId)?.name || `Úľ ${editingYield.hiveId}`}
                </Text>
                
                <Text style={styles.modalLabel}>Typ:</Text>
                <Text style={styles.modalValue}>
                  {yieldTypeLabels[editingYield.type as keyof typeof yieldTypeLabels] || editingYield.type}
                </Text>
                
                <Text style={styles.modalLabel}>Dátum:</Text>
                <Text style={styles.modalValue}>
                  {new Date(editingYield.date).toLocaleDateString('sk-SK')}
                </Text>
                
                <Text style={styles.modalLabel}>Množstvo (kg):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="Zadajte množstvo"
                />
                
                <Text style={styles.modalLabel}>Poznámky:</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Voliteľné poznámky"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  handleCancelEdit();
                  if (editingYield) {
                    handleDeleteYield(editingYield);
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>Zmazať</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveYield}
              >
                <Text style={styles.saveButtonText}>Uložiť</Text>
              </TouchableOpacity>
            </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  yieldList: {
    gap: 8,
  },
  yieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yieldType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  yieldAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  emptyYield: {
    padding: 24,
    alignItems: 'center',
  },
  emptyYieldText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  hiveTypesList: {
    gap: 8,
  },
  hiveTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hiveTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  hiveTypeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyHiveTypes: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHiveTypesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  resetButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  yearPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  yearPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  yearPickerContainer: {
    marginBottom: 16,
  },
  yearPickerScroll: {
    maxHeight: 50,
  },
  yearPickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yearPickerItemSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  yearPickerItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  yearPickerItemTextSelected: {
    color: '#ffffff',
  },
  sectionHeaderClickable: {
    marginBottom: 16,
  },
  sectionHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  hiveYieldList: {
    gap: 12,
  },
  hiveYieldItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hiveYieldHeader: {
    marginBottom: 8,
  },
  hiveYieldHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hiveYieldHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hiveYieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  hiveYieldTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  hiveYieldBreakdown: {
    gap: 4,
  },
  hiveYieldType: {
    fontSize: 14,
    color: '#6b7280',
  },
  yieldItemsList: {
    marginTop: 12,
    gap: 8,
  },
  individualYieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yieldItemInfo: {
    flex: 1,
  },
  yieldItemDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  yieldItemDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  yieldItemNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  yieldItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  editHiveButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 12,
  },
  modalValue: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});