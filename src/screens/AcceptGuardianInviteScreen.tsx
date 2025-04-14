import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { guardianService } from '../services/guardianService';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type AcceptGuardianInviteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AcceptGuardianInvite'>;
  route: RouteProp<RootStackParamList, 'AcceptGuardianInvite'>;
};

export const AcceptGuardianInviteScreen = ({ navigation, route }: AcceptGuardianInviteScreenProps) => {
  const { t } = useTranslation();
  const { token } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        setLoading(true);
        setError(null);
        await guardianService.acceptInvitation(token);
        setSuccess(true);
        // Navigate back to home after 3 seconds
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 3000);
      } catch (error: any) {
        console.error('Error accepting invitation:', error);
        setError('Failed to accept invitation. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    acceptInvitation();
  }, [token, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>{t('guardian.acceptingInvitation')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.title}>{t('guardian.failedToAccept')}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{t('common.goToHome')}</Text>
            </TouchableOpacity>
          </View>
        ) : success ? (
          <View style={styles.centerContent}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={styles.title}>{t('guardian.invitationAccepted')}</Text>
            <Text style={styles.successText}>
              {t('guardian.redirectingToHome')}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 