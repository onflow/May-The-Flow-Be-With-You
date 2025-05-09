import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { FlowProvider } from './lib/flow/FlowProvider';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        // Scene change handler if needed
    }

    return (
        <div className="app-container">
            <FlowProvider>
                <div id="app">
                    <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                </div>
            </FlowProvider>
        </div>
    );
}

export default App
