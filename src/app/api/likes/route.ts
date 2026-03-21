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

    const likes = await prisma.like.findMany({
      where: { userId: user.id },
      include: {
        track: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tracks = likes.map(like => like.track);

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId } = await req.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if already liked, then toggle
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: trackId,
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          trackId: trackId,
        }
      });
      return NextResponse.json({ liked: true });
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
