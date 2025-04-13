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

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({ name, email, password });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledView className="flex-1 bg-gray-50">
      <StyledView className="flex-1 px-4 py-8">
        <StyledView className="mb-8">
          <StyledText className="text-3xl font-bold text-gray-900 text-center">
            Create Account
          </StyledText>
          <StyledText className="text-gray-600 text-center mt-2">
            Sign up to start tracking your medications
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
              Name
            </StyledText>
            <StyledTextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>

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
              placeholder="Create a password"
              secureTextEntry
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>

          <StyledView>
            <StyledText className="text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </StyledText>
            <StyledTextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
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
                Create Account
              </StyledText>
            )}
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="mt-4"
          >
            <StyledText className="text-blue-600 text-center">
              Already have an account? Sign in
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}; 