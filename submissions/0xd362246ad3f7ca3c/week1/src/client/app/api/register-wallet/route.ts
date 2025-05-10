// app/api/register-wallet/route.ts
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    // Check if wallet already exists in Firebase
    const walletRef = ref(db, `${walletAddress}`);
    const snapshot = await get(walletRef);

    if (snapshot.exists()) {
      // Wallet already registered
      return NextResponse.json({ success: true, message: 'Wallet already registered' });
    }

    // Call external API to register the wallet
    const registerRes = await fetch('https://ghibli-mode.vercel.app/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REGISTER_API_TOKEN}`,
      },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json({ error: data.message || 'Registration failed' }, { status: registerRes.status });
    }

    return NextResponse.json({ success: true, message: 'Wallet registered successfully', data });
  } catch (err) {
    console.error('Register Wallet Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
