import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.STORAGE_URL, 
  process.env.STORAGE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Пустые данные Telegram' });

    const urlParams = new URLSearchParams(initData);
    const userRaw = urlParams.get('user');
    if (!userRaw) return res.status(400).json({ error: 'Пользователь не найден в initData' });

    const user = JSON.parse(userRaw);

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
    console.error("Server Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
