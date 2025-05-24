"use client";

import React, { createContext, useContext } from "react";
import useMutation from "@/hooks/useMutation";

const MutationContext = createContext(null);

export function MutationProvider({ children }) {
  const mutation = useMutation();

  return (
    <MutationContext.Provider value={mutation}>
      {children}
    </MutationContext.Provider>
  );
}

export function useMutationContext() {
  const context = useContext(MutationContext);
  if (!context) {
    throw new Error("useMutationContext must be used within a MutationProvider");
  }
  return context;
}
