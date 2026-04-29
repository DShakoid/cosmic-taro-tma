import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Настройки из Vercel Environment Variables
  const supabase = createClient(
    process.env.STORAGE_URL || '', 
    process.env.STORAGE_SERVICE_ROLE_KEY || ''
  )

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Нет данных от Telegram' });

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'Юзер не найден' });

    const user = JSON.parse(userRaw);

    // Проверяем юзера в базе
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ 
      user: existingUser || user, 
      authorized: !!existingUser 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
