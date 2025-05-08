import React from "react";
import { FlowProvider as KitFlowProvider } from "@onflow/kit";
import { useFlowConfiguration } from "./config";

interface FlowProviderProps {
  children: React.ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  const config = useFlowConfiguration();
  
  return (
    <KitFlowProvider config={config}>
      {children}
    </KitFlowProvider>
  );
} 