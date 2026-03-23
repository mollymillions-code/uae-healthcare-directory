import { NextRequest, NextResponse } from 'next/server';
import { createPost, clearQueuedPost, getPostState } from '@/lib/research/postiz';

/**
 * POST /api/social/post — Create a social media post (safe gateway)
 * GET  /api/social/post?id=xxx — Check post state
 * DELETE /api/social/post?id=xxx — Delete a queued post before retrying
 */

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createPost(body);

  if (result.blocked) {
    return NextResponse.json(result, { status: 409 });
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }
  const result = await getPostState(id);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }
  const result = await clearQueuedPost(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
