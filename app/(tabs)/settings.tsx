import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { 
  MessageSquare, 
  ExternalLink, 
  User, 
  Shield, 
  Info,
  ChevronRight,
  LogOut 
} from 'lucide-react-native';
import { useBeekeeping } from '@/hooks/beekeeping-store';
import { useAuth } from '@/hooks/auth-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { isRegistered, getRemainingTrialDays, register } = useBeekeeping();
  const { user, logout, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const remainingDays = getRemainingTrialDays();

  const handleFeedback = async () => {
    const email = 'jaroslav.trizuliak@centrum.sk';
    const subject = 'Spätná väzba - Včelársky denník';
    const body = 'Dobrý deň,\n\nchcel by som sa podeliť o spätnú väzbu k aplikácii Včelársky denník:\n\n';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
        if (Platform.OS === 'web') {
          alert('E-mailový klient sa otvára...');
        }
      } else {
        // Show email details for manual contact
        const message = `E-mailový klient nie je dostupný.\n\nKontaktujte nás manuálne:\n\nE-mail: ${email}\nPredmet: ${subject}\n\nAlebo skopírujte e-mail a napíšte nám vašu spätnú väzbu.`;
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          console.log(message);
        }
      }
    } catch (error) {
      const message = `E-mailový klient nie je dostupný.\n\nKontaktujte nás manuálne:\n\nE-mail: ${email}\nPredmet: ${subject}\n\nAlebo skopírujte e-mail a napíšte nám vašu spätnú väzbu.`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        console.log(message);
      }
    }
  };

  const handleBlogLink = async () => {
    const url = 'https://www.vcelarstvotrizuliak.sk/blog';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        } else {
          console.log('Nepodarilo sa otvoriť odkaz:', url);
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        console.log('Chyba pri otváraní odkazu:', url);
      }
    }
  };

  const handleRegister = () => {
    if (Platform.OS === 'web') {
      const shouldRegister = confirm('Registrácia bude dostupná v budúcej verzii aplikácie. Simulovať registráciu?');
      if (shouldRegister) {
        register();
        alert('Úspech! Registrácia bola úspešná!');
      }
    } else {
      register();
      console.log('Registrácia úspešná');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const shouldLogout = confirm('Naozaj sa chcete odhlásiť?');
      if (shouldLogout) {
        try {
          await logout();
        } catch (error) {
          alert('Chyba pri odhlasovaní');
        }
      }
    } else {
      try {
        await logout();
      } catch (error) {
        console.error('Chyba pri odhlasovaní:', error);
      }
    }
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress, 
    icon: Icon,
    showChevron = true 
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    icon: any;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon color="#6b7280" size={20} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && <ChevronRight color="#9ca3af" size={20} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nastavenia</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isRegistered && (
          <View style={styles.section}>
            <View style={styles.trialCard}>
              <View style={styles.trialHeader}>
                <Shield color="#f59e0b" size={24} />
                <Text style={styles.trialTitle}>Skúšobná verzia</Text>
              </View>
              <Text style={styles.trialText}>
                {remainingDays !== null && remainingDays > 0
                  ? `Zostáva ${remainingDays} ${remainingDays === 1 ? 'deň' : remainingDays < 5 ? 'dni' : 'dní'}`
                  : 'Skúšobná doba vypršala'
                }
              </Text>
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerButtonText}>Registrovať sa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Účet</Text>
          <View style={styles.settingsList}>
            <SettingItem
              title={user ? user.name : (isRegistered ? "Registrovaný používateľ" : "Skúšobná verzia")}
              subtitle={user ? user.email : (isRegistered ? "Máte plný prístup k aplikácii" : "Obmedzenú dobu")}
              onPress={() => {}}
              icon={User}
              showChevron={false}
            />
            {user && (
              <SettingItem
                title="Odhlásiť sa"
                subtitle="Odhlásiť sa z účtu"
                onPress={handleLogout}
                icon={LogOut}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podpora</Text>
          <View style={styles.settingsList}>
            <SettingItem
              title="Spätná väzba"
              subtitle="jaroslav.trizuliak@centrum.sk - Pošlite nám vaše nápady"
              onPress={handleFeedback}
              icon={MessageSquare}
            />
            <SettingItem
              title="Blog"
              subtitle="www.vcelarstvotrizuliak.sk/blog"
              onPress={handleBlogLink}
              icon={ExternalLink}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informácie</Text>
          <View style={styles.settingsList}>
            <SettingItem
              title="O aplikácii"
              subtitle="Verzia 1.0.0"
              onPress={() => {
                if (Platform.OS === 'web') {
                  alert('Včelársky denník\n\nAplikácia pre vedenie denníka včelnice.\n\nVerzia: 1.0.0\nVyvinuté pre včelárov.');
                } else {
                  console.log('O aplikácii: Včelársky denník v1.0.0');
                }
              }}
              icon={Info}
              showChevron={false}
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  trialCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  trialText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsList: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});