// < ======================================================
// < Internal Proxy Fetch Function
// < ======================================================

async function proxyFetch(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return {
                ok: false, status: response.status, data: null, info: null,
                error: { code: response.status, message: response.statusText, details: `proxyFetch to ${url} was not successful` },
                timestamp: new Date().toISOString()
            };
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return {
                ok: true, status: response.status, data: await response.json(),
                info: { code: response.status, message: response.statusText, details: `Content type: ${contentType}` },
                error: null, timestamp: new Date().toISOString()
            }
        } else if (contentType.startsWith('text/plain')) {
            return {
                ok: true, status: response.status, data: { text: await response.text() },
                info: { code: response.status, message: response.statusText, details: `Content type: ${contentType}` },
                error: null, timestamp: new Date().toISOString()
            }
        } else {
            return {
                ok: false, status: 415, data: null, info: null,
                error: { code: 415, message: 'Server does not handle this content type', details: `Content type: ${contentType}` },
                timestamp: new Date().toISOString()
            }
        }
    } catch (error) {
        return {
            ok: false, status: 500, data: null, info: null,
            error: { code: 500, name: error.name, message: error.message, details: 'Unexpected error in proxyFetch' },
            timestamp: new Date().toISOString()
        }
    }
}

// > ======================================================
// > Exported Handler for the `proxy` Endpoint
// > ======================================================

export default async function handler(request, response) {
    const allowedMethods = 'GET, OPTIONS';
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', allowedMethods);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(204).end();
    }

    if (request.method === 'GET') {
        const parameterCount = Object.keys(request.query).length;

        if (parameterCount > 1) {
            return response.status(400).json({
                ok: false, status: 400, data: null, info: null,
                error: { code: 400, message: "Multiple parameters found", details: "Multiple parameters found, try encoding text" },
                timestamp: new Date().toISOString()
            });
        }

        if (request.query.link) {
            const fetchResponse = await proxyFetch(request.query.link);
            return response.status(fetchResponse.status).json(fetchResponse);
        }

        return response.status(400).json({
            ok: false, status: 400, data: null, info: null,
            error: { code: 400, message: "Missing required parameter", details: "Missing 'link' parameter" },
            timestamp: new Date().toISOString()
        });
    }

    response.setHeader('Allow', allowedMethods);
    return response.status(405).json({
        ok: false, status: 405, data: null, info: null,
        error: { code: 405, message: "Method not allowed", details: `${request.method} method not allowed` },
        timestamp: new Date().toISOString()
    });
}
