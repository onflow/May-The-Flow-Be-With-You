import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const response = await fetch('https://ghibli-mode.vercel.app/api/paint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REGISTER_API_TOKEN}`, // same token as before
      },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Paint request failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Paint Wallet Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}