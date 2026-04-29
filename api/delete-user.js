import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { initData } = req.body;
    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');

    if (!userRaw) return res.status(400).json({ error: 'No user data' });
    const user = JSON.parse(userRaw);

    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

        if (error) throw error;

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
