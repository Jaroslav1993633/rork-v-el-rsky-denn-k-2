import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useBeekeeping } from '@/hooks/beekeeping-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [hasContextError, setHasContextError] = useState(false);
  
  // Always call hooks - React requires this
  const authData = useAuth();
  const beekeepingData = useBeekeeping();
  
  // Check for context errors
  useEffect(() => {
    if (!authData || !beekeepingData) {
      console.error('Context data is missing:', { authData: !!authData, beekeepingData: !!beekeepingData });
      setHasContextError(true);
    } else {
      setHasContextError(false);
    }
  }, [authData, beekeepingData]);
  
  // Safely extract data with defaults - handle undefined contexts
  const isAuthenticated = authData?.isAuthenticated ?? false;
  const authLoading = authData?.isLoading ?? true;
  const isRegistered = beekeepingData?.isRegistered ?? false;
  const beekeepingLoading = beekeepingData?.isLoading ?? true;
  
  // Check if data is available
  const isDataReady = authData !== undefined && authData !== null && 
                      beekeepingData !== undefined && beekeepingData !== null;
  
  console.log('AuthGuard state:', {
    isDataReady,
    hasContextError,
    authData: authData ? 'available' : 'null',
    beekeepingData: beekeepingData ? 'available' : 'null',
    isAuthenticated,
    authLoading,
    isRegistered,
    beekeepingLoading
  });
  
  // Initialize router readiness
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isRouterReady || authLoading || beekeepingLoading || !isDataReady) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const remainingTrialDays = beekeepingData?.getRemainingTrialDays?.() ?? null;
    
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
  }, [isRouterReady, isAuthenticated, authLoading, beekeepingLoading, isRegistered, beekeepingData, segments, router, isDataReady]);

  // If context is not available, show loading
  if (!authData || !beekeepingData || !isRouterReady || authLoading || beekeepingLoading || !isDataReady) {
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