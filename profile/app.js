/**
 * COSMIC TAROT - PERSONAL PROFILE
 */

let currentUserData = null;

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');
    const userId = tg?.initDataUnsafe?.user?.id;

    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <div class="loader-text">ЗАГРУЗКА ЗВЕЗД...</div>
            </div>`;
    }

    if (!userId) {
        container.innerHTML = `<div class="profile-card"><p style="color:#ff4d4d;">Ошибка: ID пользователя не найден в Telegram</p></div>`;
        return;
    }

    try {
        // Теперь идем в api/user.js (который для чтения)
        const response = await fetch(`/api/user?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
            // Если юзер еще не в базе, считаем его неавторизованным
            currentUserData = { authorized: false };
        } else {
            currentUserData = { authorized: true, user: data };
        }
        
        renderProfile();
    } catch (err) {
        console.error('Ошибка профиля:', err);
        container.innerHTML = `
            <div class="profile-card">
                <p style="color:#ff4d4d;">Ошибка связи с сервером</p>
                <button class="menu-btn" onclick="initProfile()">ПОВТОРИТЬ</button>
            </div>`;
    }
}

function renderProfile() {
    const container = document.getElementById('app-body');
    if (!container || !currentUserData) return;

    const user = currentUserData.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    
    // ПРИОРИТЕТ ДЛЯ ФОТО: 
    // 1. Ссылка из нашей БД
    // 2. Ссылка напрямую из API Telegram
    // 3. Пустая строка (заглушка)
    const photoUrl = user.photo_url || tgUser.photo_url || '';

    const firstName = user.first_name || tgUser.first_name || '—';
    const lastName = user.last_name || tgUser.last_name || '—';
    const username = user.username || tgUser.username || 'Странник';

    if (currentUserData.authorized) {
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-image: url('${photoUrl}'); background-size: cover; background-position: center;">
                        ${!photoUrl ? '<span style="font-size:40px; opacity:0.2;">?</span>' : ''}
                    </div>
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
                        <span class="stat-label">РОЖДЕНИЕ</span>
                        <span class="stat-value">${user.birth_date || 'Не указана'}</span>
                    </div>
                </div>

                <div class="profile-menu">
                    <button class="menu-btn" onclick="renderEditForm()">РЕДАКТИРОВАТЬ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ</button>
                </div>
            </div>
        `;
    } else {
        // Если юзера нет в базе — показываем кнопку авторизации
        container.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-color: #1a1a1a;"></div>
                </div>
                <h2 class="profile-name">ГОСТЬ</h2>
                <p style="text-align: center; opacity: 0.6; font-size: 13px; margin-bottom: 20px;">
                    Твой профиль еще не синхронизирован.
                </p>
                <button class="btn-sync" onclick="startSync()">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="window.history.back()">НАЗАД</button>
            </div>
        `;
    }
}

// Форма редактирования остается без изменений, но проверь вызов сохранения
window.renderEditForm = function() {
    const container = document.getElementById('app-body');
    const user = currentUserData.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};

    container.innerHTML = `
        <div class="profile-card-authorized">
            <h2 class="profile-name">АНКЕТА</h2>
            <div class="profile-menu" style="gap: 12px; text-align: left;">
                <div class="stat-item">
                    <label class="stat-label">ИМЯ</label>
                    <input type="text" id="edit-first-name" class="stat-value" style="background:transparent; border:none; color:white; width:100%;" value="${user.first_name || tgUser.first_name || ''}">
                </div>
                <div class="stat-item">
                    <label class="stat-label">ФАМИЛИЯ</label>
                    <input type="text" id="edit-last-name" class="stat-value" style="background:transparent; border:none; color:white; width:100%;" value="${user.last_name || tgUser.last_name || ''}">
                </div>
                <div class="stat-item">
                    <label class="stat-label">ПОЛ</label>
                    <select id="edit-gender" class="stat-value" style="background:transparent; border:none; color:white; width:100%; appearance:none;">
                        <option value="" ${!user.gender ? 'selected' : ''}>Не указан</option>
                        <option value="Мужской" ${user.gender === 'Мужской' ? 'selected' : ''}>Мужской</option>
                        <option value="Женский" ${user.gender === 'Женский' ? 'selected' : ''}>Женский</option>
                    </select>
                </div>
                <div class="stat-item">
                    <label class="stat-label">ДАТА РОЖДЕНИЯ</label>
                    <input type="date" id="edit-birth-date" class="stat-value" style="background:transparent; border:none; color:white; width:100%; color-scheme: dark;" value="${user.birth_date || ''}">
                </div>
            </div>
            <div class="profile-menu" style="margin-top: 25px;">
                <button class="menu-btn" style="background: #d4a1f9; color: #000;" onclick="saveAuraData()">СОХРАНИТЬ</button>
                <button class="btn-reset" onclick="renderProfile()">ОТМЕНА</button>
            </div>
        </div>
    `;
};

window.saveAuraData = async function() {
    const tg = window.Telegram?.WebApp;
    const payload = {
        initData: tg.initData,
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        gender: document.getElementById('edit-gender').value,
        birth_date: document.getElementById('edit-birth-date').value
    };

    try {
        const res = await fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            initProfile(); 
        }
    } catch (e) {
        alert("Ошибка записи");
    }
};

window.startSync = async function() {
    const tg = window.Telegram?.WebApp;
    try {
        const res = await fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData, syncOnly: true })
        });
        if (res.ok) initProfile();
    } catch (e) {
        console.error(e);
    }
};

initProfile();
