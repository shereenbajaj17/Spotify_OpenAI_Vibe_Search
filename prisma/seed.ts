import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getSpotifyToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null;
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
    });
    const data = await response.json();
    return data.access_token || null;
  } catch (e) {
    console.warn("Failed to get Spotify token:", e);
    return null;
  }
}

async function getSpotifyAlbumArt(title: string, artist: string, token: string) {
  if (!token) return null;
  try {
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.tracks?.items?.length > 0) {
       return data.tracks.items[0].album.images[0]?.url || null;
    }
    return null;
  } catch (e) {
    console.warn(`Failed to fetch album art for ${title}:`, e);
    return null;
  }
}

async function main() {
  console.log('Scanning /public/audio for new tracks...');

  // Initialize Spotify API
  const spotifyToken = await getSpotifyToken();
  if (spotifyToken) {
    console.log("Spotify API connected! Will fetch real album cover art.");
    
    // Backfill process for existing tracks with fake Unsplash covers
    console.log('Checking for existing tracks missing real album art...');
    const existingTracks = await prisma.track.findMany({
      where: { albumArt: { contains: 'unsplash' } }
    });
    
    for (const track of existingTracks) {
      console.log(`Fetching Spotify art for existing track: ${track.title}...`);
      const realArtUrl = await getSpotifyAlbumArt(track.title, track.artist, spotifyToken);
      if (realArtUrl) {
        await prisma.track.update({
          where: { id: track.id },
          data: { albumArt: realArtUrl }
        });
        console.log(`Updated album art for: ${track.title}`);
      }
    }
    console.log('Backfill process complete.');
  } else {
    console.log("No Spotify credentials found in .env. Falling back to generic album art.");
  }

  // Ensure pgvector extension is enabled
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
  } catch (e) {
    // Ignore error if already exists or no privileges
  }

  const audioDir = path.join(process.cwd(), 'public', 'audio');
  if (!fs.existsSync(audioDir)) {
    console.log('No /public/audio directory found.');
    return;
  }

  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

  for (const filename of files) {
    const audioUrl = `/audio/${filename}`;
    
    // Check if track is already in database
    const existingTrack = await prisma.track.findFirst({
      where: { audioUrl }
    });

    if (existingTrack) {
      console.log(`Track already indexed: ${filename}`);
      continue;
    }

    console.log(`New track detected: ${filename}. Generating AI metadata...`);

    // Ask GPT-4o-mini to extract metadata and write a vibe given the filename
    let metadataStr = '';
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You extract music track metadata from filenames. Output strictly valid JSON with no markdown formatting. Format: {"title": "String", "artist": "String", "vibeText": "A detailed 2-sentence description of the mood, instruments, and feeling of this classical or instrumental piece."}' },
          { role: 'user', content: `Filename: "${filename}"` }
        ]
      });
      metadataStr = completion.choices[0].message.content || '{}';
    } else {
      console.warn('No OpenAI API Key found! Skipping metadata AI generation.');
      metadataStr = JSON.stringify({
        title: filename.replace('.mp3', ''),
        artist: 'Unknown Artist',
        vibeText: 'A generic track. Add an OpenAI key to generate descriptions.'
      });
    }

    // Parse the JSON safely
    let metadata = { title: filename.replace('.mp3', ''), artist: 'Unknown', vibeText: 'A wonderful track.' };
    try {
      // Strip out any ```json or ``` blocks just in case
      let cleanStr = metadataStr.replace(/```json/g, '').replace(/```/g, '').trim();
      metadata = JSON.parse(cleanStr);
    } catch (e) {
      console.error('Failed to parse GPT response:', metadataStr);
    }

    // Attempt to pull real artwork using extracted metadata
    let albumArtUrl = 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=300&auto=format&fit=crop';
    if (spotifyToken) {
      const realArt = await getSpotifyAlbumArt(metadata.title, metadata.artist, spotifyToken);
      if (realArt) albumArtUrl = realArt;
    }

    // 1. Create the Track
    // We arbitrarily set a default duration since we cannot easily parse it without a heavy library like music-metadata
    const track = await prisma.track.create({
      data: {
        title: metadata.title || filename.replace('.mp3', ''),
        artist: metadata.artist || 'Unknown',
        albumArt: albumArtUrl,
        audioUrl: audioUrl,
        duration: 210, // Default to 3:30 mins 
      },
    });

    console.log(`Created track: ${track.title} by ${track.artist}`);

    // 2. Generate Embedding for the vibeText
    console.log(`Generating Vibe Embedding for searching...`);
    let embeddingVector: number[] = new Array(1536).fill(0);
    
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: metadata.vibeText || 'A wonderful track.',
      });
      embeddingVector = response.data[0].embedding;
    }

    // 3. Store the embedding
    const vectorString = `[${embeddingVector.join(',')}]`;
    const embeddingId = randomUUID();
    
    await prisma.$executeRaw`
      INSERT INTO "TrackEmbedding" (id, "trackId", "vibeText", embedding)
      VALUES (${embeddingId}, ${track.id}, ${metadata.vibeText || 'Unknown'}, ${vectorString}::vector);
    `;
    console.log(`Stored embedding for: ${track.title} \n`);
  }

  console.log('Seeding and indexing complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
