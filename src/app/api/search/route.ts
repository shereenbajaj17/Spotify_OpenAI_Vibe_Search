import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // --- STEP 1: Try a keyword search on title + artist first ---
    const keywordMatches = await prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // If we get decent keyword hits, return those directly (no vibe search needed)
    if (keywordMatches.length > 0) {
      const tracks = keywordMatches.map(t => ({
        ...t,
        similarity: 1.0, // Full confidence for exact matches
      }));

      return NextResponse.json({
        tracks,
        explanation: '',
        detectedMood: '',
        searchMode: 'keyword',
      });
    }

    // --- STEP 2: No keyword match — fall back to AI vibe search ---
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;
    const vectorString = `[${embedding.join(',')}]`;

    const nearestTracks = await prisma.$queryRaw`
      SELECT t.id, t.title, t.artist, t."albumArt", t."audioUrl", t.duration, te."vibeText",
             1 - (te.embedding <=> ${vectorString}::vector) as similarity
      FROM "Track" t
      JOIN "TrackEmbedding" te ON t.id = te."trackId"
      ORDER BY te.embedding <=> ${vectorString}::vector
      LIMIT 5;
    `;

    // Run mood extraction + explanation in parallel
    const topMatch = (nearestTracks as any[])[0];

    const moodTask = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a music mood analyzer. Extract the single core emotional mood keyword from the user\'s search query. Respond with ONLY one word, e.g. "Melancholic", "Energetic", "Peaceful", "Nostalgic", "Happy", "Tense", "Romantic". Capitalize the first letter.' },
        { role: 'user', content: `Search query: "${query}"` }
      ],
      max_tokens: 10,
    });

    const explanationTask = topMatch
      ? openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a concise music recommender. In 1 sentence, explain why the given track matches the user\'s mood.' },
            { role: 'user', content: `User mood: "${query}". Track: ${topMatch.title} by ${topMatch.artist}. Track description: ${topMatch.vibeText}. Why does it match?` }
          ]
        })
      : null;

    const [moodResponse, explanationResponse] = await Promise.all([moodTask, explanationTask]);

    const detectedMood = moodResponse.choices[0].message.content?.trim().replace(/[^a-zA-Z]/g, '') || '';
    const explanation = explanationResponse ? explanationResponse.choices[0].message.content || '' : '';

    return NextResponse.json({
      tracks: nearestTracks,
      explanation,
      detectedMood,
      searchMode: 'vibe',
    });

  } catch (error: any) {
    console.error('Vibe search error:', error);
    return NextResponse.json({ error: 'Failed to perform vibe search' }, { status: 500 });
  }
}
