import { create } from '@web3-storage/w3up-client';

let client: any;

export async function initializeIPFS() {
  if (!client) {
    client = await create();
    await client.login(process.env.NEXT_PUBLIC_W3UP_EMAIL);
    await client.setCurrentSpace(process.env.NEXT_PUBLIC_W3UP_SPACE);
  }
  return client;
}

export async function uploadToIPFS(file: File): Promise<string> {
  const ipfs = await initializeIPFS();
  const cid = await ipfs.uploadFile(file);
  return `https://${cid}.ipfs.w3s.link`;
}

export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], 'gift-card-image.png', { type: 'image/png' });
  return uploadToIPFS(file);
} 