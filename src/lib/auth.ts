interface TokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
  // roles are optional since backend might not include them yet
  roles?: string[];
  // role is optional for admin tokens
  role?: string;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    // console.log('🔍 Decoding token...');

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as TokenPayload;

    // console.log('✅ Token successfully decoded.');
    // console.log('====================Full payload:======================');
    // console.log(JSON.stringify(payload, null, 2));
    // console.log('==========================================');

    // Add expiration check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('❌ Token decoding failed:', error);
    return null;
  }
}
