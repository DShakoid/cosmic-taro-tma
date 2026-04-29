import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.STORAGE_URL, 
  process.env.STORAGE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { initData, action } = req.body; 

  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user'));

  if (!user) return res.status(400).json({ error: 'No user data' });

  // Если пользователь просто зашел (гость), мы не делаем UPSERT.
  // Мы делаем UPSERT (создание/обновление) только если пришел экшен 'sync'
  if (action === 'sync') {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        language_code: user.language_code
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });

    // Тянем историю только для авторизованных
    const { data: history } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({ user: data[0], history, authorized: true });
  }

  // Если это просто запуск приложения (гость)
  return res.status(200).json({ user, history: [], authorized: false });
}


if (action === 'reset') {
    const { error } = await supabase
      .from('users')
      .update({ birth_date: null }) // Зануляем дату
      .eq('id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
}
