import FloatingTabBar from "@/src/components/FloatingTabBar";
import { tabs } from "@/src/constants/data";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback } from "react";
import { useSyncFulfillment } from "@/src/hooks/useFulfillment";

function FulfillmentSync() {
    useSyncFulfillment();
    return null;
}

export default function TabLayout() {
    const renderTabBar = useCallback((props: BottomTabBarProps) => (
        <FloatingTabBar {...props} />
    ), []);

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
