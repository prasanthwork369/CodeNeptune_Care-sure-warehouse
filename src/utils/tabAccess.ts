// Single source of truth for which panel tabs a user can open. Used by the
// tab bar and the Home stat cards so both stay in sync.
export type PanelTab = "picker" | "checker" | "dispatcher";

export const canAccessTab = (
  tabName: string,
  roles: string[],
  permissions: string[],
): boolean => {
  const isAdmin = roles.includes("admin");
  switch (tabName) {
    case "picker":
      return isAdmin || permissions.includes("picker-panel:read");
    case "checker":
      return (
        isAdmin ||
        roles.includes("checker") ||
        permissions.includes("checker-panel:read")
      );
    case "dispatcher":
      return (
        isAdmin ||
        permissions.includes("dispatcher-panel:read") ||
        permissions.includes("dispatcher-panel:update")
      );
    default:
      return true;
  }
};
