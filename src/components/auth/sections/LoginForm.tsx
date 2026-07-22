import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InputError from '@/src/components/common/InputError';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  errors: { email?: string; password?: string };
  onFocus: () => void;
  onInputChange: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  errors,
  onFocus,
  onInputChange,
}) => {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <View>
      {/* Email */}
      <View>
        <Pressable
          onPress={() => emailRef.current?.focus()}
          className={`bg-[#F0F0F0] rounded-xl px-5 py-4 flex-row items-center border-2 ${errors.email ? 'border-[#FF4D4D]' : 'border-transparent'}`}
        >
          <TextInput
            ref={emailRef}
            placeholder="Email"
            placeholderTextColor="#6A6A6A"
            value={email}
            onChangeText={(val) => { setEmail(val); onInputChange(); }}
            onFocus={onFocus}
            autoCapitalize="none"
            autoComplete="username"
            keyboardType="email-address"
            textContentType="username"
            importantForAutofill="yes"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            className="flex-1 text-[#222222] font-inter text-[16px]"
          />
        </Pressable>
        <InputError message={errors.email} visible={!!errors.email} />
      </View>

      {/* Password */}
      <View className="mt-4">
        <Pressable
          onPress={() => passwordRef.current?.focus()}
          className={`bg-[#F0F0F0] rounded-xl px-5 py-4 flex-row items-center border-2 ${errors.password ? 'border-[#FF4D4D]' : 'border-transparent'}`}
        >
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            placeholderTextColor="#6A6A6A"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(val) => { setPassword(val); onInputChange(); }}
            onFocus={onFocus}
            autoComplete="password"
            textContentType="password"
            importantForAutofill="yes"
            returnKeyType="done"
            className="flex-1 text-[#222222] font-inter text-[16px]"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            className="p-2 -mr-2"
          >
            <View className="opacity-80">
              <MaterialCommunityIcons
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#6A6A6A"
              />
            </View>
          </TouchableOpacity>
        </Pressable>
        <InputError message={errors.password} visible={!!errors.password} />
      </View>
    </View>
  );
};
