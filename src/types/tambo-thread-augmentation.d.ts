// Module augmentation for TamboThread to add 'context' property
import type { TamboThread as OriginalTamboThread } from "@tambo-ai/react";

declare module "@tambo-ai/react" {
  interface TamboThread {
    context?: {
      geminiStatus?: string;
      [key: string]: any;
    };
  }
}
