export async function onRequestPost(context) {
    const { request, env } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    try {
        const { name, email, message, website } = await request.json();

        // Honeypot check
        if (website) {
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'All fields required' }), {
                status: 400,
                headers,
            });
        }

        // Store in D1
        await env.DB.prepare(
            'INSERT INTO submissions (name, email, message) VALUES (?, ?, ?)'
        ).bind(name, email, message).run();

        // Try email via Cloudflare Email Workers
        if (env.SEND_EMAIL) {
            try {
                const { EmailMessage } = await import('cloudflare:email');
                const rawEmail = [
                    'MIME-Version: 1.0',
                    'From: contact@robbietorres.info',
                    'To: robbieetorres@gmail.com',
                    `Reply-To: ${email}`,
                    `Subject: Portfolio Contact: ${name}`,
                    'Content-Type: text/plain; charset=utf-8',
                    '',
                    `Name: ${name}`,
                    `Email: ${email}`,
                    '',
                    message,
                    '',
                    '---',
                    'Sent from robbietorres.info contact form',
                ].join('\r\n');

                const msg = new EmailMessage(
                    'contact@robbietorres.info',
                    'robbieetorres@gmail.com',
                    rawEmail
                );
                await env.SEND_EMAIL.send(msg);
            } catch (emailErr) {
                console.error('Email send failed (submission still saved):', emailErr);
            }
        }

        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (err) {
        console.error('Contact form error:', err);
        return new Response(JSON.stringify({ error: 'Failed to process' }), {
            status: 500,
            headers,
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
