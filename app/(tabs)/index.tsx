import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Eye, Bell, BarChart3, Hexagon, ChevronDown, MapPin, Edit3, ChevronRight, ClipboardList, Package } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import TrialBanner from '@/components/TrialBanner';
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

export default function DashboardScreen() {
  const {
    getThisMonthInspections,
    getPendingTasks,
    getThisYearYield,

    apiaries,
    getCurrentApiary,
    getCurrentApiaryHives,
    setCurrentApiary,
    addApiary,
    updateApiary,
  } = useBeekeeping();
  const insets = useSafeAreaInsets();

  const [showApiarySelector, setShowApiarySelector] = React.useState(false);
  const [showAddApiaryModal, setShowAddApiaryModal] = React.useState(false);
  const [newApiaryName, setNewApiaryName] = React.useState('');
  const [showEditApiaryModal, setShowEditApiaryModal] = React.useState(false);
  const [editingApiary, setEditingApiary] = React.useState<string | null>(null);
  const [editApiaryName, setEditApiaryName] = React.useState('');
  
  const currentApiary = getCurrentApiary();
  const currentApiaryHives = getCurrentApiaryHives();
  const thisMonthInspections = getThisMonthInspections();
  const pendingTasks = getPendingTasks();
  const thisYearYield = getThisYearYield();
  const activeHiveCount = currentApiaryHives.length;
  


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



  const renderHiveItem = React.useCallback(({ item }: { item: Hive }) => {
    
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
        </View>
      </TouchableOpacity>
    );
  }, []);

  const EmptyHivesState = () => (
    <View style={styles.emptyHivesState}>
      <Hexagon color="#d1d5db" size={48} />
      <Text style={styles.emptyHivesTitle}>Žiadne úle</Text>
      <Text style={styles.emptyHivesDescription}>
        {currentApiary 
          ? `Pridajte prvý úľ do včelnice ${currentApiary.name}`
          : 'Pridajte svoj prvý úľ a začnite viesť denník'
        }
      </Text>
      <TouchableOpacity 
        style={styles.addHiveButton}
        onPress={() => router.push('/modal')}
      >
        <Plus color="#ffffff" size={16} />
        <Text style={styles.addHiveButtonText}>Pridať úľ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TrialBanner />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Včelársky denník</Text>
          
          {/* Add Apiary Button */}
          <TouchableOpacity 
            style={styles.addApiaryButton}
            onPress={() => setShowAddApiaryModal(true)}
            disabled={apiaries.length >= 5}
          >
            <Plus color="#22c55e" size={16} />
            <Text style={[styles.addApiaryText, apiaries.length >= 5 && styles.disabledText]}>Pridať včelnicu</Text>
          </TouchableOpacity>
          
          {/* Apiary Selector */}
          <TouchableOpacity 
            style={styles.apiarySelector}
            onPress={() => setShowApiarySelector(!showApiarySelector)}
          >
            <View style={styles.apiarySelectorContent}>
              <MapPin color="#6b7280" size={16} />
              <Text style={styles.apiaryName}>
                {currentApiary?.name || 'Žiadna včelnica'}
              </Text>
              <ChevronDown color="#6b7280" size={16} />
            </View>
          </TouchableOpacity>
          
          {/* Apiary Dropdown */}
          {showApiarySelector && (
            <View style={styles.apiaryDropdown}>
              {apiaries.map((apiary) => (
                <View key={apiary.id} style={styles.apiaryOptionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.apiaryOption,
                      currentApiary?.id === apiary.id && styles.selectedApiaryOption
                    ]}
                    onPress={() => {
                      setCurrentApiary(apiary.id);
                      setShowApiarySelector(false);
                    }}
                  >
                    <Text style={[
                      styles.apiaryOptionText,
                      currentApiary?.id === apiary.id && styles.selectedApiaryOptionText
                    ]}>
                      {apiary.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editApiaryButton}
                    onPress={() => {
                      setEditingApiary(apiary.id);
                      setEditApiaryName(apiary.name);
                      setShowEditApiaryModal(true);
                      setShowApiarySelector(false);
                    }}
                  >
                    <Edit3 color="#6b7280" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prehľad</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Úle v tejto včelnici"
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
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/modal')}
            >
              <View style={[styles.quickActionCardIcon, { backgroundColor: '#22c55e' }]}>
                <Plus color="#ffffff" size={20} />
              </View>
              <Text style={styles.quickActionCardText}>Pridať úľ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/quick-inspection')}
            >
              <View style={[styles.quickActionCardIcon, { backgroundColor: '#3b82f6' }]}>
                <ClipboardList color="#ffffff" size={20} />
              </View>
              <Text style={styles.quickActionCardText}>Rýchla prehliadka</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/add-harvest')}
            >
              <View style={[styles.quickActionCardIcon, { backgroundColor: '#f59e0b' }]}>
                <Package color="#ffffff" size={20} />
              </View>
              <Text style={styles.quickActionCardText}>Pridať úrodu</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/reminders')}
            >
              <View style={[styles.quickActionCardIcon, { backgroundColor: '#8b5cf6' }]}>
                <Bell color="#ffffff" size={20} />
              </View>
              <Text style={styles.quickActionCardText}>Upozornenie</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moje úle</Text>
          {currentApiaryHives.length === 0 ? (
            <EmptyHivesState />
          ) : (
            <FlatList
              data={currentApiaryHives}
              renderItem={renderHiveItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.hivesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Add Apiary Modal */}
      <Modal
        visible={showAddApiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddApiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pridať novú včelnicu</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Názov včelnice"
              value={newApiaryName}
              onChangeText={setNewApiaryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddApiaryModal(false);
                  setNewApiaryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Zrušiť</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (newApiaryName.trim()) {
                    const apiaryNumber = apiaries.length + 1;
                    addApiary({
                      name: newApiaryName.trim(),
                      location: {
                        latitude: 48.1486,
                        longitude: 17.1077,
                        address: 'Slovensko'
                      },
                      description: `Včelnica č.${apiaryNumber}`
                    });
                    setShowAddApiaryModal(false);
                    setNewApiaryName('');
                  } else {
                    Alert.alert('Chyba', 'Zadajte názov včelnice');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Pridať</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Apiary Modal */}
      <Modal
        visible={showEditApiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditApiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upraviť názov včelnice</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Názov včelnice"
              value={editApiaryName}
              onChangeText={setEditApiaryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditApiaryModal(false);
                  setEditingApiary(null);
                  setEditApiaryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Zrušiť</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (editApiaryName.trim() && editingApiary) {
                    updateApiary(editingApiary, {
                      name: editApiaryName.trim()
                    });
                    setShowEditApiaryModal(false);
                    setEditingApiary(null);
                    setEditApiaryName('');
                  } else {
                    Alert.alert('Chyba', 'Zadajte názov včelnice');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Uložiť</Text>
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  hivesList: {
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
  emptyHivesState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyHivesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyHivesDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  addHiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addHiveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  addApiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
    gap: 6,
  },
  addApiaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
  },
  disabledText: {
    color: '#9ca3af',
  },
  apiarySelector: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  apiarySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  apiaryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  apiaryDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: -8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  apiaryOption: {
    flex: 1,
    padding: 16,
  },
  selectedApiaryOption: {
    backgroundColor: '#f0fdf4',
  },
  apiaryOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  apiaryOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedApiaryOptionText: {
    color: '#22c55e',
    fontWeight: '500',
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  editApiaryButton: {
    padding: 16,
    paddingLeft: 8,
  },
});