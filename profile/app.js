/**
 * PROFILE MODULE - COSMIC TAROT (FRONTEND)
 */

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('profile-content');
    
    if (container) {
        container.innerHTML = '<div class="loading">Связь с космосом...</div>';
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData }) 
        });

        if (!response.ok) throw new Error('Ошибка сервера');
        const data = await response.json();
        renderProfile(data);
    } catch (err) {
        console.error('Profile init error:', err);
        if (container) container.innerHTML = '<div>Ошибка загрузки профиля</div>';
    }
}

function renderProfile(data) {
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    if (data.authorized) {
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar" style="background-image: url('${data.user.photo_url || '../assets/default-avatar.png'}')"></div>
                <h2 class="profile-name">${data.user.first_name || 'Странник'}</h2>
                <div class="profile-stats">
                    <p>Дата рождения: ${data.user.birth_date || 'Не указана'}</p>
                </div>
                <div class="profile-menu">
                    <button class="menu-btn" onclick="navigate('welcome')">Изменить данные</button>
                    <button class="menu-btn danger" onclick="resetAllData()">Сбросить историю</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="profile-card">
                <p>Вы зашли как гость. Ваши прогнозы не сохраняются.</p>
                <button class="btn-sync" onclick="handleAuthSync()">Авторизоваться через TG</button>
            </div>
        `;
    }
}

async function handleAuthSync() {
    const tg = window.Telegram.WebApp;
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData, action: 'sync' })
        });
        const data = await response.json();
        if (data.authorized) renderProfile(data);
    } catch (err) {
        alert('Ошибка синхронизации');
    }
}

async function resetAllData() {
    const tg = window.Telegram.WebApp;
    if (confirm("Удалить дату рождения?")) {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData, action: 'clear_birthdate' })
            });
            localStorage.removeItem('user_birth_date');
            if (window.navigate) window.navigate('welcome');
        } catch (err) {
            console.error('Reset error:', err);
        }
    }
}

initProfile();
