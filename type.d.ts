import type { ComponentType } from "react";

declare global {
    interface AppTab {
        name: string;
        title: string;
        icon: ComponentType<{ fill?: string; width?: number; height?: number }>;
    }
    interface TabIconProps {
        icon: ComponentType<{ fill?: string; width?: number; height?: number }>;
        color: string;
        focused: boolean;
    }
}

