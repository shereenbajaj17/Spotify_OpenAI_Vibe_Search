import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import BottomPlayer from '@/components/layout/BottomPlayer';
import TopBar from '@/components/layout/TopBar';
import RightSidebar from '@/components/layout/RightSidebar';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Spotify Vibe Search',
  description: 'AI-powered classical music streaming',
};

// Prevent ALL pages from being statically prerendered at build time.
// This app is fully dynamic — it reads from a live database.
export const dynamic = 'force-dynamic';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen flex flex-col overflow-hidden bg-black text-white selection:bg-spotify-green/30">
        <div className="flex h-full flex-1 overflow-hidden p-2 gap-2 pb-0">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 flex flex-col gap-2">
            <Sidebar />
          </aside>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-[#121212] rounded-lg flex flex-col relative scroll-smooth">
            <Suspense fallback={<div className="h-16 w-full" />}>
              <TopBar />
            </Suspense>
            {children}
          </main>

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
        
        {/* Persistent Bottom Player */}
        <div className="h-[90px] flex-shrink-0 w-full px-2">
          <BottomPlayer />
        </div>
      </body>
    </html>
  );
}
