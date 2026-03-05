import { EmailMessage } from 'cloudflare:email';

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

            // Send email
            try {
                const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@robbietorres.info>`;
                const rawEmail = [
                    'MIME-Version: 1.0',
                    `Message-ID: ${msgId}`,
                    `Date: ${new Date().toUTCString()}`,
                    'From: hello@robbietorres.info',
                    'To: robbieetorres@gmail.com',
                    `Reply-To: ${email}`,
                    `Subject: Portfolio Contact: ${name}`,
                    'Content-Type: text/plain; charset=utf-8',
                    '',
                    `From: ${name} <${email}>`,
                    '',
                    message,
                    '',
                    '---',
                    'Sent from robbietorres.info',
                ].join('\r\n');

                const msg = new EmailMessage(
                    'hello@robbietorres.info',
                    'robbieetorres@gmail.com',
                    rawEmail
                );
                await env.SEND_EMAIL.send(msg);
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
