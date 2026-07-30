import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

/**
 * Use this as the root of any screen that does NOT have an absolute-positioned
 * bottom bar. It adds safe-area padding on the bottom so the 3-button nav bar
 * never hides content. Screens with their own absolute bottom bars (e.g.
 * OrderSummaryView, OrderPickingView) handle insets themselves — do not wrap
 * those in ScreenWrapper.
 */
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  edges = ["bottom"],
}) => (
  <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
    {children}
  </SafeAreaView>
);

export default ScreenWrapper;
