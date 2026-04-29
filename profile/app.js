/**
 * PROFILE MODULE - FRONTEND
 */
async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    // Твоя анимация загрузки
    if (container) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh;">
                <div class="cosmic-loader"></div>
                <p style="margin-top:20px; color:#d4a1f9; letter-spacing:2px; font-size:14px;">СЧИТЫВАЕМ ТВОЮ СУДЬБУ...</p>
            </div>`;
    }

    try {
        // Запрашиваем данные у нашего бэкенда (Vercel Function)
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" }) 
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка сервера');

        renderProfile(data);
    } catch (err) {
        console.error('Profile Error:', err);
        if (container) {
            container.innerHTML = `<p style="text-align:center; color:#ff4d4d; padding-top:50px;">Космос недоступен: ${err.message}</p>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card" style="padding: 20px; text-align: center; color: white;">
            <div class="profile-avatar" style="width:80px; height:80px; background:#222; border-radius:50%; margin: 0 auto 15px; border: 2px solid #d4a1f9;"></div>
            <h2>${data.user.first_name || 'Странник'}</h2>
            <p style="color: #aaa; margin-bottom: 20px;">${data.authorized ? 'Синхронизировано с небом' : 'Гостевой доступ'}</p>
            
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #d4a1f9;">ДАТА РОЖДЕНИЯ</p>
                <p style="font-size: 18px;">${data.user.birth_date || 'Не указана'}</p>
            </div>

            <button onclick="navigate('welcome')" style="background:#d4a1f9; color:black; border:none; padding:12px 25px; border-radius:25px; font-weight:bold; width: 100%;">
                ИЗМЕНИТЬ ДАННЫЕ
            </button>
        </div>
    `;
}

initProfile();
