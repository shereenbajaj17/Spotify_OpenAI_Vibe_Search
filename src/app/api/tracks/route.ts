import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Failed to fetch tracks:', error);
    return NextResponse.json([], { status: 200 });
  }
}
