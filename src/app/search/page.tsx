'use client';

import { useEffect, useState, Suspense } from 'react';
import { Play, Plus, Heart, Check } from 'lucide-react';
import { usePlayerStore, TrackData } from '@/store/usePlayerStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useSearchParams } from 'next/navigation';

function VibeSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<(TrackData & { similarity: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectedMood, setDetectedMood] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'vibe' | ''>('');
  
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { toggleLike, isLiked, addToDefaultPlaylist, isInDefaultPlaylist } = useLibraryStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        
        if (data.tracks) {
          setResults(data.tracks);
          setDetectedMood(data.detectedMood || '');
          setSearchMode(data.searchMode || 'vibe');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);



  return (
    <div className="relative h-full flex flex-col p-8 pt-6 max-w-7xl mx-auto w-full">
      {/* Header Area */}
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Search</h1>
      <p className="text-neutral-400 font-medium mb-6">Search by mood, artist, or track</p>
      
      {loading ? (
        <div className="flex items-center text-neutral-400 gap-3 mt-10">
           <div className="animate-spin w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full" />
           <span>Analyzing your vibe...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="animate-in fade-in duration-500 flex flex-col pt-2">
          
          {searchMode === 'keyword' ? (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-neutral-400">Search type:</span>
              <span className="bg-blue-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                Keyword Match
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-neutral-400">Detected mood:</span>
              <span className="bg-orange-500 text-black text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {detectedMood || '...'}
              </span>
              <span className="text-xs text-neutral-500">(80% confidence)</span>
            </div>
          )}

          <h2 className="text-lg font-bold text-white mb-4">{results.length} {searchMode === 'keyword' ? 'results found' : 'tracks match your vibe'}</h2>
          
          <div className="flex flex-col gap-3">
            {results.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id} 
                  className="bg-[#181818] hover:bg-[#282828] transition-colors rounded-xl p-3 flex items-center gap-5 group border border-transparent hover:border-white/5 shadow-sm"
                >
                  {/* Number Badge with Play Swap on Hover */}
                  <div 
                    className="relative w-12 h-12 flex-shrink-0 bg-[#00A355] rounded-lg cursor-pointer flex items-center justify-center transition-transform active:scale-95 shadow-sm overflow-hidden" 
                    onClick={() => playTrack(track, results)}
                  >
                    <span className="absolute font-bold text-white text-lg transition-opacity duration-200 group-hover:opacity-0">
                      {i + 1}
                    </span>
                    <Play className="absolute w-6 h-6 fill-white text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 ml-1" />
                  </div>
                  
                  {/* Title & Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-base truncate cursor-pointer hover:underline ${isActive ? 'text-[#1ed760]' : 'text-white'}`} onClick={() => playTrack(track, results)}>
                        {track.title}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">{(track.similarity * 100).toFixed(0)}% match</span>
                    </div>
                    <span className="text-sm text-neutral-400 truncate hover:underline cursor-pointer">{track.artist}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 text-neutral-400 pr-2">
                    <button 
                      onClick={() => addToDefaultPlaylist(track)} 
                      className="hover:text-white transition-colors p-2"
                      title={isInDefaultPlaylist(track.id) ? "Remove from playlist" : "Add to playlist"}
                    >
                      {isInDefaultPlaylist(track.id) ? (
                        <Check className="w-5 h-5 text-[#1ed760]" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                    <button 
                      onClick={() => toggleLike(track)} 
                      className="hover:text-white transition-colors p-2"
                      title={isLiked(track.id) ? "Unlike" : "Like"}
                    >
                      <Heart className={`w-5 h-5 ${isLiked(track.id) ? 'fill-[#1ed760] text-[#1ed760]' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : query ? (
        <div className="mt-10 text-neutral-400">
           No tracks found matching your vibe.
        </div>
      ) : null}
    </div>
  );
}

export default function VibeSearchPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-neutral-400">Loading vibe search...</div>}>
      <VibeSearchContent />
    </Suspense>
  );
}
