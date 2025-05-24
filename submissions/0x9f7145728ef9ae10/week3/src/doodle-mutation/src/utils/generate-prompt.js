'use client';

export async function generatePrompt() {
  const res = await fetch('/api/generate-random', { method: 'GET' });

  if (!res.ok) throw new Error('Failed to fetch prompt');

  const potion = await res.text();

  const prompt = `Strictly retain the art style, color, and character design. Add a ${potion} costume to the character. Change an environment background to match the character costume.`;

  return prompt;
}
