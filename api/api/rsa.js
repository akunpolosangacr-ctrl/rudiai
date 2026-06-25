const ALLOWED_METHODS = "GET, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";

function fromBase64(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function importKey(base64, type) {
    const binary = fromBase64(base64);
    return await crypto.subtle.importKey(
        type === "public" ? "spki" : "pkcs8",
        binary.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        [type === "public" ? "encrypt" : "decrypt"]
    );
}

async function rsaEncrypt(text, publicKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const encryptedBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data);
    return toBase64(encryptedBuffer);
}

async function rsaDecrypt(encryptedBase64, privateKey) {
    const encryptedArray = fromBase64(encryptedBase64);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedArray.buffer);
    return new TextDecoder().decode(decryptedBuffer);
}

function setupCORS(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    response.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
}

export default async function handler(request, response) {
    setupCORS(request, response);

    if (request.method === 'OPTIONS') return response.status(204).end();

    if (request.method === 'GET') {
        if (!request.query.encrypt && !request.query.decrypt) {
            return response.status(400).json({
                ok: false, status: 400, data: null, info: null,
                error: { code: 400, message: "Missing required parameter", details: "Missing 'encrypt' or 'decrypt' parameter" },
                timestamp: new Date().toISOString()
            });
        }

        try {
            if (request.query.encrypt) {
                const publicKey = await importKey(process.env.PUBLIC_KEY, "public");
                const encryptedBase64 = await rsaEncrypt(request.query.encrypt, publicKey);
                return response.status(200).json({
                    ok: true, status: 200, data: { text: encodeURIComponent(encryptedBase64) },
                    info: { code: 200, message: "Text successfully encrypted" }, error: null, timestamp: new Date().toISOString()
                });
            }

            const privateKey = await importKey(process.env.PRIVATE_KEY, "private");
            const originalText = await rsaDecrypt(decodeURIComponent(request.query.decrypt), privateKey);
            return response.status(200).json({
                ok: true, status: 200, data: { text: originalText },
                info: { code: 200, message: "Text successfully decrypted" }, error: null, timestamp: new Date().toISOString()
            });

        } catch (error) {
            return response.status(500).json({
                ok: false, status: 500, data: null, info: null,
                error: { code: 500, message: 'Failed to process the provided text' }, timestamp: new Date().toISOString()
            });
        }
    }

    response.setHeader('Allow', ALLOWED_METHODS);
    return response.status(405).json({
        ok: false, status: 405, data: null, info: null,
        error: { code: 405, message: "Method not allowed" }, timestamp: new Date().toISOString()
    });
}
