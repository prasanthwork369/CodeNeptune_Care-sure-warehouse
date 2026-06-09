import profile from '@/assets/images/profile.png';
import logo from '@/assets/images/logo.svg';

export const images = {
    profile,
    logo
} as const;

export type ImageKey = keyof typeof images;
