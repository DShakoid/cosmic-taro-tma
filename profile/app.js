/**
 * COSMIC TAROT - PERSONAL PROFILE (SINGLE PAGE LOGIC)
 */

let currentUserData = null; // Храним данные здесь, чтобы не фетчить лишний раз

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

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
        currentUserData = data;
        renderProfile();
    } catch (err) {
        console.error('Ошибка профиля:', err);
        container.innerHTML = `<div class="profile-card"><p style="color:#ff4d4d;">Ошибка загрузки</p></div>`;
    }
}

// РЕЖИМ ПРОСМОТРА
function renderProfile() {
    const container = document.getElementById('app-body');
    if (!container || !currentUserData) return;

    const user = currentUserData.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    
    const firstName = user.first_name || tgUser.first_name || '—';
    const lastName = user.last_name || tgUser.last_name || '—';
    const username = user.username || tgUser.username || 'Странник';
    const photoUrl = user.photo_url || tgUser.photo_url || '';

    if (currentUserData.authorized) {
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
                    <button class="menu-btn" onclick="renderEditForm()">РЕДАКТИРОВАТЬ АНКЕТУ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-color: #1a1a1a;"></div>
                </div>
                <h2 class="profile-name">ГОСТЬ</h2>
                <p style="text-align: center; opacity: 0.6; font-size: 13px; margin-bottom: 20px;">
                    Данные не синхронизированы.
                </p>
                <button class="btn-sync" onclick="startSync()">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="window.history.back()">НАЗАД</button>
            </div>
        `;
    }
}

// РЕЖИМ РЕДАКТИРОВАНИЯ (АНКЕТА)
window.renderEditForm = function() {
    const container = document.getElementById('app-body');
    const user = currentUserData.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};

    container.innerHTML = `
        <div class="profile-card-authorized">
            <h2 class="profile-name">АНКЕТА</h2>
            <p style="opacity: 0.5; font-size: 12px; margin-bottom: 20px;">Заполни данные для точного прогноза</p>
            
            <div class="profile-menu" style="gap: 12px; text-align: left;">
                <div class="stat-item" style="background: rgba(255,255,255,0.05);">
                    <label class="stat-label">ИМЯ</label>
                    <input type="text" id="edit-first-name" class="stat-value" 
                           style="background:transparent; border:none; color:white; width:100%; outline:none;" 
                           value="${user.first_name || tgUser.first_name || ''}" placeholder="Твое имя">
                </div>
                
                <div class="stat-item" style="background: rgba(255,255,255,0.05);">
                    <label class="stat-label">ФАМИЛИЯ</label>
                    <input type="text" id="edit-last-name" class="stat-value" 
                           style="background:transparent; border:none; color:white; width:100%; outline:none;" 
                           value="${user.last_name || tgUser.last_name || ''}" placeholder="Твоя фамилия">
                </div>

                <div class="stat-item" style="background: rgba(255,255,255,0.05);">
                    <label class="stat-label">ПОЛ</label>
                    <select id="edit-gender" class="stat-value" 
                            style="background:transparent; border:none; color:white; width:100%; outline:none; appearance:none;">
                        <option value="" ${!user.gender ? 'selected' : ''} style="color: black;">Не указан</option>
                        <option value="Мужской" ${user.gender === 'Мужской' ? 'selected' : ''} style="color: black;">Мужской</option>
                        <option value="Женский" ${user.gender === 'Женский' ? 'selected' : ''} style="color: black;">Женский</option>
                    </select>
                </div>

                <div class="stat-item" style="background: rgba(255,255,255,0.05);">
                    <label class="stat-label">ДАТА РОЖДЕНИЯ</label>
                    <input type="date" id="edit-birth-date" class="stat-value" 
                           style="background:transparent; border:none; color:white; width:100%; outline:none; color-scheme: dark;" 
                           value="${user.birth_date || ''}">
                </div>
            </div>

            <div class="profile-menu" style="margin-top: 25px;">
                <button class="menu-btn" style="background: #d4a1f9; color: #000; font-weight: bold;" onclick="saveAuraData()">СОХРАНИТЬ</button>
                <button class="btn-reset" onclick="renderProfile()">ОТМЕНА</button>
            </div>
        </div>
    `;
};

// СОХРАНЕНИЕ
window.saveAuraData = async function() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');
    
    const payload = {
        initData: tg.initData,
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        gender: document.getElementById('edit-gender').value,
        birth_date: document.getElementById('edit-birth-date').value
    };

    container.innerHTML = `<div class="cosmic-loader"></div>`;

    try {
        const res = await fetch('/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            initProfile(); // Перезагружаем и показываем обновленную карточку
        } else {
            alert("Ошибка сохранения");
            renderProfile();
        }
    } catch (e) {
        console.error(e);
        renderProfile();
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
        alert("Ошибка синхронизации");
    }
};

initProfile();
