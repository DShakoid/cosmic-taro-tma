import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { initData, first_name, last_name, gender, birth_date } = req.body;

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'No user data' });
    const user = JSON.parse(userRaw);

    try {
        const { error } = await supabase.from('users').upsert({ 
            id: user.id, 
                username: user.username || "",
                first_name: first_name || user.first_name || "", 
                last_name: last_name || user.last_name || "",
                language_code: user.language_code || "ru", // Сохраняем язык
                gender: gender || null,
                birth_date: birth_date || null,
                photo_url: user.photo_url || "",
                updated_at: new Date()
        });
        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
