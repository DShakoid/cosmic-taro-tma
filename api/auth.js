import { createClient } from '@supabase/supabase-js'

// Инициализация клиента Supabase (Vercel сам подставит переменные)
const supabase = createClient(
  process.env.STORAGE_URL, 
  process.env.STORAGE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { initData } = req.body; // Получаем данные от фронтенда

  // Тут в будущем добавим проверку подписи Telegram (для безопасности)
  // А пока просто парсим данные пользователя
  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user'));

  if (!user) return res.status(400).json({ error: 'No user data' });

  // 1. Пробуем найти пользователя или создать его (UPSERT)
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      language_code: user.language_code
    })
    .select()

  if (error) return res.status(500).json({ error: error.message });

  // 2. Возвращаем данные пользователя и, например, историю его последних раскладов
  const { data: history } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return res.status(200).json({ user: data[0], history });
}
