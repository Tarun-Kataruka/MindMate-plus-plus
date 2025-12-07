import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TherapistsScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="people-circle" size={80} color={Colors.secondary} style={styles.icon} />
        <Text style={styles.title}>{t("therapist.findYourTherapist")}</Text>
        <Text style={styles.subtitle}>{t("therapist.subtitle")}</Text>
        <Text style={styles.infoText}>{t("therapist.infoText")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.lightGrey,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: 'center',
  }
});
