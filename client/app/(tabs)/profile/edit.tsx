import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser, UserData } from "./profile";
const Colors = {
  primary: "#77C272",
  secondary: "#388e3c",
  tint: "#252525",
  white: "#fff",
  black: "#000",
  lightGrey: "#e0e0e0",
  yellow: "#FFC107",
};

const initialConcerns = [
  "Anger",
  "Anxiety and Panic Attacks",
  "Depression",
  "Eating disorders",
  "Self-esteem",
  "Self-harm",
  "Stress",
  "Sleep disorders",
];

export default function EditProfileScreen() {
  const API_BASE = ((process.env.EXPO_PUBLIC_API_URL as string) || "").replace(
    /\/?$/,
    "/"
  );
  const { userData, setUserData } = useUser();
  const [fullName, setFullName] = useState(userData.name);
  const [email, setEmail] = useState(userData.email);
  const [gender, setGender] = useState(userData.gender);
  const [phone, setPhone] = useState(userData.phone);
  const [age, setAge] = useState(String(userData.age));
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(
    userData.concerns
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    String(userData.emergencyContactName || "")
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    String(userData.emergencyContactPhone || "")
  );
  useEffect(() => {
    const load = async () => {
      try {
        const token = (globalThis as any).authToken as string | undefined;
        if (!token) return;
        const res = await fetch(`${API_BASE}api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.user) {
          setFullName(data.user.name || "");
          setEmail(data.user.email || "");
          setGender(data.user.gender || "other");
          setPhone(data.user.phone || "");
          setAge(String(data.user.age || ""));
          setSelectedConcerns(
            Array.isArray(data.user.concerns) ? data.user.concerns : []
          );
          setEmergencyContactName(String(data.user.emergencyContactName || ""));
          setEmergencyContactPhone(
            String(data.user.emergencyContactPhone || "")
          );
          if (data.user.avatarUrl) {
            (EditProfileScreen as any).pendingAvatarUrl = String(
              data.user.avatarUrl
            );
          }
        }
      } catch {}
    };
    load();
  }, [API_BASE]);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  };

  const handleSaveChanges = async () => {
    const newUserData: UserData = {
      name: fullName,
      email: email,
      gender: gender,
      phone: phone,
      age: parseInt(age) || userData.age,
      concerns: selectedConcerns,
      emergencyContactName,
      emergencyContactPhone,
    };
    try {
      const token = (globalThis as any).authToken as string | undefined;
      if (token) {
        await fetch(`${API_BASE}api/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newUserData.name,
            age: newUserData.age,
            gender: newUserData.gender,
            phone: newUserData.phone,
            concerns: newUserData.concerns,
            email: newUserData.email,
            avatarUrl: (EditProfileScreen as any).pendingAvatarUrl,
            emergencyContactName: newUserData.emergencyContactName,
            emergencyContactPhone: newUserData.emergencyContactPhone,
          }),
        });
      }
    } catch {}

    setUserData({
      ...newUserData,
      ...((EditProfileScreen as any).pendingAvatarUrl
        ? {
            /* @ts-ignore */ avatarUrl: (EditProfileScreen as any)
              .pendingAvatarUrl,
          }
        : {}),
    } as any);
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
        <Image
          source={{
            uri:
              (EditProfileScreen as any).pendingAvatarUrl ||
              "https://placehold.co/100x100/388e3c/ffffff?text=" +
                fullName.charAt(0),
          }}
          style={styles.avatar}
        />
        <TouchableOpacity
          style={styles.cameraIcon}
          onPress={async () => {
            try {
              if (Platform.OS === "web") {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async () => {
                  const file = (input.files && input.files[0]) || null;
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    (EditProfileScreen as any).pendingAvatarUrl = String(
                      reader.result || ""
                    );
                    // force rerender by changing local state minimally
                    setFullName((v) => v + "");
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              } else {
                Alert.alert(
                  "Not implemented",
                  "Native image picker can be added on request."
                );
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to pick image");
            }
          }}
        >
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

        {/* Email (now editable) */}
        <InputWithIcon
          iconName="mail-outline"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={true}
          isUnderlined={true}
          style={{ marginBottom: 20 }}
        />

        {/* Gender Selection */}
        <View style={styles.genderRow}>
          <Text style={styles.radioLabel}>Gender:</Text>
          <RadioButton
            label="Male"
            selected={gender === "male"}
            onPress={() => setGender("male")}
          />
          <RadioButton
            label="Female"
            selected={gender === "female"}
            onPress={() => setGender("female")}
          />
          <RadioButton
            label="Other"
            selected={gender === "other"}
            onPress={() => setGender("other")}
          />
        </View>

        {/* Phone and Age Input Row */}
        <View style={styles.combinedInputRow}>
          {/* Phone Input */}
          <View
            style={[
              styles.inputGroup,
              {
                flex: 2,
                marginRight: 15,
                borderBottomWidth: 1,
                borderBottomColor: Colors.lightGrey,
              },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={24}
              color={Colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInputFull}
              placeholder="Phone no."
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Age Input */}
          <View
            style={[
              styles.inputGroup,
              {
                flex: 1,
                borderBottomWidth: 1,
                borderBottomColor: Colors.lightGrey,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={Colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInputFull, { textAlign: "center" }]}
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

      {/* Emergency Contact Section */}
      <Text style={styles.sectionTitle}>Emergency Contact</Text>
      <InputWithIcon
        iconName="people-outline"
        placeholder="Contact name"
        value={emergencyContactName}
        onChangeText={setEmergencyContactName}
      />
      <InputWithIcon
        iconName="call-outline"
        placeholder="Contact phone"
        value={emergencyContactPhone}
        onChangeText={setEmergencyContactPhone}
        keyboardType="phone-pad"
      />

      {/* Save Changes Button */}
      <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
      </TouchableOpacity>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Reusable Input Component
const InputWithIcon = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  isUnderlined = true,
  style = {},
}: any) => (
  <View
    style={[styles.inputGroup, isUnderlined && styles.underlinedInput, style]}
  >
    <Ionicons
      name={iconName}
      size={24}
      color={Colors.secondary}
      style={styles.inputIcon}
    />
    <TextInput
      style={[
        styles.textInputFull,
        { color: editable ? Colors.black : Colors.secondary },
      ]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
    />
  </View>
);

// Reusable Radio Button
const RadioButton = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
    <Text style={styles.radioLabelText}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={radioStyles.radioCircle}>
      {selected && <View style={radioStyles.radioInnerCircle} />}
    </TouchableOpacity>
  </View>
);

const CheckboxItem = ({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={checkboxStyles.container}>
    <View style={checkboxStyles.textContainer}>
      <Text style={checkboxStyles.text}>{text}</Text>
    </View>
    <View
      style={[
        checkboxStyles.checkbox,
        selected && checkboxStyles.checkboxSelected,
      ]}
    >
      {selected && (
        <Ionicons name="checkmark-sharp" size={16} color={Colors.white} />
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: { fontSize: 22, fontWeight: "bold", color: Colors.white },
  avatarSection: {
    alignItems: "center",
    paddingTop: 20,
    backgroundColor: Colors.primary,
    paddingBottom: 40,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  cameraIcon: {
    position: "absolute",
    right: "40%",
    bottom: 35,
    backgroundColor: Colors.secondary, // Assuming secondary is a dark color
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  formContainer: { padding: 20, marginTop: -10 },

  // Input Styles
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  underlinedInput: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    marginBottom: 15,
  },
  inputIcon: { marginRight: 10 },
  textInputFull: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    paddingVertical: 0,
  },

  // Gender Row
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    paddingBottom: 15,
  },
  radioLabel: {
    color: Colors.secondary,
    fontSize: 16,
    marginRight: 10,
    fontWeight: "bold",
  },
  radioLabelText: { color: Colors.secondary, fontSize: 16, marginRight: 5 },

  // Phone/Age Row
  combinedInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 5,
  },

  // Concerns Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.secondary,
    marginTop: 20,
    marginBottom: 10,
    padding : 6
  },
  concernsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Button
  saveButton: {
    backgroundColor: Colors.yellow,
    padding: 15,
    borderRadius: 30,
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

const radioStyles = StyleSheet.create({
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary, // Green border for radio button
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary, // Green fill
  },
});

const checkboxStyles = StyleSheet.create({
  container: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 5,
  },
  textContainer: {
    flexShrink: 1,
  },
  text: {
    fontSize: 14,
    color: Colors.black,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
  },
});
