import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Hexagon, ChevronRight } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hive } from '@/types/beekeeping';

const hiveTypeLabels = {
  odlozenec: 'Odloženec',
  roj: 'Roj',
  zabehnutaRodina: 'Zabehnutá rodina',
  kupeneVcelstvo: 'Kúpené včelstvo',
  ine: 'Iné',
};

const queenStatusLabels = {
  stara: 'Stará matka',
  nova: 'Nová matka',
  vylahne: 'Ide sa vyliahnuť',
};

export default function HivesScreen() {
  const { hives } = useBeekeeping();
  const insets = useSafeAreaInsets();

  const renderHiveItem = ({ item }: { item: Hive }) => (
    <TouchableOpacity 
      style={styles.hiveCard}
      onPress={() => router.push(`/hive/${item.id}`)}
    >
      <View style={styles.hiveHeader}>
        <View style={styles.hiveIcon}>
          <Hexagon color="#22c55e" size={24} />
        </View>
        <View style={styles.hiveInfo}>
          <Text style={styles.hiveName}>{item.name}</Text>
          <Text style={styles.hiveType}>{hiveTypeLabels[item.type]}</Text>
        </View>
        <ChevronRight color="#9ca3af" size={20} />
      </View>
      
      <View style={styles.hiveDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Rámiky:</Text>
          <Text style={styles.detailValue}>{item.frameCount}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Matka:</Text>
          <Text style={styles.detailValue}>{queenStatusLabels[item.queenStatus]}</Text>
        </View>
        {item.queenColor && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Farba matky:</Text>
            <View style={styles.colorIndicator}>
              <Text style={styles.detailValue}>{item.queenColor}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Hexagon color="#d1d5db" size={64} />
      <Text style={styles.emptyTitle}>Žiadne úle</Text>
      <Text style={styles.emptyDescription}>
        Pridajte svoj prvý úľ a začnite viesť denník
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/modal')}
      >
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>Pridať úľ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Moje úle</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/modal')}
        >
          <Plus color="#22c55e" size={24} />
        </TouchableOpacity>
      </View>

      {hives.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={hives}
          renderItem={renderHiveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    gap: 12,
  },
  hiveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hiveInfo: {
    flex: 1,
  },
  hiveName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  hiveType: {
    fontSize: 14,
    color: '#6b7280',
  },
  hiveDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});