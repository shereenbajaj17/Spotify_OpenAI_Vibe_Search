'use client';

import Link from 'next/link';
import { Home, Heart, Music } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useLibraryStore } from '@/store/useLibraryStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { likedTracks } = useLibraryStore();

  return (
    <>
      <div className="bg-[#121212] rounded-lg p-6 flex flex-col gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 shadow-[0_0_15px_rgba(29,185,84,0.4)] bg-[#1DB954] rounded-full flex items-center justify-center">
            <Music className="w-4 h-4 text-black fill-black" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Vibe</span>
        </Link>

        {/* Links */}
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-4 transition-colors group">
            <Home className={`w-6 h-6 ${pathname === '/' ? 'text-[#1DB954]' : 'text-neutral-400 group-hover:text-white'}`} />
            <span className={`font-bold text-sm ${pathname === '/' ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>Home</span>
          </Link>

          <Link href="/liked" className="flex items-center gap-4 transition-colors group">
            <Heart className={`w-6 h-6 ${pathname === '/liked' ? 'fill-[#1DB954] text-[#1DB954]' : 'text-neutral-400 group-hover:text-white'}`} />
            <span className={`font-bold text-sm ${pathname === '/liked' ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
              Liked Songs
              {likedTracks.length > 0 && (
                <span className="ml-2 text-xs bg-[#1DB954] text-black px-1.5 py-0.5 rounded-full font-bold">
                  {likedTracks.length}
                </span>
              )}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
