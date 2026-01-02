import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/images/procon.logo.png" />
        <title>Performance Dashboard</title>
      </Head>

      <Component {...pageProps} />
    </>
  );
}
