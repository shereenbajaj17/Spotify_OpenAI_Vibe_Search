import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      include: {
        tracks: {
          include: { track: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Playlist name required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newPlaylist = await prisma.playlist.create({
      data: {
        name,
        userId: user.id,
      },
    });

    return NextResponse.json({ playlist: newPlaylist });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
