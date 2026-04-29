import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { initData, birthDate } = req.body;
  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user') || '{}');

  if (!user.id) return res.status(400).json({ error: 'Нет данных пользователя' });

  // Внутри api/save-user.js добавь эти поля в upsert:
  const { error } = await supabase.from('users').upsert({ 
      id: user.id, 
      first_name: user.first_name,
      last_name: user.last_name, // Добавили
      username: user.username,
      gender: gender,            // Добавили (прилетит из welcome)
      birth_date: birthDate,
      photo_url: user.photo_url,  // Сохраняем ссылку на фото
      updated_at: new Date()
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
