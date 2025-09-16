import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Eye, Bell, BarChart3, Hexagon } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import TrialBanner from '@/components/TrialBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const {
    getThisMonthInspections,
    getPendingTasks,
    getThisYearYield,
    getActiveHiveCount,
  } = useBeekeeping();
  const insets = useSafeAreaInsets();

  const thisMonthInspections = getThisMonthInspections();
  const pendingTasks = getPendingTasks();
  const thisYearYield = getThisYearYield();
  const activeHiveCount = getActiveHiveCount();

  const StatCard = ({ 
    title, 
    value, 
    onPress, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    onPress?: () => void;
    icon: any;
  }) => (
    <TouchableOpacity 
      style={styles.statCard} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <Icon color="#6b7280" size={20} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </TouchableOpacity>
  );

  const QuickAction = ({ 
    title, 
    onPress, 
    icon: Icon,
    color = "#22c55e"
  }: { 
    title: string; 
    onPress: () => void;
    icon: any;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Icon color="#ffffff" size={20} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TrialBanner />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Včelársky denník</Text>
          <Text style={styles.subtitle}>Prehľad vašej včelnice</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prehľad</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Úle celkom"
              value={activeHiveCount}
              onPress={() => router.push('/hives')}
              icon={Hexagon}
            />
            <StatCard
              title="Prehliadky tento mesiac"
              value={thisMonthInspections}
              onPress={() => router.push('/statistics')}
              icon={Eye}
            />
            <StatCard
              title="Nadchádzajúce úlohy"
              value={pendingTasks.length}
              onPress={() => router.push('/reminders')}
              icon={Bell}
            />
            <StatCard
              title="Výnos tento rok (kg)"
              value={thisYearYield.toFixed(1)}
              onPress={() => router.push('/statistics')}
              icon={BarChart3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rýchle akcie</Text>
          <View style={styles.quickActions}>
            <QuickAction
              title="Pridať nový úľ"
              onPress={() => router.push('/modal')}
              icon={Plus}
            />
            <QuickAction
              title="Prehliadka úľa"
              onPress={() => router.push('/quick-inspection')}
              icon={Eye}
              color="#3b82f6"
            />
            <QuickAction
              title="Zobraziť pripomienky"
              onPress={() => router.push('/reminders')}
              icon={Bell}
              color="#f59e0b"
            />
            <QuickAction
              title="Štatistiky a analýzy"
              onPress={() => router.push('/statistics')}
              icon={BarChart3}
              color="#8b5cf6"
            />
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
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  quickActions: {
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
});