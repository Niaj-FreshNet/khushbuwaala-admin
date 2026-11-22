/**
 * Steadfast courier webhook, forwarded to the backend.
 *
 * The Steadfast panel is set to https://admin.khushbuwaala.com/api/steadfast/webhook, but the
 * receiver lives in the backend (api.khushbuwaala.com/api/steadfast/webhook). Before this file
 * that admin address returned 404, so delivery/cancel updates were lost (2026-11-22).
 *
 * This route passes the request through untouched: the exact body bytes (the backend checks an
 * HMAC signature over them) and the auth headers. The backend does all checking and updating.
 * Both apps run on the same server, so it goes straight to the backend's local port.
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = process.env.STEADFAST_WEBHOOK_TARGET || 'http://127.0.0.1:7302/api/steadfast/webhook';
// Headers the backend needs; everything else (cookies, host, ...) stays behind.
const PASS_HEADERS = ['content-type', 'authorization', 'x-signature', 'user-agent'];

export async function POST(req: Request) {
  const body = await req.arrayBuffer();
  const headers = new Headers();
  for (const h of PASS_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) headers.set('x-forwarded-for', fwd);

  try {
    const res = await fetch(TARGET, { method: 'POST', headers, body, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'text/plain; charset=utf-8' },
    });
  } catch (e) {
    console.error('[steadfast webhook] could not reach the backend:', e);
    // 502 tells Steadfast the delivery failed, so it can retry
    return NextResponse.json({ success: false, message: 'Webhook receiver unavailable' }, { status: 502 });
  }
}

// A plain check that the address is alive (no data, nothing forwarded)
export async function GET() {
  return NextResponse.json({ ok: true, receiver: 'steadfast-webhook' });
}
