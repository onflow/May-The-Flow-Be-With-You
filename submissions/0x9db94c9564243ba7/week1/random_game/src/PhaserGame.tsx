import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { DiceGame } from './game/components/DiceGame';
import { DiceGameScene } from './game/scenes/DiceGameScene';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);
    const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {
            console.log('Initializing Phaser game');
            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) =>
        {
            console.log('Scene ready:', {
                key: scene_instance.scene.key,
                isDiceGame: scene_instance.scene.key === 'DiceGameScene'
            });
            
            setCurrentScene(scene_instance);
            
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {
                currentActiveScene(scene_instance);
            }

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: scene_instance };
            }
        });
        
        return () =>
        {
            EventBus.removeListener('current-scene-ready');
        }
    }, [currentActiveScene, ref]);

    const isDiceGame = currentScene?.scene.key === 'DiceGameScene';
    console.log('Rendering PhaserGame:', { 
        isDiceGame,
        currentSceneKey: currentScene?.scene.key 
    });

    return (
        <div className="game-wrapper">
            <div className="game-container-wrapper">
                <div id="game-container"></div>
                {isDiceGame && currentScene && (
                    <DiceGame scene={currentScene} />
                )}
            </div>
        </div>
    );
});
