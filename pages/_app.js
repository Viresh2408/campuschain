import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131313',
            color: '#ffffff',
            border: '1px solid rgba(199, 153, 255, 0.2)', // primary dim
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem',
            backdropFilter: 'blur(24px)',
          },
          success: { iconTheme: { primary: '#4af8e3', secondary: '#131313' } }, // secondary
          error: { iconTheme: { primary: '#ff6e84', secondary: '#131313' } }, // error
        }}
      />
    </>
  );
}
