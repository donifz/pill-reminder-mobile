import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Guardian, guardianService } from '../services/guardianService';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type GuardianManagementScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GuardianManagement'>;
};

export const GuardianManagementScreen = ({ navigation }: GuardianManagementScreenProps) => {
  const { t } = useTranslation();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardiansFor, setGuardiansFor] = useState<Guardian[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const loadGuardians = async () => {
    try {
      setLoading(true);
      setError(null);
      const [guardiansData, guardiansForData] = await Promise.all([
        guardianService.getGuardians(),
        guardianService.getGuardianFor()
      ]);
      setGuardians(guardiansData);
      setGuardiansFor(guardiansForData);
    } catch (error: any) {
      console.error('Error loading guardians:', error);
      setError('Failed to load guardians. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
  }, []);

  const handleInviteGuardian = async () => {
    if (!inviteEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await guardianService.inviteGuardian(inviteEmail);
      Alert.alert('Success', 'Guardian invitation sent successfully');
      setInviteEmail('');
      loadGuardians();
    } catch (error: any) {
      console.error('Error inviting guardian:', error);
      setError('Failed to send guardian invitation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (guardian: Guardian) => {
    Alert.alert(
      'Accept Guardian Request',
      `Are you sure you want to accept the guardian request from ${guardian.user?.name}? This will allow you to view and manage their medications.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              await guardianService.acceptInvitation({ token: guardian.invitationToken });
              Alert.alert('Success', 'Guardian invitation accepted successfully');
              loadGuardians();
            } catch (error: any) {
              console.error('Error accepting invitation:', error);
              setError('Failed to accept invitation. Please try again later.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveGuardian = async (guardianId: string) => {
    Alert.alert(
      'Remove Guardian',
      'Are you sure you want to remove this guardian?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              const guardian = guardians.find(g => g.guardian?.id === guardianId);
              if (!guardian) {
                throw new Error('Guardian not found');
              }
              await guardianService.removeGuardian(guardian.id);
              Alert.alert('Success', 'Guardian removed successfully');
              loadGuardians();
            } catch (error: any) {
              console.error('Error removing guardian:', error);
              setError('Failed to remove guardian. Please try again later.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderGuardianList = (guardians: Guardian[], isReceived: boolean = false) => {
    if (guardians.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t('guardian.noInvitations', { type: isReceived ? 'received' : 'sent' })}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        {guardians.map((guardian) => (
          <View key={guardian.id} style={styles.guardianItem}>
            <View style={styles.guardianInfo}>
              <Text style={styles.guardianName}>
                {isReceived ? guardian.user?.name : guardian.guardian?.email || t('common.pending')}
              </Text>
              <Text style={styles.guardianEmail}>
                {isReceived ? guardian.user?.email : t('guardian.invitationSent')}
              </Text>
              <View style={styles.statusContainer}>
                {!guardian.isAccepted ? (
                  <View style={styles.pendingContainer}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <Text style={styles.pendingText}>Pending</Text>
                    <Text style={styles.statusDetail}>
                      {isReceived ? 'Invited on: ' : 'Sent on: '}{new Date(guardian.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.statusDetail}>
                      Expires: {new Date(guardian.invitationExpiresAt).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.acceptedContainer}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                    <Text style={styles.acceptedText}>Accepted</Text>
                    <Text style={styles.statusDetail}>
                      Accepted on {new Date(guardian.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.actionButtons}>
              {isReceived && !guardian.isAccepted && (
                <TouchableOpacity
                  onPress={() => handleAcceptInvitation(guardian)}
                  style={styles.actionButton}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                </TouchableOpacity>
              )}
              {!isReceived && (
                <TouchableOpacity
                  onPress={() => handleRemoveGuardian(guardian.id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('guardian.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inviteContainer}>
          <Text style={styles.inviteTitle}>{t('guardian.inviteGuardian')}</Text>
          <View style={styles.inviteInputContainer}>
            <TextInput
              placeholder={t('guardian.enterGuardianEmail')}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              style={styles.inviteInput}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={handleInviteGuardian}
              disabled={loading}
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.inviteButtonText}>{t('guardian.invite')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.activeTab]}
            onPress={() => setActiveTab('received')}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={activeTab === 'received' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'received' && styles.activeTabText,
              ]}
            >
              Received Invitations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
            onPress={() => setActiveTab('sent')}
          >
            <Ionicons
              name="send-outline"
              size={16}
              color={activeTab === 'sent' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'sent' && styles.activeTabText,
              ]}
            >
              Sent Invitations
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          activeTab === 'received'
            ? renderGuardianList(guardiansFor, true)
            : renderGuardianList(guardians)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#6B7280',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  inviteContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inviteInputContainer: {
    flexDirection: 'row',
  },
  inviteInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    color: '#000',
  },
  inviteButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    marginLeft: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  section: {
    marginBottom: 24,
  },
  guardianItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  guardianEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    marginTop: 8,
  },
  pendingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
  },
  acceptedContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
  },
  pendingText: {
    color: '#92400E',
    marginLeft: 4,
    fontWeight: '500',
  },
  acceptedText: {
    color: '#065F46',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
}); 