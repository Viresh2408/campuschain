import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1326',
            color: '#f1f5f9',
            border: '1px solid rgba(99,102,241,0.3)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0d1326' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0d1326' } },
        }}
      />
    </>
  );
}
