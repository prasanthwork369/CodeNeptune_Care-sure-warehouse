import React, { useState, useRef } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { authService } from "../services/auth.service";
import { validate } from "@/src/utils/validation";

// Modular Sections
import { LoginHeader } from "../components/LoginHeader";
import { LoginForm } from "../components/LoginForm";
import { LoginAction } from "../components/LoginAction";

export const LoginLayout: React.FC = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loginError, setLoginError] = useState("");

  const validateForm = () => {
    const emailRes = validate.email(email);
    const passRes = validate.password(password);

    const newErrors = {
      email: emailRes.valid ? undefined : emailRes.message,
      password: passRes.valid ? undefined : passRes.message,
    };

    setErrors(newErrors);
    return emailRes.valid && passRes.valid;
  };

  const onInputFocus = () => {
    scrollRef.current?.scrollTo({ y: 50, animated: true });
  };

  const handleInputChange = () => {
    if (loginError) setLoginError("");
    setErrors({});
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setLoginError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await authService.login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoginError(error?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="px-8"
        >
          <View className="pt-40 pb-6 flex-1">
            <LoginHeader />

            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              errors={errors}
              onFocus={onInputFocus}
              onInputChange={handleInputChange}
            />

            {/* API Error Message */}
            {loginError ? (
              <View className="mt-5 bg-[#FFF0F0] border border-[#FFD4D4] rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#CF1A1A" />
                <Text className="text-[#CF1A1A] font-inter-medium text-[14px] ml-3 flex-1">
                  {loginError}
                </Text>
              </View>
            ) : null}
          </View>

          <LoginAction isLoading={isLoading} onLogin={handleLogin} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginLayout;
