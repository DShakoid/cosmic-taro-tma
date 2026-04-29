import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.STORAGE_URL, process.env.STORAGE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'No initData' });

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'User data missing' });

    const user = JSON.parse(userRaw);

    // Используем maybeSingle, чтобы не было ошибки 500 если юзера нет в базе
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
    return res.status(500).json({ error: err.message });
  }
}

    // --- 2. СИНХРОНИЗАЦИЯ (SYNC) ---
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

      const { data: history } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return res.status(200).json({ user: data[0], history: history || [], authorized: true });
    }

    // --- 3. ОБЫЧНЫЙ ВХОД (ПРОВЕРКА) ---
    // Используем maybeSingle, чтобы не падать в catch если юзера нет
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (findError) throw findError;

    if (existingUser) {
      return res.status(200).json({ user: existingUser, history: [], authorized: true });
    }

    // Если в базе нет — просто отдаем данные из TG как гостя
    return res.status(200).json({ user, history: [], authorized: false });

  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: err.message });
  }
}
