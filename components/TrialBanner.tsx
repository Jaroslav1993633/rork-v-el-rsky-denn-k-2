import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { router } from 'expo-router';

export default function TrialBanner() {
  const { isRegistered, getRemainingTrialDays } = useBeekeeping();
  
  if (isRegistered) return null;
  
  const remainingDays = getRemainingTrialDays();
  
  if (remainingDays === null || remainingDays <= 0) {
    return (
      <View style={[styles.banner, styles.expiredBanner]}>
        <AlertCircle color="#dc2626" size={16} />
        <Text style={styles.expiredText}>
          Skúšobná doba vypršala. Zaregistrujte sa pre pokračovanie.
        </Text>
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => {
            router.push('/settings');
          }}
        >
          <Text style={styles.registerButtonText}>Registrácia</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.banner}>
      <AlertCircle color="#f59e0b" size={16} />
      <Text style={styles.trialText}>
        Zostáva {remainingDays} {remainingDays === 1 ? 'deň' : remainingDays < 5 ? 'dni' : 'dní'} skúšobnej doby
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  expiredBanner: {
    backgroundColor: '#fee2e2',
    justifyContent: 'space-between',
  },
  trialText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  expiredText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});