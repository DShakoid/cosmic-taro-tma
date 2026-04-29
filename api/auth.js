import { createClient } from '@supabase/supabase-js'

// Проверяем наличие ключей перед инициализацией
const supabaseUrl = process.env.STORAGE_URL;
const supabaseKey = process.env.STORAGE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  if (!supabase) {
    return res.status(500).json({ error: 'Ключи базы данных не настроены в Vercel' });
  }

  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Нет данных инициализации' });

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'Данные пользователя отсутствуют' });

    const user = JSON.parse(userRaw);

    // Используем maybeSingle, чтобы избежать ошибки 406/500 если юзера нет
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (findError) throw findError;

    return res.status(200).json({ 
      user: existingUser || user, 
      authorized: !!existingUser 
    });

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
