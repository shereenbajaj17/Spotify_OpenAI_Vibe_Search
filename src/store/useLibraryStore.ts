import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TrackData } from './usePlayerStore';

interface Playlist {
  id: string;
  name: string;
  tracks: TrackData[];
}

interface LibraryStore {
  likedTracks: TrackData[];
  playlists: Playlist[];
  toggleLike: (track: TrackData) => void;
  isLiked: (trackId: string) => boolean;
  addToDefaultPlaylist: (track: TrackData) => void;
  isInDefaultPlaylist: (trackId: string) => boolean;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      likedTracks: [],
      playlists: [{ id: 'default', name: 'My Playlist', tracks: [] }],
      
      toggleLike: (track) => set((state) => {
        const isLiked = state.likedTracks.some(t => t.id === track.id);
        if (isLiked) {
          return { likedTracks: state.likedTracks.filter(t => t.id !== track.id) };
        } else {
          return { likedTracks: [...state.likedTracks, track] };
        }
      }),
      
      isLiked: (trackId) => get().likedTracks.some(t => t.id === trackId),
      
      addToDefaultPlaylist: (track) => set((state) => {
        const defaultPlaylist = state.playlists[0] || { id: 'default', name: 'My Playlist', tracks: [] };
        const isAlreadyIn = defaultPlaylist.tracks.some(t => t.id === track.id);
        
        let updatedPlaylists;
        if (isAlreadyIn) {
          updatedPlaylists = [
            { ...defaultPlaylist, tracks: defaultPlaylist.tracks.filter(t => t.id !== track.id) },
            ...state.playlists.slice(1)
          ];
        } else {
          updatedPlaylists = [
            { ...defaultPlaylist, tracks: [...defaultPlaylist.tracks, track] },
            ...state.playlists.slice(1)
          ];
        }
        
        return { playlists: updatedPlaylists };
      }),
      
      isInDefaultPlaylist: (trackId) => {
        const defaultPlaylist = get().playlists[0];
        return defaultPlaylist ? defaultPlaylist.tracks.some(t => t.id === trackId) : false;
      },
    }),
    {
      name: 'spotify-library-storage',
    }
  )
);
