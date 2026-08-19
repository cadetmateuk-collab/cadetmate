declare module "next-themes/dist/types" {
  import type { ReactNode } from "react";

  export type ThemeProviderProps = {
    children?: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    forcedTheme?: string;
    themes?: string[];
  };
}
