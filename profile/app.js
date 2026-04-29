async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    // ТВОЙ ЛОАДЕР
    if (container) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh;">
                <div class="cosmic-loader"></div>
                <p style="margin-top:20px; color:#d4a1f9; letter-spacing:2px; font-size:14px;">СЧИТЫВАЕМ ТВОЮ СУДЬБУ...</p>
            </div>`;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" }) 
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        renderProfile(data);
    } catch (err) {
        console.error('Profile Init Error:', err);
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; color:#ff4d4d; padding-top:50px;">
                    <p>Космос временно недоступен</p>
                    <p style="font-size:12px; color:gray;">${err.message}</p>
                    <button onclick="initProfile()" style="margin-top:20px; background:none; border:1px solid #d4a1f9; color:white; padding:10px 20px; border-radius:20px;">Повторить попытку</button>
                </div>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card" style="padding:20px; text-align:center; color:white;">
            <h2 style="color:#d4a1f9;">${data.user?.first_name || 'Странник'}</h2>
            <p style="margin:15px 0;">${data.authorized ? 'Профиль синхронизирован' : 'Режим гостя'}</p>
            <div style="background:rgba(212,161,249,0.1); padding:15px; border-radius:10px;">
                <small style="color:#d4a1f9;">ДАТА РОЖДЕНИЯ</small>
                <div style="font-size:20px; margin-top:5px;">${data.user?.birth_date || 'Не указана'}</div>
            </div>
            <button onclick="navigate('welcome')" style="margin-top:30px; width:100%; background:#d4a1f9; color:black; border:none; padding:15px; border-radius:15px; font-weight:bold;">ИЗМЕНИТЬ ДАННЫЕ</button>
        </div>`;
}

initProfile();
