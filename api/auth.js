import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.STORAGE_URL || '', 
  process.env.STORAGE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { initData, action } = req.body;
    if (!initData) return res.status(400).json({ error: 'No initData' });

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'No user in initData' });

    const user = JSON.parse(userRaw);

    // ДЕЙСТВИЕ: СИНХРОНИЗАЦИЯ
    if (action === 'sync') {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name
        }, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return res.status(200).json({ user: data[0], authorized: true });
    }

    // ОБЫЧНАЯ ПРОВЕРКА
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (findError) {
      console.error("Supabase Error:", findError);
      // Если таблица не создана, вернем просто юзера как гостя, чтобы не было 500 ошибки
      return res.status(200).json({ user, authorized: false, db_error: true });
    }

    return res.status(200).json({ 
      user: existingUser || user, 
      authorized: !!existingUser 
    });

  } catch (err) {
    console.error("Global Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
