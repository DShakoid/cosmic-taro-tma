async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <div class="loader-text">ЧТЕНИЕ СУДЬБЫ...</div>
            </div>`;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" }) 
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка связи');
        
        renderProfile(data);
    } catch (err) {
        console.error('Ошибка:', err);
        if (container) {
            container.innerHTML = `<div class="profile-card"><p style="color:#ff4d4d;">${err.message}</p></div>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    const user = data.user || {};
    const isAuth = data.authorized;

    container.innerHTML = `
        <div class="profile-card-authorized">
            <div class="profile-avatar-wrapper">
                <div class="avatar-glow"></div>
                <div class="profile-avatar" style="background-image: url('${user.photo_url || '../common/default-avatar.png'}')"></div>
            </div>
            
            <h2 class="profile-name">${user.username || user.first_name || 'СТРАННИК'}</h2>
            <div class="profile-status">${isAuth ? 'ПОСВЯЩЕННЫЙ' : 'ГОСТЬ'}</div>

            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-label">ИМЯ</span>
                    <span class="stat-value">${user.first_name || '—'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ФАМИЛИЯ</span>
                    <span class="stat-value">${user.last_name || '—'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ПОЛ</span>
                    <span class="stat-value">${user.gender || '—'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">РОЖДЕНИЕ</span>
                    <span class="stat-value">${user.birth_date || '—'}</span>
                </div>
            </div>

            <div class="profile-menu">
                <button class="menu-btn" onclick="navigate('welcome')">
                    ${isAuth ? 'РЕДАКТИРОВАТЬ' : 'ЗАПОЛНИТЬ ПРОФИЛЬ'}
                </button>
                <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ</button>
            </div>
        </div>
    `;
}

initProfile();
