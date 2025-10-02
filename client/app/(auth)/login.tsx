import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [state, setState] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!state.email || !re.test(state.email.toLowerCase())) {
      Alert.alert('Error', 'Email is invalid');
      return;
    }

    if (state.password.length < 6) {
      Alert.alert('Error', 'Password must contain at least 6 characters');
      return;
    }

    try {
      const res = await fetch(process.env.EXPO_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}api/auth/login` : 'http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, password: state.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data?.message || 'Failed to log in');
        return;
      }

      if (data?.token) {
        // @ts-ignore
        globalThis.authToken = data.token;
      }

      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Network error');
    }
  };

  const screenWidth =
    Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth : 400) : Dimensions.get('screen').width;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.container}>
        <Image source={require('../../assets/yoga_main.jpg')} style={{ width: screenWidth, height: screenWidth * 0.8 }} />
        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Login</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Email"
            value={state.email}
            onChangeText={(text) => setState({ ...state, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              value={state.password}
              onChangeText={(text) => setState({ ...state, password: text })}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.iconButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin}>
            <View style={styles.submitButton}>
              <Text style={styles.submitText}>Login</Text>
            </View>
          </TouchableOpacity>

          <Link href="/(auth)/signup" style={styles.switchText}>
            Don&apos;t have an account? Sign up
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, zIndex: 100, backgroundColor: Colors.white },
  formContainer: {
    backgroundColor: Colors.white,
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    top: -10,
    paddingBottom: 20,
  },
  textInput: {
    backgroundColor: Colors.accent,
    margin: 10,
    height: 40,
    borderRadius: 30,
    paddingLeft: 15,
    paddingRight: 45, // add space for icon
    color: Colors.black,
    ...Platform.select({
      android: { elevation: 1 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' },
    }),
  },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  iconButton: { position: 'absolute', right: 25, top: '50%', transform: [{ translateY: -11 }] },
  submitButton: {
    alignSelf: 'center',
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.yellow,
    height: 40,
    borderRadius: 60,
    marginTop: 10,
  },
  submitText: {
    color: Colors.white,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 2,
  },
  headerText: {
    color: Colors.secondary,
    fontSize: 40,
    textTransform: 'uppercase',
    padding: 10,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  switchText: { alignSelf: 'center', marginTop: 12, color: Colors.secondary },
});
