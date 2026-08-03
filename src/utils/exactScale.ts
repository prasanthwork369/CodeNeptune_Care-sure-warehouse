import { Dimensions, PixelRatio } from "react-native";

const BASE_WIDTH = 390;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const pixelRatio = PixelRatio.get();
const widthRatio = SCREEN_WIDTH / BASE_WIDTH;

// Layout scaling ratio clamped between 0.92 and 1.0 for consistent container sizing
const layoutRatio = Math.min(Math.max(widthRatio, 0.92), 1);

// Typography scaling ratio clamped between 0.9 and 1.0 for high legibility
const typographyRatio = Math.min(Math.max(widthRatio, 0.9), 1);

const snap = (value: number): number =>
  Math.round(value * pixelRatio) / pixelRatio;

export const scale = (size: number): number => {
  "worklet";
  return snap(size * widthRatio);
};

export const exactScale = (size: number): number => {
  "worklet";
  return snap(size * layoutRatio);
};

export const verticalScale = (size: number): number => {
  "worklet";
  return snap(size * layoutRatio);
};

export const moderateScale = (size: number, _factor = 0.5): number => {
  "worklet";
  return snap(size * typographyRatio);
};

export default exactScale;
