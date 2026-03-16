import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import {
  login,
  isBiometricAvailable,
  isBiometricLoginEnabled,
  getBiometricType,
  biometricLogin,
  enableBiometricLogin,
} from "../lib/auth";
import { useTheme } from "../lib/ThemeContext";

const logoImage = require("../assets/logo.png");

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric");
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => { checkBiometric(); }, []);

  const checkBiometric = async () => {
    try {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricLoginEnabled();
      if (available && enabled) {
        setBiometricReady(true);
        const type = await getBiometricType();
        setBiometricLabel(type);
      }
    } catch (e) {}
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      await biometricLogin();
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.message !== "Biometric authentication failed") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      const available = await isBiometricAvailable();
      const enabled = await isBiometricLoginEnabled();
      if (available && !enabled) {
        await enableBiometricLogin(formData.email, formData.password);
      }
      router.replace("/(tabs)");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const biometricIconName = biometricLabel === "Face ID" ? "scan-outline" : "finger-print-outline";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logoImage} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your BukkaPay account</Text>

        {biometricReady && (
          <TouchableOpacity
            style={[styles.biometricButton, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
          >
            {biometricLoading ? (
              <ActivityIndicator color="#7C3AED" />
            ) : (
              <>
                <View style={styles.biometricIconWrap}>
                  <Ionicons name={biometricIconName} size={32} color="#7C3AED" />
                </View>
                <Text style={[styles.biometricText, { color: colors.text }]}>Sign in with {biometricLabel}</Text>
                <Text style={[styles.biometricHint, { color: colors.textSecondary }]}>Touch the sensor or look at your phone</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {biometricReady && (
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or use password</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TouchableOpacity onPress={() => router.push("/(screens)/forgot-password")}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.brandingFooter}>
        <Text style={[styles.brandingTitle, { color: colors.text }]}>BukkaPay</Text>
        <Text style={[styles.brandingSubtitle, { color: colors.textSecondary }]}>The Pulse of African Finance</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: {
    borderRadius: 24, padding: 32, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  logoContainer: { alignItems: "center", marginBottom: 32 },
  logoImage: { width: 72, height: 72, borderRadius: 16 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { textAlign: "center", fontSize: 14, marginBottom: 28 },
  biometricButton: {
    alignItems: "center", paddingVertical: 24, borderRadius: 16,
    borderWidth: 1, marginBottom: 8,
  },
  biometricIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#EDE9FE", alignItems: "center",
    justifyContent: "center", marginBottom: 12,
  },
  biometricText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  biometricHint: { fontSize: 12 },
  form: { gap: 16 },
  fieldGroup: { marginBottom: 4 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  forgotText: { fontSize: 12, color: "#7C3AED" },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
  },
  inputIcon: { paddingLeft: 12 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16 },
  eyeButton: { paddingRight: 12, paddingVertical: 14 },
  loginButton: {
    backgroundColor: "#7C3AED", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  loginButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 12, fontSize: 14 },
  signupContainer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, color: "#7C3AED", fontWeight: "600" },
  brandingFooter: { alignItems: "center", marginTop: 32, paddingBottom: 32 },
  brandingTitle: { fontSize: 24, fontWeight: "700" },
  brandingSubtitle: { fontSize: 14, marginTop: 4, fontStyle: "italic" },
});
