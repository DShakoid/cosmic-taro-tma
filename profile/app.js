/**
 * PROFILE MODULE - COSMIC TAROT
 */
async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

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
            body: JSON.stringify({ 
                initData: tg?.initData || "" 
            }) 
        });

        // Если сервер прислал ошибку, читаем её как текст, чтобы не падать на JSON.parse
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();
        renderProfile(data);
    } catch (err) {
        console.error('Ошибка профиля:', err);
        if (container) {
            container.innerHTML = `<p style="text-align:center; color:#ff4d4d; padding-top:50px;">Ошибка: ${err.message}</p>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card" style="padding: 20px; text-align: center;">
            <h2 style="color:#d4a1f9;">${data.user?.first_name || 'Странник'}</h2>
            <p style="color:white; margin: 20px 0;">${data.authorized ? 'Профиль активирован' : 'Режим гостя'}</p>
            <div style="background:rgba(212, 161, 249, 0.1); padding:15px; border-radius:10px; color:white;">
                <small>ДАТА РОЖДЕНИЯ</small>
                <div style="font-size:20px; margin-top:5px;">${data.user?.birth_date || 'Не указана'}</div>
            </div>
            <button onclick="window.location.reload()" style="margin-top:30px; background:none; border:1px solid #d4a1f9; color:white; padding:10px 20px; border-radius:20px;">Обновить данные</button>
        </div>
    `;
}

initProfile();
