import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "../context/Firebase";
import Navbar from "@/components/ui/Navbar";
// import SOSGuard from "@/components/SOSGuard";
import CheckSOSActive from "@/components/CheckSOSActive";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CampusNaksha - Smart Campus Companion for IITR",
  description: "Your all-in-one smart campus companion for IITR. Navigate campus with interactive maps, get SOS assistance, check parking availability, and monitor garbage containers in real-time.",
  keywords: "campus map, IITR, IIT Roorkee, parking, SOS, emergency, navigation, smart campus, garbage monitoring",
  authors: [{ name: "CampusNaksha Team" }],
  creator: "CampusNaksha Team",
  publisher: "CampusNaksha",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://campusnaksha.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CampusNaksha - Smart Campus Companion',
    description: 'Navigate IITR campus with interactive maps, emergency assistance, and real-time facilities monitoring.',
    url: '/',
    siteName: 'CampusNaksha',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'CampusNaksha Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusNaksha - Smart Campus Companion',
    description: 'Navigate IITR campus with interactive maps, emergency assistance, and real-time facilities monitoring.',
    images: ['/android-chrome-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  verification: {
    google: 'your-google-verification-code-here',
  },
  category: 'education',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content="CampusNaksha" />
        <meta name="application-name" content="CampusNaksha" />
        <meta name="msapplication-tooltip" content="Smart Campus Companion" />
        <meta name="msapplication-starturl" content="/dashboard" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" />
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseProvider>
          <Navbar />
          <CheckSOSActive />
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}
