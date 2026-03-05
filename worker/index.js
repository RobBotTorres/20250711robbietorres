const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
        }

        const headers = { 'Content-Type': 'application/json', ...CORS_HEADERS };

        try {
            const { name, email, message, website } = await request.json();

            // Honeypot
            if (website) {
                return new Response(JSON.stringify({ success: true }), { headers });
            }

            if (!name || !email || !message) {
                return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400, headers });
            }

            // Store in D1
            await env.DB.prepare(
                'INSERT INTO submissions (name, email, message) VALUES (?, ?, ?)'
            ).bind(name, email, message).run();

            // Send email via Brevo
            try {
                const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': env.BREVO_API_KEY,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        sender: { name: 'robbietorres.info', email: 'hello@robbietorres.info' },
                        to: [{ email: 'robbieetorres@gmail.com', name: 'Robbie Torres' }],
                        replyTo: { email, name },
                        subject: `Portfolio Contact: ${name}`,
                        textContent: `From: ${name} <${email}>\n\n${message}\n\n---\nSent from robbietorres.info`,
                    }),
                });

                if (!res.ok) {
                    const err = await res.text();
                    console.error('Brevo error:', err);
                }
            } catch (emailErr) {
                console.error('Email failed (submission saved):', emailErr);
            }

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (err) {
            console.error('Contact error:', err);
            return new Response(JSON.stringify({ error: 'Failed to process' }), { status: 500, headers });
        }
    },
};
