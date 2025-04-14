import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage } from '../i18n';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t('common.fillAllFields'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password });
      await login({ 
        email: email.trim(),
        password: password.trim()
      });
      navigation.replace('Home');
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t('common.loginFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setShowLanguageModal(false);
  };

  return (
    <StyledView className="flex-1 bg-gray-50">
      <StyledView className="flex-1 px-4 py-8">
        {/* Language Selector Button */}
        <StyledView className="flex-row justify-end mb-4">
          <StyledTouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            className="p-2"
          >
            <Ionicons name="language-outline" size={24} color="#3B82F6" />
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView className="mb-8">
          <StyledText className="text-3xl font-bold text-gray-900 text-center">
            {t('auth.signIn')}
          </StyledText>
          <StyledText className="text-gray-600 text-center mt-2">
            {t('auth.welcomeBack')}
          </StyledText>
        </StyledView>

        {error && (
          <StyledView className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <StyledText className="text-red-600 text-center">{error}</StyledText>
          </StyledView>
        )}

        <StyledView className="space-y-4">
          <StyledView>
            <StyledText className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </StyledText>
            <StyledTextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.enterEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>

          <StyledView>
            <StyledText className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </StyledText>
            <StyledTextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.enterPassword')}
              secureTextEntry
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>

          <StyledTouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`bg-blue-600 py-4 rounded-xl ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <StyledText className="text-white font-semibold text-center">
                {t('auth.signIn')}
              </StyledText>
            )}
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            onPress={() => navigation.navigate('Register')}
            className="mt-4"
          >
            <StyledText className="text-blue-600 text-center">
              {t('auth.noAccount')}
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <StyledView className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <StyledView className="bg-white rounded-xl w-4/5 max-w-md p-5">
            <StyledView className="flex-row justify-between items-center mb-4">
              <StyledText className="text-xl font-bold">{t('settings.selectLanguage')}</StyledText>
              <StyledTouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </StyledTouchableOpacity>
            </StyledView>
            <StyledView>
              {languages.map((lang) => (
                <StyledTouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  className={`flex-row justify-between items-center p-3 mb-2 rounded-lg ${
                    i18n.language === lang.code ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <StyledText
                    className={`text-base ${
                      i18n.language === lang.code ? 'text-blue-600 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {lang.name}
                  </StyledText>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </StyledTouchableOpacity>
              ))}
            </StyledView>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledView>
  );
}; 