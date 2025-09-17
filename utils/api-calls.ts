import { useAuth } from '@/hooks/auth-store';
import type { ApiError } from '@/types/auth';

// Example API endpoints - replace with your actual backend URLs
const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  VERIFY_TOKEN: '/auth/verify',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Beekeeping data
  HIVES: '/api/hives',
  INSPECTIONS: '/api/inspections',
  YIELDS: '/api/yields',
  TASKS: '/api/tasks',
  APIARIES: '/api/apiaries',
  
  // User profile
  PROFILE: '/api/profile',
  UPDATE_PROFILE: '/api/profile',
} as const;

// Example hook for making authenticated API calls
export function useApiCalls() {
  const { apiCall, token, user } = useAuth();

  // Example: Sync hives with backend
  const syncHives = async (hives: any[]) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await apiCall(API_ENDPOINTS.HIVES, {
        method: 'POST',
        body: JSON.stringify({ hives }),
      });
      return response;
    } catch (error) {
      console.error('Error syncing hives:', error);
      throw error;
    }
  };

  // Example: Fetch hives from backend
  const fetchHives = async () => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await apiCall(API_ENDPOINTS.HIVES, {
        method: 'GET',
      });
      return response.hives || [];
    } catch (error) {
      console.error('Error fetching hives:', error);
      throw error;
    }
  };

  // Example: Sync inspections with backend
  const syncInspections = async (inspections: any[]) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await apiCall(API_ENDPOINTS.INSPECTIONS, {
        method: 'POST',
        body: JSON.stringify({ inspections }),
      });
      return response;
    } catch (error) {
      console.error('Error syncing inspections:', error);
      throw error;
    }
  };

  // Example: Sync yields with backend
  const syncYields = async (yields: any[]) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await apiCall(API_ENDPOINTS.YIELDS, {
        method: 'POST',
        body: JSON.stringify({ yields }),
      });
      return response;
    } catch (error) {
      console.error('Error syncing yields:', error);
      throw error;
    }
  };

  // Example: Update user profile
  const updateUserProfile = async (updates: Partial<any>) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Example: Upload image to backend
  const uploadImage = async (imageUri: string, type: 'hive' | 'inspection') => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`,
      } as any);
      formData.append('type', type);

      const response = await apiCall('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  return {
    syncHives,
    fetchHives,
    syncInspections,
    syncYields,
    updateUserProfile,
    uploadImage,
    isAuthenticated: !!token,
    user,
  };
}

// Example: Firebase integration helper
export class FirebaseAPI {
  private static instance: FirebaseAPI;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  static getInstance(baseUrl?: string, apiKey?: string): FirebaseAPI {
    if (!FirebaseAPI.instance && baseUrl && apiKey) {
      FirebaseAPI.instance = new FirebaseAPI(baseUrl, apiKey);
    }
    return FirebaseAPI.instance;
  }

  async authenticateWithFirebase(idToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Firebase authentication failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Firebase auth error:', error);
      throw error;
    }
  }

  async syncDataWithFirebase(data: any, collection: string) {
    try {
      const response = await fetch(`${this.baseUrl}/firestore/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Firebase sync failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Firebase sync error:', error);
      throw error;
    }
  }
}

// Example usage in a component:
/*
import { useApiCalls } from '@/utils/api-calls';

export default function MyComponent() {
  const { syncHives, fetchHives, isAuthenticated } = useApiCalls();

  const handleSyncData = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated');
      return;
    }

    try {
      const hives = await fetchHives();
      console.log('Fetched hives:', hives);
      
      // Sync local changes back to server
      await syncHives(localHives);
      console.log('Hives synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    // Your component JSX
  );
}
*/