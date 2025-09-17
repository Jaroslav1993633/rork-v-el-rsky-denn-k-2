import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import type { RegisterCredentials, ApiError } from '@/types/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { register: registerBeekeeping, getRemainingTrialDays } = useBeekeeping();
  
  const remainingDays = getRemainingTrialDays();
  
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Meno je povinné';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný email';
    }

    if (!formData.password) {
      newErrors.password = 'Heslo je povinné';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Heslo musí mať aspoň 6 znakov';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potvrdenie hesla je povinné';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Heslá sa nezhodujú';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      // Register in auth system
      await register(formData);
      
      // Mark as registered in beekeeping system (end trial)
      registerBeekeeping();
      
      router.replace('/(tabs)');
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.field) {
        setErrors({ [apiError.field]: apiError.message });
      } else {
        Alert.alert('Chyba', apiError.message || 'Registrácia sa nepodarila');
      }
    }
  };

  const updateField = (field: keyof RegisterCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Registrácia</Text>
            <Text style={styles.subtitle}>
              {remainingDays !== null && remainingDays <= 0 
                ? 'Skúšobná doba vypršala. Zaregistrujte sa pre pokračovanie.'
                : 'Vytvorte si nový účet pre plný prístup'
              }
            </Text>
            {remainingDays !== null && remainingDays > 0 && (
              <View style={styles.trialInfo}>
                <Text style={styles.trialText}>
                  Zostáva {remainingDays} {remainingDays === 1 ? 'deň' : remainingDays < 5 ? 'dni' : 'dní'} skúšobnej doby
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Pokračovať v skúške</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Celé meno"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  autoCapitalize="words"
                  testID="register-name-input"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-email-input"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Heslo"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  testID="register-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Potvrdiť heslo"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-confirm-password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  testID="register-confirm-password-toggle"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              testID="register-submit-button"
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Registrujem...' : 'Registrovať'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Už máte účet? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                testID="register-login-link"
              >
                <Text style={styles.loginLink}>Prihlásiť sa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#f39c12',
    fontWeight: '600' as const,
  },
  trialInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignItems: 'center',
  },
  trialText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});