// > ======================================================
// > Exported Handler for the `connect` Endpoint
// > ======================================================

export default function handler(request, response) {
    const allowedMethods = 'GET, OPTIONS';
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', allowedMethods);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(204).end();
    }

    if (request.method === 'GET') {
        return response.status(200).json({
            ok: true,
            status: 200,
            data: null,
            info: {
                code: 200,
                message: "GET request received",
                details: `GET requests to this connect endpoint are successful`,
            },
            error: null,
            timestamp: new Date().toISOString()
        });
    }

    response.setHeader('Allow', allowedMethods);
    return response.status(405).json({
        ok: false,
        status: 405,
        data: null,
        info: null,
        error: {
            code: 405,
            message: "Method not allowed",
            details: `${request.method} method not allowed`,
        },
        timestamp: new Date().toISOString()
    });
}
