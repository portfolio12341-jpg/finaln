import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Alex_Brush, Pirata_One } from 'next/font/google';
import './globals.css';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { getDb } from '@/lib/db';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-cursive',
  display: 'swap',
});

const pirataOne = Pirata_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-gothic',
  display: 'swap',
});


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDb();
  return {
    title: db.seo.title || "Nency Soni | Portfolio",
    description: db.seo.description || "Portfolio of Nency Soni, Company Secretary & Law Student.",
    keywords: db.seo.keywords ? db.seo.keywords.split(',').map(k => k.trim()) : [],
    icons: {
      icon: '/ns_logo.webp',
      shortcut: '/ns_logo.webp',
      apple: '/ns_logo.webp',
    },
    openGraph: {
      title: "Nency Soni | Legal Research & Insights",
      description: "Exploring Law. Learn, Decode & Grow.",
      images: [{ url: '/ns_logo.webp', width: 1024, height: 1024, alt: 'Nency Soni Logo' }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${alexBrush.variable} ${pirataOne.variable} font-sans antialiased text-gray-100 bg-[#0b0908] min-h-screen relative selection:bg-amber-500/30 selection:text-white`}
        suppressHydrationWarning
      >
        <SmoothScroll>
          {/* Full-screen video background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: -20,
              pointerEvents: 'none',
            }}
          >
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>

          {/* Ambient black + navy blue light overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: -10,
              pointerEvents: 'none',
              background: `
                radial-gradient(ellipse 80% 60% at 50% 0%,   rgba(10, 20, 60, 0.55) 0%, transparent 70%),
                radial-gradient(ellipse 60% 50% at 0% 50%,   rgba(5, 15, 50, 0.45) 0%, transparent 65%),
                radial-gradient(ellipse 60% 50% at 100% 50%, rgba(5, 15, 50, 0.45) 0%, transparent 65%),
                radial-gradient(ellipse 100% 40% at 50% 100%, rgba(0, 0, 10, 0.65) 0%, transparent 70%),
                linear-gradient(180deg, rgba(0,0,8,0.30) 0%, rgba(0,5,25,0.18) 50%, rgba(0,0,8,0.40) 100%)
              `,
            }}
          />

          {/* Global Content Wrapper */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
