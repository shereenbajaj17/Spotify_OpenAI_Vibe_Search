import { create } from 'zustand';

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  audioUrl: string;
  duration: number;
}

interface PlayerState {
  currentTrack: TrackData | null;
  queue: TrackData[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  
  // Actions
  playTrack: (track: TrackData, queue?: TrackData[]) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  addToQueue: (track: TrackData) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  
  playTrack: (track, queue = []) => set({ currentTrack: track, queue, isPlaying: true, progress: 0 }),
  
  playNext: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0 || !currentTrack) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      set({ currentTrack: queue[currentIndex + 1], isPlaying: true, progress: 0 });
    } else {
      // End of queue
      set({ currentTrack: null, isPlaying: false, progress: 0 });
    }
  },
  
  playPrev: () => {
    const { queue, currentTrack, progress } = get();
    if (!currentTrack) return;
    
    // If we're more than 3 seconds in, restart track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    
    if (queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      set({ currentTrack: queue[currentIndex - 1], isPlaying: true, progress: 0 });
    }
  },
  
  togglePlay: () => set((state) => ({ 
    isPlaying: state.currentTrack ? !state.isPlaying : false 
  })),
  
  setVolume: (volume) => set({ volume }),
  
  setProgress: (progress) => set({ progress }),
  
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] }))
}));
