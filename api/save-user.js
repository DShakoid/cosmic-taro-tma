import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Достаем ВСЕ данные из запроса, чтобы не было ошибок "not defined"
  const { initData, first_name, last_name, gender, birth_date, syncOnly } = req.body;

  const urlParams = new URLSearchParams(initData);
  const userRaw = urlParams.get('user');

  if (!userRaw) return res.status(400).json({ error: 'No user data' });
  const user = JSON.parse(userRaw);

  try {
    // Формируем объект для записи
    const userData = {
      id: user.id,
      username: user.username,
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      photo_url: user.photo_url || "",
      updated_at: new Date()
    };

    // Если это не просто "быстрая синхронизация", добавляем анкетные данные
    if (!syncOnly) {
      userData.gender = gender || null;
      userData.birth_date = birth_date || null;
    }

    const { error } = await supabase
      .from('users')
      .upsert(userData);

    if (error) throw error;

    return res.status(200).json({ success: true, authorized: true });
  } catch (err) {
    console.error("Database error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
