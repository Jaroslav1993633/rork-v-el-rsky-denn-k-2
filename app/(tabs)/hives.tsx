import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Hexagon, ChevronRight, Search, X } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hive } from '@/types/beekeeping';

const hiveTypeLabels = {
  odlozenec: 'Odloženec',
  roj: 'Roj',
  zabehnutaRodina: 'Zabehnutá rodina',
  kupeneVcelstvo: 'Kúpené včelstvo',
};

const queenEggLayingLabels = {
  lozi: 'Loží',
  nelozi: 'Neloží',
};

const queenStatusLabels = {
  stara: 'Stará matka',
  nova: 'Nová matka',
  vylahne: 'Ide sa vyliahnuť',
};

export default function HivesScreen() {
  const { hives, apiaries, getCurrentApiary, getCurrentApiaryHives } = useBeekeeping();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  
  const currentApiary = getCurrentApiary();
  const currentApiaryHives = getCurrentApiaryHives();

  // Filter hives based on search query
  const activeHives = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentApiaryHives;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return currentApiaryHives.filter(hive => 
      hive.name.toLowerCase().includes(query) ||
      hive.id.toLowerCase().includes(query)
    );
  }, [currentApiaryHives, searchQuery]);
  
  // Create a map of apiary names for efficient lookup
  const apiaryNamesMap = React.useMemo(() => {
    const map = new Map<string, string>();
    apiaries.forEach(apiary => {
      map.set(apiary.id, apiary.name);
    });
    return map;
  }, [apiaries]);
  
  // Debug logging
  console.log('Hives screen - Total hives:', hives.length);
  console.log('Hives screen - Active hives:', activeHives.length);
  console.log('Hives screen - Hives data:', hives.map(h => ({ id: h.id, name: h.name, isDeleted: h.isDeleted })));

  const renderHiveItem = React.useCallback(({ item }: { item: Hive }) => {
    const apiaryName = item.apiaryId ? apiaryNamesMap.get(item.apiaryId) || 'Neznáma' : null;
    
    return (
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
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Kladenie vajíčok:</Text>
            <Text style={styles.detailValue}>{queenEggLayingLabels[item.queenEggLaying]}</Text>
          </View>
          {item.queenColor && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Farba matky:</Text>
              <View style={styles.colorIndicator}>
                <Text style={styles.detailValue}>{item.queenColor}</Text>
              </View>
            </View>
          )}
          {item.colonyFoundingDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Založenie rodiny:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.colonyFoundingDate).toLocaleDateString('sk-SK')}
              </Text>
            </View>
          )}
          {apiaryName && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vcelnica:</Text>
              <Text style={styles.detailValue}>
                {apiaryName}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [apiaryNamesMap]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Hexagon color="#d1d5db" size={64} />
      <Text style={styles.emptyTitle}>Žiadne úle</Text>
      <Text style={styles.emptyDescription}>
        {currentApiary 
          ? `Pridajte prvý úľ do včelnice ${currentApiary.name}`
          : 'Pridajte svoj prvý úľ a začnite viesť denník'
        }
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
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Moje úle</Text>
          {currentApiary && (
            <Text style={styles.subtitle}>{currentApiary.name}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search color="#6b7280" size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/modal')}
          >
            <Plus color="#22c55e" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search color="#9ca3af" size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Hľadať úle podľa čísla alebo názvu..."
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#9ca3af" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {activeHives.length === 0 ? (
        searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Search color="#d1d5db" size={64} />
            <Text style={styles.emptyTitle}>Žiadne výsledky</Text>
            <Text style={styles.emptyDescription}>
              Nenašli sa žiadne úle pre hľadaný výraz &quot;{searchQuery}&quot;
            </Text>
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchButtonText}>Vymazať vyhľadávanie</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EmptyState />
        )
      ) : (
        <FlatList
          data={activeHives}
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  clearSearchButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  clearSearchButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },

});