import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { FlowProvider } from './lib/flow/FlowProvider';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import AppLayout from './components/AppLayout';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        // Scene change handler if needed
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <FlowProvider>
                <AppLayout>
                    <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                </AppLayout>
            </FlowProvider>
        </ThemeProvider>
    );
}

export default App
