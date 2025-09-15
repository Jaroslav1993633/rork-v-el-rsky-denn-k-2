import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BarChart3, TrendingUp, Hexagon, Calendar } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatisticsScreen() {
  const {
    hives,
    inspections,
    yields,
    getThisMonthInspections,
    getThisYearYield,
  } = useBeekeeping();
  const insets = useSafeAreaInsets();

  const thisMonthInspections = getThisMonthInspections();
  const thisYearYield = getThisYearYield();
  const averageInspectionsPerHive = hives.length > 0 ? (inspections.length / hives.length).toFixed(1) : '0';

  const StatCard = ({ 
    title, 
    value, 
    subtitle,
    icon: Icon,
    color = "#22c55e"
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any;
    color?: string;
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

  const getYieldByType = () => {
    const yieldByType = yields.reduce((acc, yieldItem) => {
      const type = yieldItem.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += yieldItem.amount;
      return acc;
    }, {} as Record<string, number>);

    return yieldByType;
  };

  const yieldByType = getYieldByType();
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
          <Text style={styles.sectionTitle}>Celkový prehľad</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Celkom úľov"
              value={hives.length}
              icon={Hexagon}
              color="#22c55e"
            />
            <StatCard
              title="Celkom prehliadok"
              value={inspections.length}
              subtitle={`Priemer ${averageInspectionsPerHive} na úľ`}
              icon={Calendar}
              color="#3b82f6"
            />
            <StatCard
              title="Prehliadky tento mesiac"
              value={thisMonthInspections}
              icon={TrendingUp}
              color="#f59e0b"
            />
            <StatCard
              title="Úroda tento rok"
              value={`${thisYearYield.toFixed(1)} kg`}
              icon={BarChart3}
              color="#8b5cf6"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Úroda podľa typu</Text>
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
                  Zatiaľ neboli zaznamenané žiadne výnosy
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
});