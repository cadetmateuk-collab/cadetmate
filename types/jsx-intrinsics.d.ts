import type { CSSProperties, ReactNode } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": {
        "pricing-table-id"?: string;
        "publishable-key"?: string;
        className?: string;
        style?: CSSProperties;
        children?: ReactNode;
      };
    }
  }
}

export {};
