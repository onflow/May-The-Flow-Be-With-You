// Unified wrapper for Chaos Cards games - now uses the refactored shared architecture
"use client";

import React from "react";
import { ChaosCardsGameRefactored } from "../ChaosCards/ChaosCardsGameRefactored";

interface CulturalChaosCardsProps {
  culturalCategory?: string;
}

export default function CulturalChaosCards({
  culturalCategory = "randomness-revolution",
}: CulturalChaosCardsProps) {
  return <ChaosCardsGameRefactored culturalCategory={culturalCategory} />;
}
