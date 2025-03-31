import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
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
        'Failed to login. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledView className="flex-1 bg-gray-50">
      <StyledView className="flex-1 px-4 py-8">
        <StyledView className="mb-8">
          <StyledText className="text-3xl font-bold text-gray-900 text-center">
            Sign in
          </StyledText>
          <StyledText className="text-gray-600 text-center mt-2">
            Welcome back! Please sign in to continue.
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
              Email
            </StyledText>
            <StyledTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>

          <StyledView>
            <StyledText className="text-sm font-medium text-gray-700 mb-1">
              Password
            </StyledText>
            <StyledTextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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
                Sign in
              </StyledText>
            )}
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            onPress={() => navigation.navigate('Register')}
            className="mt-4"
          >
            <StyledText className="text-blue-600 text-center">
              Don't have an account? Sign up
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}; 