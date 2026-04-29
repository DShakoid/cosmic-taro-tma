/**
 * PROFILE MODULE - COSMIC TAROT
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.STORAGE_URL, 
  process.env.STORAGE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // 1. Проверяем метод
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { initData, action } = req.body;
    if (!initData) return res.status(400).json({ error: 'No initData' });

    const urlParams = new URLSearchParams(initData);
    const userString = urlParams.get('user');
    
    // Безопасно парсим юзера
    if (!userString) return res.status(400).json({ error: 'User string is missing' });
    const user = JSON.parse(userString);

    // --- БЛОК СБРОСА ---
    if (action === 'clear_birthdate') {
      const { data, error } = await supabase
        .from('users')
        .update({ birth_date: null })
        .eq('id', user.id)
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, authorized: true, user: data[0] });
    }

    // --- БЛОК СИНХРОНИЗАЦИИ ---
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

      if (error) throw error;
      return res.status(200).json({ user: data[0], authorized: true });
    }

    // --- ПРОВЕРКА СТАТУСА (ДЛЯ ИНИЦИАЛИЗАЦИИ) ---
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // Используем maybeSingle, чтобы не было ошибки если юзера нет

    if (existingUser) {
      return res.status(200).json({ user: existingUser, authorized: true });
    }

    // Если в базе нет — возвращаем как гостя
    return res.status(200).json({ user, authorized: false });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
