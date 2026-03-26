export const electronAPI =
  typeof window !== "undefined" ? (window as any).electronAPI : null;
