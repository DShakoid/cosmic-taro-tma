/**
 * COSMIC TAROT - PERSONAL PROFILE
 */

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    // Твой лоадер из стилей
    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <div class="loader-text">СИНХРОНИЗАЦИЯ ПРОФИЛЯ...</div>
            </div>`;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" }) 
        });

        const data = await response.json();
        renderProfile(data);
    } catch (err) {
        console.error('Ошибка профиля:', err);
        container.innerHTML = `<div class="profile-card"><p style="color:#ff4d4d;">Ошибка загрузки</p></div>`;
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    const user = data.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    
    // Если в базе пусто, берем данные напрямую из TG для предзаполнения
    const firstName = user.first_name || tgUser.first_name || '—';
    const lastName = user.last_name || tgUser.last_name || '—';
    const username = user.username || tgUser.username || 'Странник';
    const photoUrl = user.photo_url || tgUser.photo_url || '';

    if (data.authorized) {
        // ПОЛНАЯ АНКЕТА (Авторизован)
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-image: url('${photoUrl}')"></div>
                </div>
                
                <h2 class="profile-name">@${username}</h2>
                <div class="profile-status">ПОСВЯЩЕННЫЙ</div>

                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-label">ИМЯ</span>
                        <span class="stat-value">${firstName}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ФАМИЛИЯ</span>
                        <span class="stat-value">${lastName}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ПОЛ</span>
                        <span class="stat-value">${user.gender || 'Не указан'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ДАТА РОЖДЕНИЯ</span>
                        <span class="stat-value">${user.birth_date || 'Не указана'}</span>
                    </div>
                </div>

                <div class="profile-menu">
                    <button class="menu-btn" onclick="openEditProfile()">РЕДАКТИРОВАТЬ АНКЕТУ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ ДАННЫЕ</button>
                </div>
            </div>
        `;
    } else {
        // СОСТОЯНИЕ ГОСТЯ С КНОПКОЙ АВТОРИЗАЦИИ
        container.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-color: #1a1a1a;"></div>
                </div>
                <h2 class="profile-name">ГОСТЬ</h2>
                <p style="text-align: center; opacity: 0.6; font-size: 13px; margin-bottom: 20px;">
                    Твои данные не синхронизированы с базой.
                </p>
                <button class="btn-sync" onclick="startSync()">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="window.history.back()">НАЗАД</button>
            </div>
        `;
    }
}

// Функция, которая вызывается по кнопке АВТОРИЗАЦИЯ TG
window.startSync = async function() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');
    
    container.innerHTML = `<div class="cosmic-loader"></div>`;

    // Просто записываем базовую инфу из TG в базу, чтобы создать запись юзера
    try {
        const res = await fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                initData: tg.initData,
                syncOnly: true // Флаг, что мы просто логинимся
            })
        });
        
        if (res.ok) {
            initProfile(); // Перезагружаем профиль, теперь он будет "Посвященный"
        }
    } catch (e) {
        alert("Ошибка синхронизации");
        initProfile();
    }
};

// Функция перехода к редактированию (анкете)
window.openEditProfile = function() {
    // Здесь либо открываем модалку, либо ведем на страницу анкеты
    // Если у тебя анкета встроена в Welcome, тогда navigate('welcome')
    if (window.navigate) {
        window.navigate('welcome');
    } else {
        window.location.href = '../welcome/index.html';
    }
};

initProfile();
