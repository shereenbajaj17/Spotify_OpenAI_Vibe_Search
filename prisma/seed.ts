import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase client with service role key (has write access to storage)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = 'audio';

async function uploadToSupabase(filePath: string, filename: string): Promise<string | null> {
  const fileBuffer = fs.readFileSync(filePath);

  // Check if file already exists in bucket
  const { data: existing } = await supabase.storage.from(BUCKET).list('', {
    search: filename,
  });

  if (existing && existing.length > 0) {
    console.log(`  Already in Supabase Storage: ${filename}`);
  } else {
    const { error } = await supabase.storage.from(BUCKET).upload(filename, fileBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      console.error(`  Failed to upload ${filename}:`, error.message);
      return null;
    }
    console.log(`  Uploaded to Supabase Storage: ${filename}`);
  }

  // Return the public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

async function getSpotifyToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null;
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
    });
    const data = await response.json();
    return data.access_token || null;
  } catch (e) {
    console.warn('Failed to get Spotify token:', e);
    return null;
  }
}

async function getSpotifyAlbumArt(title: string, artist: string, token: string) {
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
    return null;
  }
}

async function main() {
  console.log('\n🎵 Vibe Search Auto-Indexer\n');

  // Verify Supabase config 
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  // Ensure pgvector extension is enabled
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
  } catch (e) { /* ignore */ }

  // Initialize Spotify API
  const spotifyToken = await getSpotifyToken();
  if (spotifyToken) {
    console.log('✅ Spotify API connected\n');

    // Backfill existing tracks with no real album art
    const existingTracks = await prisma.track.findMany({
      where: { albumArt: { contains: 'unsplash' } }
    });
    if (existingTracks.length > 0) {
      console.log(`Backfilling album art for ${existingTracks.length} tracks...`);
      for (const track of existingTracks) {
        const realArt = await getSpotifyAlbumArt(track.title, track.artist, spotifyToken);
        if (realArt) {
          await prisma.track.update({ where: { id: track.id }, data: { albumArt: realArt } });
          console.log(`  Updated: ${track.title}`);
        }
      }
    }
  }

  // Scan /public/audio for new or unindexed files
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  if (!fs.existsSync(audioDir)) {
    console.log('No /public/audio directory found. Create it and add .mp3 files.');
    return;
  }

  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
  console.log(`Found ${files.length} audio file(s) in /public/audio\n`);

  for (const filename of files) {
    const filePath = path.join(audioDir, filename);

    // 1. Upload to Supabase Storage first — get the cloud URL
    console.log(`Processing: ${filename}`);
    const cloudUrl = await uploadToSupabase(filePath, filename);
    if (!cloudUrl) {
      console.warn(`  Skipping ${filename} (upload failed)\n`);
      continue;
    }

    // 2. Update any existing record that still uses a local /audio/ path
    const localUrl = `/audio/${filename}`;
    const existingWithLocalUrl = await prisma.track.findFirst({ where: { audioUrl: localUrl } });
    if (existingWithLocalUrl) {
      await prisma.track.update({
        where: { id: existingWithLocalUrl.id },
        data: { audioUrl: cloudUrl }
      });
      console.log(`  Migrated local URL to cloud URL for: ${existingWithLocalUrl.title}\n`);
      continue;
    }

    // 3. Skip if already indexed with the cloud URL
    const existingWithCloudUrl = await prisma.track.findFirst({ where: { audioUrl: cloudUrl } });
    if (existingWithCloudUrl) {
      console.log(`  Already indexed: ${filename}\n`);
      continue;
    }

    // 4. New track — generate AI metadata
    console.log(`  New track! Generating AI metadata...`);
    let metadataStr = '{}';
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Extract music metadata from filenames. Output strictly valid JSON: {"title": "String", "artist": "String", "vibeText": "A detailed 2-sentence description of mood, instruments, and feeling."}' },
          { role: 'user', content: `Filename: "${filename}"` }
        ]
      });
      metadataStr = completion.choices[0].message.content || '{}';
    }

    let metadata = { title: filename.replace(/\.(mp3|wav)$/, ''), artist: 'Unknown', vibeText: 'A wonderful track.' };
    try {
      metadata = JSON.parse(metadataStr.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('  Failed to parse GPT response');
    }

    // 5. Fetch album art from Spotify
    let albumArtUrl = 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=300&auto=format&fit=crop';
    if (spotifyToken) {
      const realArt = await getSpotifyAlbumArt(metadata.title, metadata.artist, spotifyToken);
      if (realArt) albumArtUrl = realArt;
    }

    // 6. Create track in database with Supabase Storage URL
    const track = await prisma.track.create({
      data: {
        title: metadata.title,
        artist: metadata.artist,
        albumArt: albumArtUrl,
        audioUrl: cloudUrl, // ← Supabase Storage URL, not local path
        duration: 210,
      },
    });
    console.log(`  ✅ Created: ${track.title} by ${track.artist}`);

    // 7. Generate and store embedding
    let embeddingVector: number[] = new Array(1536).fill(0);
    if (process.env.OPENAI_API_KEY) {
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: metadata.vibeText,
      });
      embeddingVector = embeddingRes.data[0].embedding;
    }

    const vectorString = `[${embeddingVector.join(',')}]`;
    const embeddingId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "TrackEmbedding" (id, "trackId", "vibeText", embedding)
      VALUES (${embeddingId}, ${track.id}, ${metadata.vibeText}, ${vectorString}::vector);
    `;
    console.log(`  ✅ Embedding stored\n`);
  }

  console.log('🎉 Auto-Indexer complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
