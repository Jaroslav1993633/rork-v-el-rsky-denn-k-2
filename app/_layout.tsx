// Import polyfill FIRST to ensure React.use is available before any other imports
import '@/utils/react-polyfill';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ErrorInfo, ReactNode, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BeekeepingProvider } from "@/hooks/beekeeping-store";
import { AuthProvider } from "@/hooks/auth-store";
import AuthGuard from "@/components/AuthGuard";

SplashScreen.preventAutoHideAsync().catch(console.warn);

const queryClient = new QueryClient();

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Niečo sa pokazilo</Text>
          <Text style={styles.errorText}>Aplikácia sa reštartuje...</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  console.log('RootLayoutNav: Rendering...');
  
  return (
    <ErrorBoundary>
      <AuthGuard>
        <Stack screenOptions={{ headerBackTitle: "Späť" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen name="quick-inspection" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="add-harvest" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="hive/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeApp = async () => {
      try {
        console.log('RootLayout: Starting app initialization...');
        
        // Wait for React and Expo Router to be fully initialized
        timeoutId = setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('RootLayout: Splash screen hidden');
          } catch (splashError) {
            console.warn('Error hiding splash screen:', splashError);
          }
          setIsReady(true);
          console.log('RootLayout: App ready');
        }, 2000); // Increased delay for better stability
      } catch (error) {
        console.error('Error initializing app:', error);
        setHasError(true);
        setIsReady(true);
      }
    };

    initializeApp();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!isReady) {
    console.log('RootLayout: App not ready, showing loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f39c12" />
        <Text style={styles.loadingText}>Načítavam...</Text>
      </View>
    );
  }
  
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Chyba pri spustení</Text>
        <Text style={styles.errorText}>Aplikácia sa reštartuje...</Text>
      </View>
    );
  }
  
  console.log('RootLayout: Rendering main app...');

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <BeekeepingProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </BeekeepingProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}