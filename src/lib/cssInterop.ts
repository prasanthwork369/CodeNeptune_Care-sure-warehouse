// NativeWind only rewrites `React.createElement` calls inside node_modules.
// Since SDK 58, Expo packages compile JSX to `react/jsx-runtime`, so a
// `className` forwarded through these components is silently dropped.
// Register them explicitly so `className` is converted to `style`.
import { cssInterop } from "nativewind";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

cssInterop(LinearGradient, { className: "style" });
cssInterop(BlurView, { className: "style" });
cssInterop(Image, { className: "style" });
