'use client';

import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Heart, Play, Pause } from 'lucide-react';

export default function LikedSongsPage() {
  const { likedTracks, toggleLike } = useLibraryStore();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  return (
    <div className="relative h-full flex flex-col">
      {/* Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#4A1DB9] to-transparent pointer-events-none -z-10" />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 pt-16 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-end gap-6 mb-8">
          <div className="w-44 h-44 flex-shrink-0 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-md shadow-2xl flex items-center justify-center">
            <Heart className="w-20 h-20 fill-white text-white drop-shadow-lg" />
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Playlist</span>
            <h1 className="text-6xl font-extrabold text-white tracking-tight leading-none">Liked Songs</h1>
            <span className="text-sm text-white/60 font-medium mt-2">{likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Track List */}
        {likedTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Heart className="w-16 h-16 text-neutral-600" />
            <h2 className="text-xl font-bold text-white">Songs you like will appear here</h2>
            <p className="text-sm text-neutral-400 max-w-xs">Save songs by tapping the heart icon on any track.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Column Headers */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-2 text-neutral-400 text-xs uppercase tracking-widest font-bold border-b border-white/10 mb-2">
              <span className="w-6 text-center">#</span>
              <span>Title</span>
              <span className="pr-8">Artist</span>
              <span></span>
            </div>

            {likedTracks.map((track, i) => {
              const isActive = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => playTrack(track, likedTracks)}
                >
                  {/* Index / Play Icon */}
                  <div className="w-6 flex items-center justify-center">
                    {isActive && isPlaying ? (
                      <Pause className="w-4 h-4 text-[#1ed760] fill-[#1ed760]" />
                    ) : (
                      <>
                        <span className={`text-sm group-hover:hidden ${isActive ? 'text-[#1ed760]' : 'text-neutral-400'}`}>{i + 1}</span>
                        <Play className="w-4 h-4 fill-white text-white hidden group-hover:block" />
                      </>
                    )}
                  </div>

                  {/* Album Art + Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop'}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover shadow-md"
                    />
                    <span className={`font-bold text-sm truncate ${isActive ? 'text-[#1ed760]' : 'text-white'}`}>{track.title}</span>
                  </div>

                  {/* Artist */}
                  <span className="text-sm text-neutral-400 hover:underline cursor-pointer pr-4">{track.artist}</span>

                  {/* Unlike Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    className="text-[#1ed760] hover:scale-110 transition-transform p-1"
                    title="Remove from Liked Songs"
                  >
                    <Heart className="w-5 h-5 fill-[#1ed760]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
