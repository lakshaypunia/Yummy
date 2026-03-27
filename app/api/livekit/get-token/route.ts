import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const participantName = req.nextUrl.searchParams.get('participantName');
    // displayName is the human-readable label; participantName is the unique identity (Clerk ID)
    const displayName = req.nextUrl.searchParams.get('displayName') || participantName;
    const canPublishRaw = req.nextUrl.searchParams.get('canPublish');

    if (!room) {
        return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }
    if (!participantName) {
        return NextResponse.json({ error: 'Missing "participantName" query parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json(
            { error: 'Server misconfigured: LiveKit credentials missing.' },
            { status: 500 }
        );
    }

    const canPublish = canPublishRaw === 'true';

    try {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantName,   // Unique per user (Clerk ID)
            name: displayName ?? participantName,  // Human-readable display name
        });

        at.addGrant({
            room,
            roomJoin: true,
            canPublish: canPublish,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();
        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("LiveKit token generation error:", error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate token' },
            { status: 500 }
        );
    }
}
