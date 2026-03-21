'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { Heart, MoreHorizontal } from 'lucide-react';

export default function RightSidebar() {
  const { currentTrack } = usePlayerStore();
  const { toggleLike, isLiked } = useLibraryStore();

  if (!currentTrack) {
    return (
      <aside className="w-[300px] bg-[#121212] rounded-lg hidden lg:flex flex-col p-4 items-center justify-center text-neutral-400 text-sm text-center">
        Play a track to see details here.
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-[#121212] rounded-lg hidden xl:flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center justify-between font-bold text-white mb-6 px-1">
        <span>Now Playing</span>
        <button className="text-neutral-400 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Large Album Art */}
        <div className="w-full aspect-square bg-[#282828] rounded-lg overflow-hidden shadow-lg">
          <img 
            src={currentTrack.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop'} 
            alt={currentTrack.title} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Title, Artist, and Like */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex flex-col truncate pr-4">
            <span className="text-2xl font-bold text-white hover:underline cursor-pointer truncate">
              {currentTrack.title}
            </span>
            <span className="text-neutral-400 font-medium hover:underline hover:text-white cursor-pointer truncate mt-1">
              {currentTrack.artist}
            </span>
          </div>
          <button 
            onClick={() => toggleLike(currentTrack)} 
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <Heart className={`w-6 h-6 ${isLiked(currentTrack.id) ? 'fill-[#1ed760] text-[#1ed760]' : ''}`} />
          </button>
        </div>

        {/* About the artist mock section */}
        <div className="mt-6 bg-[#242424] rounded-lg p-4 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img 
            src={currentTrack.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop'} 
            alt="Artist background" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="relative z-20 h-32 flex flex-col justify-between">
            <span className="font-bold text-white text-sm tracking-wide">About the artist</span>
            <div>
              <span className="font-bold text-white text-lg block">{currentTrack.artist}</span>
              <span className="text-sm text-neutral-300">105,432,100 monthly listeners</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
