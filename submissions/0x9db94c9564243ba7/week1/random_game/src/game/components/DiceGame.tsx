import React, { useEffect } from 'react';
import { useDiceQuery } from '../../lib/flow/hooks/useDiceQuery';

interface DiceGameProps {
  scene: any; // This will be your Phaser scene instance
}

export const DiceGame: React.FC<DiceGameProps> = ({ scene }) => {
  console.log('DiceGame component mounted:', {
    sceneKey: scene?.scene?.key,
    hasScoreText: !!scene?.scoreText
  });

  const { result, dice1, dice2, isLoading, error, refetch } = useDiceQuery();

  useEffect(() => {
    console.log('DiceGame Effect:', { 
      sceneKey: scene?.scene?.key,
      result, 
      dice1,
      dice2,
      isLoading, 
      error,
      hasScoreText: !!scene?.scoreText
    });
    
    if (scene && scene.scoreText) {
      console.log('Updating score text:', { result, isLoading, error });
      
      if (isLoading) {
        scene.updateScoreText('Rolling...');
      } else if (error) {
        scene.updateScoreText('Error: ' + error.message);
      } else {
        scene.updateScoreText('Total: ' + result);
        // Update the dice sprites with the actual values
        if (scene.dice1 && scene.dice2) {
          scene.dice1.setFrame(dice1 - 1); // Frame index is 0-based
          scene.dice2.setFrame(dice2 - 1);
        }
      }
    }
  }, [scene, result, dice1, dice2, isLoading, error]);

  // Listen for dice roll complete event
  useEffect(() => {
    if (scene) {
      console.log('Setting up dice roll listener');
      const onDiceRollComplete = (total: number) => {
        console.log('Dice roll complete:', total);
        refetch();
      };
      
      scene.events.on('diceRollComplete', onDiceRollComplete);
      
      return () => {
        console.log('Cleaning up dice roll listener');
        scene.events.off('diceRollComplete', onDiceRollComplete);
      };
    }
  }, [scene, refetch]);

  return null; // This component doesn't render anything directly
}; 