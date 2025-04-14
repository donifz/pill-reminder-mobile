import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage } from '../i18n';

export const LanguageSelector = ({showTitle=true}) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
  };

  return (
    <View style={styles.container}>
      {showTitle&&<Text style={styles.title}>{t('settings.selectLanguage')}</Text>}
      <View style={styles.languageContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              i18n.language === lang.code && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text
              style={[
                styles.languageText,
                i18n.language === lang.code && styles.selectedLanguageText,
              ]}
            >
              {lang.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  languageButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedLanguage: {
    backgroundColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
  },
  selectedLanguageText: {
    color: 'white',
  },
}); 