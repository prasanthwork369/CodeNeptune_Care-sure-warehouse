import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { StatsScope } from "../types/home";

const SCOPES: { value: StatsScope; label: string }[] = [
  { value: "warehouse", label: "My Warehouse" },
  { value: "me", label: "My Stats" },
];

interface StatsScopeTabsProps {
  value: StatsScope;
  onChange: (scope: StatsScope) => void;
}

const StatsScopeTabs = ({ value, onChange }: StatsScopeTabsProps) => (
  <View className="flex-row bg-gray-100 rounded-full p-1 mb-2">
    {SCOPES.map((scope) => {
      const active = scope.value === value;
      return (
        <TouchableOpacity
          key={scope.value}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          onPress={() => {
            if (active) return;
            Haptics.selectionAsync();
            onChange(scope.value);
          }}
          // Active look goes through `style`, not className: NativeWind can't
          // add shadow classes (CSS variables) after the first render — it
          // remounts the component and its dev warning crashes with
          // "Couldn't find a navigation context".
          className="flex-1 py-2.5 rounded-full items-center"
          style={active ? styles.active : undefined}
        >
          <Text
            numberOfLines={1}
            className="text-sm"
            style={active ? styles.activeLabel : styles.label}
          >
            {scope.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  active: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  label: { color: "#6B7280", fontFamily: "Inter_500Medium" },
  activeLabel: { color: "#1A1A1A", fontFamily: "Inter_700Bold" },
});

export default StatsScopeTabs;
