async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    // Показываем твой лоадер
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
        if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
        
        renderProfile(data);
    } catch (err) {
        console.error('Ошибка:', err);
        if (container) {
            container.innerHTML = `<p style="text-align:center; color:#ff4d4d; padding-top:50px;">${err.message}</p>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card" style="padding:20px; text-align:center; color:white;">
            <h2 style="color:#d4a1f9;">${data.user?.first_name || 'Странник'}</h2>
            <p style="margin-bottom:20px;">${data.authorized ? 'Профиль найден' : 'Режим гостя'}</p>
            <button onclick="navigate('welcome')" style="background:#d4a1f9; color:black; border:none; padding:10px 20px; border-radius:20px;">ИЗМЕНИТЬ ДАННЫЕ</button>
        </div>`;
}

initProfile();
