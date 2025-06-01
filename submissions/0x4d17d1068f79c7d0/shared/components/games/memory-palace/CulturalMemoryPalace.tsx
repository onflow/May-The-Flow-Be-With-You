// Unified wrapper for Memory Palace games - now uses the refactored shared architecture
"use client";

import React from "react";
import { MemoryPalaceGameRefactored } from "./MemoryPalaceGameRefactored";

interface CulturalMemoryPalaceProps {
  culturalCategory?: string;
}

export default function CulturalMemoryPalace({
  culturalCategory = "randomness-revolution",
}: CulturalMemoryPalaceProps) {
  return <MemoryPalaceGameRefactored culturalCategory={culturalCategory} />;
}
