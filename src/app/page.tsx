import { prisma } from '@/lib/prisma';
import PlayButton from '@/components/ui/PlayButton';
import LikeButton from '@/components/ui/LikeButton';
import { Track } from '@prisma/client';

export default async function Home() {
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  // Fetch actual tracks from the database
  const tracks = await prisma.track.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12
  });

  // Use the first 6 tracks as the Quick Links instead of mock data
  const quickLinks = tracks.slice(0, 6);

  return (
    <div className="relative h-full flex flex-col">
      {/* Top Header Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#224A30] to-transparent pointer-events-none -z-10" />

      {/* Main Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 pt-16 flex flex-col gap-10">
        
        {/* Greetings & Quick Links Grid */}
        <section>
          <h1 className="text-[32px] font-bold mb-6 text-white tracking-tight">{greeting}</h1>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {quickLinks.map((track: Track) => (
              <div 
                key={track.id} 
                className="bg-white/10 hover:bg-white/20 transition-colors rounded-md flex items-center group cursor-pointer overflow-hidden relative pr-4 shadow-sm h-16"
              >
                <img 
                  src={track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop'} 
                  alt={track.title} 
                  className="w-16 h-16 object-cover shadow-lg" 
                />
                <span className="font-bold text-white px-4 py-2 block truncate flex-1 text-[15px]">{track.title}</span>
                
                {/* Play Button Overlay */}
                <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-xl">
                   <PlayButton track={track} allTracks={tracks} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently played */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">Recently played</h2>
            <span className="text-sm font-bold text-spotify-light hover:underline cursor-pointer">Show all</span>
          </div>
          
          {tracks.length === 0 ? (
            <div className="text-spotify-light py-8 text-center bg-black/20 rounded-lg border border-white/5">
              No music found! Add .mp3 files to /public/audio and run the seed script.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {tracks.map((track) => (
                <div 
                  key={track.id} 
                  className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-md cursor-pointer group flex flex-col gap-4 relative"
                >
                  <div className="relative w-full aspect-square rounded-md overflow-hidden shadow-2xl bg-neutral-800">
                    <img 
                      src={track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&fit=crop'} 
                      alt={track.title} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 drop-shadow-2xl">
                       <PlayButton track={track} allTracks={tracks} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-white font-bold truncate" title={track.title}>{track.title}</span>
                      <span className="text-sm text-spotify-light line-clamp-1" title={track.artist}>{track.artist}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                      <LikeButton track={track} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
