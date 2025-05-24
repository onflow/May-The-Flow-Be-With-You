import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "chocolate-magnetic-scorpion-427.mypinata.cloud",
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { base64 } = body;

    if (!base64) {
      return NextResponse.json(
        { error: "Missing base64 image data" },
        { status: 400 }
      );
    }

    const fileName = `${uuidv4()}.png`;

    const upload = await pinata.upload.public.base64(base64).name(fileName);

    const imageCid = upload.cid;

    const imageUrl = `https://chocolate-magnetic-scorpion-427.mypinata.cloud/ipfs/${imageCid}`;

    // Upload metadata JSON
    const metadataUpload = await pinata.upload.public.json({
      name: "Mutated Doodle",
      description: "Doodles mutated by Mutation Potion",
      image: imageUrl
    });

    const metadataCid = metadataUpload.cid;
    const metadataUrl = `https://chocolate-magnetic-scorpion-427.mypinata.cloud/ipfs/${metadataCid}`;

    return new NextResponse(metadataUrl, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
