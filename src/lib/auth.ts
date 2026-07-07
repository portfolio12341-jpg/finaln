const JWT_SECRET = process.env.JWT_SECRET || 'nency-soni-secure-secret-key-change-in-production';
const SECRET_KEY_BYTES = new TextEncoder().encode(JWT_SECRET);

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    SECRET_KEY_BYTES,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(payload: Record<string, any>, expiresInHours = 24): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60;
  const fullPayload = { ...payload, exp };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const tokenString = `${headerB64}.${payloadB64}`;
  const key = await getSigningKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(tokenString)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureB64 = btoa(String.fromCharCode.apply(null, signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${tokenString}.${signatureB64}`;
}

export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const tokenString = `${headerB64}.${payloadB64}`;
    
    // Verify signature
    const key = await getSigningKey();
    const encoder = new TextEncoder();
    
    // Decode signature
    const signatureStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const signatureArray = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signatureArray[i] = signatureStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      encoder.encode(tokenString)
    );

    if (!isValid) return null;

    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}
