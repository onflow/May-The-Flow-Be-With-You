// Legacy wrapper for CulturalChaosCards - now uses the refactored ChaosCardsGame
"use client";

import React from "react";
import { ChaosCardsGame } from "../ChaosCards/ChaosCardsGame";

interface CulturalChaosCardsProps {
  culturalCategory?: string;
}

export default function CulturalChaosCards({
  culturalCategory = "randomness-revolution",
}: CulturalChaosCardsProps) {
  return <ChaosCardsGame culturalCategory={culturalCategory} />;
}
