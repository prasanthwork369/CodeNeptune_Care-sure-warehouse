import FloatingTabBar from "@/src/components/FloatingTabBar";
import { tabs } from "@/src/constants/data";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback } from "react";
import {
  useSyncFulfillment,
  useReleaseStaleLocks,
} from "@/src/features/picker/hooks/useFulfillment";

function FulfillmentSync() {
  useSyncFulfillment();
  // Release locks orphaned by an app kill/reload mid-pick (otherwise the
  // claimed order stays hidden from the queue for ~10 min)
  useReleaseStaleLocks();
  return null;
}

export default function TabLayout() {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <FloatingTabBar {...props} />,
    [],
  );

  return (
    <>
      <FulfillmentSync />
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title }}
          />
        ))}
      </Tabs>
    </>
  );
}
