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
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser, UserData } from "./profile";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
const Colors = {
  primary: "#77C272",
  secondary: "#388e3c",
  tint: "#252525",
  white: "#fff",
  black: "#000",
  lightGrey: "#e0e0e0",
  yellow: "#FFC107",
};

const concernKeys = [
  "anger",
  "anxiety",
  "depression",
  "eatingDisorder",
  "selfEsteem",
  "selfHarm",
  "stress",
  "sleepDisorder",
];

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
];

export default function EditProfileScreen() {
  const { t } = useTranslation();
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
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
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
          if (data.user.language) {
            setSelectedLanguage(data.user.language);
            i18n.changeLanguage(data.user.language);
          }
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

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowLanguageDropdown(false);
    i18n.changeLanguage(langCode);
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
            language: selectedLanguage,
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
        <Text style={styles.headerText}>{t("editProfile.title")}</Text>
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
        {/* Language Selector */}
        <View style={styles.languageSelector}>
          <Text style={styles.radioLabel}>{t("editProfile.selectLanguage")}:</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageDropdown(true)}
          >
            <Text style={styles.languageButtonText}>
              {(() => {
                const lang = languages.find((l) => l.code === selectedLanguage);
                if (!lang) return "English";
                const langKey = lang.code === "en" ? "english" : 
                               lang.code === "hi" ? "hindi" : 
                               lang.code === "ta" ? "tamil" : 
                               lang.code === "te" ? "telugu" : "kannada";
                return t(`languages.${langKey}`);
              })()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Fullname Input */}
        <InputWithIcon
          iconName="person-outline"
          placeholder={t("editProfile.fullname")}
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Email (now editable) */}
        <InputWithIcon
          iconName="mail-outline"
          placeholder={t("editProfile.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={true}
          isUnderlined={true}
          style={{ marginBottom: 20 }}
        />

        {/* Gender Selection */}
        <View style={styles.genderRow}>
          <Text style={styles.radioLabel}>{t("editProfile.gender")}</Text>
          <RadioButton
            label={t("profile.male")}
            selected={gender === "male"}
            onPress={() => setGender("male")}
          />
          <RadioButton
            label={t("profile.female")}
            selected={gender === "female"}
            onPress={() => setGender("female")}
          />
          <RadioButton
            label={t("profile.other")}
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
              placeholder={t("editProfile.phone")}
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
              placeholder={t("editProfile.age")}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        {/* Concerns Checkbox Section */}
        <Text style={styles.sectionTitle}>{t("editProfile.myConcerns")}</Text>
        <View style={styles.concernsGrid}>
          {concernKeys.map((concernKey, index) => {
            const concernText = t(`concerns.${concernKey}`);
            const concernKeyMapped = concernKey === "eatingDisorder" ? "Eating disorders" :
              concernKey === "selfEsteem" ? "Self-esteem" :
              concernKey === "selfHarm" ? "Self-harm" :
              concernKey === "sleepDisorder" ? "Sleep disorders" :
              concernKey === "anxiety" ? "Anxiety and Panic Attacks" :
              concernKey.charAt(0).toUpperCase() + concernKey.slice(1);
            return (
              <CheckboxItem
                text={concernText}
                selected={selectedConcerns.includes(concernKeyMapped)}
                onPress={() => toggleConcern(concernKeyMapped)}
                key={index}
              />
            );
          })}
        </View>
      </View>

      {/* Emergency Contact Section */}
      <Text style={styles.sectionTitle}>{t("editProfile.emergencyContact")}</Text>
      <InputWithIcon
        iconName="people-outline"
        placeholder={t("editProfile.contactName")}
        value={emergencyContactName}
        onChangeText={setEmergencyContactName}
      />
      <InputWithIcon
        iconName="call-outline"
        placeholder={t("editProfile.contactPhone")}
        value={emergencyContactPhone}
        onChangeText={setEmergencyContactPhone}
        keyboardType="phone-pad"
      />

      {/* Save Changes Button */}
      <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>{t("editProfile.saveChanges")}</Text>
      </TouchableOpacity>

      {/* Language Dropdown Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("editProfile.selectLanguage")}</Text>
            {languages.map((lang) => {
              const langKey = lang.code === "en" ? "english" : 
                             lang.code === "hi" ? "hindi" : 
                             lang.code === "ta" ? "tamil" : 
                             lang.code === "te" ? "telugu" : "kannada";
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === lang.code && styles.languageOptionTextSelected,
                    ]}
                  >
                    {t(`languages.${langKey}`)}
                  </Text>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    paddingBottom: 15,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: "space-between",
  },
  languageButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.secondary,
    marginBottom: 20,
    textAlign: "center",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  languageOptionSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: Colors.primary,
  },
  languageOptionText: {
    fontSize: 16,
    color: Colors.black,
  },
  languageOptionTextSelected: {
    color: Colors.secondary,
    fontWeight: "600",
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
