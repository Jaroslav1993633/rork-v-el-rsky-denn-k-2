import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BarChart3, TrendingUp, Hexagon, Calendar, RotateCcw, History, ChevronDown, ChevronUp, Plus, CalendarDays } from 'lucide-react-native';
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
  } = useBeekeeping();
  const insets = useSafeAreaInsets();
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedYearForStats, setSelectedYearForStats] = useState(currentYear);

  const thisMonthInspections = getThisMonthInspections();
  const thisYearYield = getThisYearYield();
  const averageInspectionsPerHive = hives.length > 0 ? (inspections.length / hives.length).toFixed(1) : '0';
  
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
        {onReset && (
          <TouchableOpacity onPress={onReset} style={styles.resetButton}>
            <RotateCcw color="#6b7280" size={16} />
          </TouchableOpacity>
        )}
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
      const hiveName = hive ? hive.name : `Úľ ${yieldItem.hiveId}`;
      
      if (!acc[hiveName]) {
        acc[hiveName] = { total: 0, byType: {} };
      }
      
      acc[hiveName].total += yieldItem.amount;
      
      if (!acc[hiveName].byType[yieldItem.type]) {
        acc[hiveName].byType[yieldItem.type] = 0;
      }
      acc[hiveName].byType[yieldItem.type] += yieldItem.amount;
      
      return acc;
    }, {} as Record<string, { total: number; byType: Record<string, number> }>);

    return yieldByHive;
  };

  const yieldByType = getYieldByType(selectedYearForStats);
  const yieldByHive = getYieldByTypeAndHive(selectedYearForStats);
  
  const getInspectionsByYear = (year: number) => {
    return inspections.filter(inspection => 
      new Date(inspection.date).getFullYear() === year
    ).length;
  };
  
  const getHiveCountByYear = (year: number) => {
    return hives.filter(hive => 
      new Date(hive.createdAt).getFullYear() <= year
    ).length;
  };
  const yieldTypeLabels = {
    med: 'Med',
    pel: 'Peľ',
    propolis: 'Propolis',
    ine: 'Iné',
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
              title="Úle v roku"
              value={getHiveCountByYear(selectedYearForStats)}
              subtitle={`Celkom úľov: ${hives.length}`}
              icon={Hexagon}
              color="#22c55e"
            />
            <StatCard
              title={`Prehliadky ${selectedYearForStats}`}
              value={getInspectionsByYear(selectedYearForStats)}
              subtitle={`Celkom: ${inspections.length} prehliadok`}
              icon={Calendar}
              color="#3b82f6"
            />
            <StatCard
              title="Prehliadky tento mesiac"
              value={thisMonthInspections}
              subtitle={`${monthNames[currentMonth]} ${currentYear}`}
              icon={TrendingUp}
              color="#f59e0b"
              onReset={handleResetMonth}
            />
            <StatCard
              title={`Úroda ${selectedYearForStats}`}
              value={`${getYieldByType(selectedYearForStats).med || 0} kg medu`}
              subtitle={`Celková úroda: ${Object.values(getYieldByType(selectedYearForStats)).reduce((sum, amount) => sum + amount, 0).toFixed(1)} kg`}
              icon={BarChart3}
              color="#8b5cf6"
              onReset={selectedYearForStats === currentYear ? handleResetYear : undefined}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => setShowHistorical(!showHistorical)}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: "#ef4444" }]}>
                  <History color="#ffffff" size={20} />
                </View>
                <Text style={styles.statTitle}>História štatistík</Text>
                {showHistorical ? (
                  <ChevronUp color="#6b7280" size={16} />
                ) : (
                  <ChevronDown color="#6b7280" size={16} />
                )}
              </View>
              <Text style={styles.statValue}>{availableYears.length}</Text>
              <Text style={styles.statSubtitle}>Dostupných rokov</Text>
            </TouchableOpacity>
          </View>
          
          {showHistorical && (
            <View style={styles.historicalSection}>
              <Text style={styles.historicalTitle}>Dostupné roky:</Text>
              <View style={styles.yearsList}>
                {availableYears.map(year => {
                  const yearStats = yearlyStats.find(stat => stat.year === year);
                  const isSelected = selectedYear === year;
                  
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[styles.yearButton, isSelected && styles.yearButtonSelected]}
                      onPress={() => setSelectedYear(isSelected ? null : year)}
                    >
                      <Text style={[styles.yearButtonText, isSelected && styles.yearButtonTextSelected]}>
                        {year}
                      </Text>
                      <View style={styles.yearStats}>
                        <Text style={[styles.yearStatsText, isSelected && styles.yearStatsTextSelected]}>
                          {getInspectionsByYear(year)} prehliadok
                        </Text>
                        <Text style={[styles.yearStatsText, isSelected && styles.yearStatsTextSelected]}>
                          {getHiveCountByYear(year)} úľov
                        </Text>
                        <Text style={[styles.yearStatsText, isSelected && styles.yearStatsTextSelected]}>
                          {Object.values(getYieldByType(year)).reduce((sum, amount) => sum + amount, 0).toFixed(1)} kg
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {selectedYear && (
                <View style={styles.monthlyBreakdown}>
                  <Text style={styles.monthlyTitle}>Mesačný prehľad {selectedYear}:</Text>
                  <View style={styles.monthsList}>
                    {monthNames.map((monthName, monthIndex) => {
                      const yearStats = yearlyStats.find(stat => stat.year === selectedYear);
                      const monthStats = yearStats?.monthlyBreakdown.find(stat => stat.month === monthIndex);
                      
                      if (!monthStats || (monthStats.inspectionCount === 0 && monthStats.yieldAmount === 0)) {
                        return null;
                      }
                      
                      return (
                        <View key={monthIndex} style={styles.monthItem}>
                          <Text style={styles.monthName}>{monthName}</Text>
                          <View style={styles.monthStatsContainer}>
                            <Text style={styles.monthStat}>
                              {monthStats.inspectionCount} prehliadok
                            </Text>
                            <Text style={styles.monthStat}>
                              {monthStats.yieldAmount.toFixed(1)} kg
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeaderClickable}
            onPress={() => {
              const totalYield = Object.values(yieldByType).reduce((sum, amount) => sum + amount, 0);
              const yieldDetails = Object.entries(yieldByType)
                .map(([type, amount]) => `${yieldTypeLabels[type as keyof typeof yieldTypeLabels] || type}: ${amount.toFixed(1)} kg`)
                .join('\n');
              
              Alert.alert(
                `Úroda ${selectedYearForStats}`,
                `Celková úroda: ${totalYield.toFixed(1)} kg\n\nDetaily:\n${yieldDetails}`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.sectionTitle}>Úroda podľa typu ({selectedYearForStats})</Text>
            <Text style={styles.sectionSubtitle}>Kliknite pre detaily</Text>
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Úroda podľa úľov ({selectedYearForStats})</Text>
          <View style={styles.hiveYieldList}>
            {Object.entries(yieldByHive).map(([hiveName, data]) => (
              <View key={hiveName} style={styles.hiveYieldItem}>
                <View style={styles.hiveYieldHeader}>
                  <Text style={styles.hiveYieldName}>{hiveName}</Text>
                  <Text style={styles.hiveYieldTotal}>{data.total.toFixed(1)} kg</Text>
                </View>
                <View style={styles.hiveYieldBreakdown}>
                  {Object.entries(data.byType).map(([type, amount]) => (
                    <Text key={type} style={styles.hiveYieldType}>
                      {yieldTypeLabels[type as keyof typeof yieldTypeLabels] || type}: {amount.toFixed(1)} kg
                    </Text>
                  ))}
                </View>
              </View>
            ))}
            {Object.keys(yieldByHive).length === 0 && (
              <View style={styles.emptyYield}>
                <Text style={styles.emptyYieldText}>
                  Zatiaľ neboli zaznamenané žiadne výnosy pre rok {selectedYearForStats}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typy úľov</Text>
          <View style={styles.hiveTypesList}>
            {Object.entries(
              hives.reduce((acc, hive) => {
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
            {hives.length === 0 && (
              <View style={styles.emptyHiveTypes}>
                <Text style={styles.emptyHiveTypesText}>
                  Zatiaľ neboli pridané žiadne úle
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
  historicalSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  yearsList: {
    gap: 8,
  },
  yearButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yearButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  yearButtonTextSelected: {
    color: '#ffffff',
  },
  yearStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  yearStatsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  yearStatsTextSelected: {
    color: '#ffffff',
  },
  monthlyBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  monthsList: {
    gap: 8,
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  monthStatsContainer: {
    alignItems: 'flex-end',
  },
  monthStat: {
    fontSize: 12,
    color: '#6b7280',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
});