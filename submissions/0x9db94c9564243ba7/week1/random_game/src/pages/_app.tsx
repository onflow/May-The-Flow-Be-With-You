import "@/styles/globals.css";
import { CacheProvider } from '@emotion/react';
import { AppProps } from 'next/app';
import createEmotionCache from '../lib/createEmotionCache';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../theme';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: typeof clientSideEmotionCache;
}

export default function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CacheProvider value={emotionCache}>
        <Component {...pageProps} />
      </CacheProvider>
    </ThemeProvider>
  );
}
