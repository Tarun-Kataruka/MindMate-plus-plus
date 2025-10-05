import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Assuming Colors is defined in '@/constants/theme'
const Colors = {
    primary: '#77C272', // Green
    secondary: '#388e3c', // Dark Green
    tint: '#252525', // Black/Grey
    white: '#fff',
    black: '#000',
    lightGrey: '#e0e0e0',
    yellow: '#FFC107',
};

// !!! IMPORT CONTEXT AND USE HOOK FROM PROFILE.TSX !!!
import { useUser, UserData } from './profile'; 

const initialConcerns = [
  'Anger', 'Anxiety and Panic Attacks', 'Depression', 'Eating disorders',
  'Self-esteem', 'Self-harm', 'Stress', 'Sleep disorders'
];

export default function EditProfileScreen() {
    // 1. Consume Context (GET initial data and the SETTER function)
    const { userData, setUserData } = useUser();

    // 2. Initialize local state from global context data
    const [fullName, setFullName] = useState(userData.name);
    // Email is kept read-only but needs state to match the pattern
    const [email, setEmail] = useState(userData.email); 
    const [gender, setGender] = useState(userData.gender);
    const [phone, setPhone] = useState(userData.phone);
    const [age, setAge] = useState(String(userData.age));
    const [selectedConcerns, setSelectedConcerns] = useState<string[]>(userData.concerns);

    const toggleConcern = (concern: string) => {
      setSelectedConcerns(prev =>
        prev.includes(concern)
          ? prev.filter(c => c !== concern)
          : [...prev, concern]
      );
    };

    const handleSaveChanges = () => {
      // 1. Assemble the new data object
      const newUserData: UserData = {
          name: fullName,
          email: email, // Email is read-only but included for completeness
          gender: gender,
          phone: phone,
          age: parseInt(age) || userData.age, // Handle case where age might be empty string
          concerns: selectedConcerns,
      };

      // 2. **Update Global State via Context**
      setUserData(newUserData); 
      
      console.log("Saving changes and updating context:", newUserData);
      
      // 3. Navigate back to the Profile screen
      router.back(); 
    };

    return (
      <ScrollView style={styles.container}>
        {/* Header and Back Icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Profile</Text>
          <View style={{ width: 28 }} /> {/* Spacer for symmetry */}
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {/* Placeholder for Shreya's Avatar - Corrected path */}
          <Image 
            source={{ uri: "https://placehold.co/100x100/388e3c/ffffff?text=" + fullName.charAt(0) }} 
            style={styles.avatar} 
          /> 
          <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {/* Fullname Input */}
          <InputWithIcon 
            iconName="person-outline" 
            placeholder="Fullname" 
            value={fullName} 
            onChangeText={setFullName}
          />

          {/* Email Display (Read-only) */}
          <InputWithIcon 
            iconName="mail-outline" 
            placeholder="Email" 
            value={email} 
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={false} // Email typically not editable
            isUnderlined={false} // Match design: Email text is separate
            style={{marginBottom: 20}}
          />
          
          {/* Gender Selection */}
          <View style={styles.genderRow}>
            <Text style={styles.radioLabel}>Gender:</Text>
            <RadioButton label="Male" selected={gender === 'male'} onPress={() => setGender('male')} />
            <RadioButton label="Female" selected={gender === 'female'} onPress={() => setGender('female')} />
            <RadioButton label="Other" selected={gender === 'other'} onPress={() => setGender('other')} />
          </View>

          {/* Phone and Age Input Row */}
          <View style={styles.combinedInputRow}>
            {/* Phone Input */}
            <View style={[styles.inputGroup, { flex: 2, marginRight: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGrey }]}>
                <Ionicons name="call-outline" size={24} color={Colors.secondary} style={styles.inputIcon} />
                <TextInput
                style={styles.textInputFull}
                placeholder="Phone no."
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                />
            </View>
            
            {/* Age Input */}
            <View style={[styles.inputGroup, { flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.lightGrey }]}>
              <Ionicons name="calendar-outline" size={24} color={Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInputFull, { textAlign: 'center' }]}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          {/* Concerns Checkbox Section */}
          <Text style={styles.sectionTitle}>My Concerns:</Text>
          <View style={styles.concernsGrid}>
            {initialConcerns.map((concern, index) => (
              <CheckboxItem
                text={concern}
                selected={selectedConcerns.includes(concern)}
                onPress={() => toggleConcern(concern)}
                key={index} // Use index as key here, safe for static lists
              />
            ))}
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>
    );
}

// Reusable Input Component
const InputWithIcon = ({ iconName, placeholder, value, onChangeText, keyboardType = 'default', editable = true, isUnderlined = true, style = {} }: any) => (
  <View style={[styles.inputGroup, isUnderlined && styles.underlinedInput, style]}>
    <Ionicons name={iconName} size={24} color={Colors.secondary} style={styles.inputIcon} />
    <TextInput
      style={[styles.textInputFull, { color: editable ? Colors.black : Colors.secondary }]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
    />
  </View>
);

// Reusable Radio Button
const RadioButton = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
    <Text style={styles.radioLabelText}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={radioStyles.radioCircle}>
      {selected && <View style={radioStyles.radioInnerCircle} />}
    </TouchableOpacity>
  </View>
);

// Reusable Checkbox Item
const CheckboxItem = ({ text, selected, onPress }: { text: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={checkboxStyles.container}>
    <Text style={checkboxStyles.text}>{text}</Text>
    <View style={[checkboxStyles.checkbox, selected && checkboxStyles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark-sharp" size={18} color={Colors.white} />}
    </View>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.primary, // Green Header
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    backgroundColor: Colors.primary,
    paddingBottom: 40,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.white },
  cameraIcon: {
    position: 'absolute', 
    right: '40%', 
    bottom: 35, 
    backgroundColor: Colors.secondary, // Assuming secondary is a dark color
    borderRadius: 20, width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  formContainer: { padding: 20, marginTop: -10 },
  
  // Input Styles
  inputGroup: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  underlinedInput: { borderBottomWidth: 1, borderBottomColor: Colors.lightGrey, marginBottom: 15 },
  inputIcon: { marginRight: 10 },
  textInputFull: { flex: 1, fontSize: 16, color: Colors.black, paddingVertical: 0 },

  // Gender Row
  genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGrey, paddingBottom: 15 },
  radioLabel: { color: Colors.secondary, fontSize: 16, marginRight: 10, fontWeight: 'bold' },
  radioLabelText: { color: Colors.secondary, fontSize: 16, marginRight: 5 },
  
  // Phone/Age Row
  combinedInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 5 },

  // Concerns Section
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.secondary, marginTop: 20, marginBottom: 10 },
  concernsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  // Button
  saveButton: {
    backgroundColor: Colors.yellow, 
    padding: 15, borderRadius: 30, marginHorizontal: 20, marginTop: 30,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

const radioStyles = StyleSheet.create({
  radioCircle: {
    height: 20, width: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.primary, // Green border for radio button
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  radioInnerCircle: {
    height: 10, width: 10, borderRadius: 5,
    backgroundColor: Colors.primary, // Green fill
  },
});

const checkboxStyles = StyleSheet.create({
  container: {
    width: '48%', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  text: { fontSize: 14, color: Colors.black },
  checkbox: {
    height: 24, width: 24, borderWidth: 2,
    borderColor: Colors.primary, // Green border
    borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary, // Green fill when selected
  }
});
