import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { initData, birthDate } = req.body;
  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user') || '{}');

  if (!user.id) return res.status(400).json({ error: 'Нет данных пользователя' });

  const { error } = await supabase.from('users').upsert({ 
    id: user.id, 
    first_name: user.first_name,
    username: user.username,
    birth_date: birthDate
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
