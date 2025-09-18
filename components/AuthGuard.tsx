import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useBeekeeping } from '@/hooks/beekeeping-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  // Always call the hook, but handle potential undefined return
  const beekeepingData = useBeekeeping();
  
  // Safely extract data with defaults
  const isRegistered = beekeepingData?.isRegistered ?? false;
  const beekeepingLoading = beekeepingData?.isLoading ?? true;
  
  // Check if beekeeping data is available
  const isBeekeepingDataReady = beekeepingData !== undefined && beekeepingData !== null;

  useEffect(() => {
    if (authLoading || beekeepingLoading || !isBeekeepingDataReady) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const remainingTrialDays = beekeepingData.getRemainingTrialDays();
    
    // If trial expired and not registered, force registration
    if (!isRegistered && remainingTrialDays !== null && remainingTrialDays <= 0) {
      if (!inAuthGroup) {
        router.replace('/register');
      }
      return;
    }
    
    // Normal auth flow for registered users
    if (isRegistered) {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Trial user - allow access to main app, block auth screens
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, authLoading, beekeepingLoading, isRegistered, beekeepingData, segments, router, isBeekeepingDataReady]);

  if (authLoading || beekeepingLoading || !isBeekeepingDataReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f39c12" />
        <Text style={styles.loadingText}>Načítavam...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});