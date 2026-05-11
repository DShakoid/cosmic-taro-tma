/**
 * COSMIC TAROT - PERSONAL PROFILE
 */

// Проверка, чтобы не было ошибки "already declared"
if (typeof currentUserData === 'undefined') {
    var currentUserData = null;
}

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');
    const userId = tg?.initDataUnsafe?.user?.id;

    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <div class="loader-text">СИНХРОНИЗАЦИЯ...</div>
            </div>`;
    }

    if (!userId) {
        if (container) container.innerHTML = `<div class="profile-card"><p style="color:#ff4d4d;">Ошибка: ID не найден</p></div>`;
        return;
    }

    try {
        const response = await fetch(`/api/user?userId=${userId}`);
        if (response.ok) {
            const data = await response.json();
            currentUserData = { authorized: true, user: data };
            
            // Синхронизация с глобальным объектом App для Таро
            if (window.App && window.App.user) {
                window.App.user.birthDate = data.birth_date;
            }
        } else {
            currentUserData = { authorized: false };
        }
        renderProfile();
    } catch (err) {
        console.error('Ошибка профиля:', err);
        currentUserData = { authorized: false };
        renderProfile();
    }
}

function renderProfile() {
    const container = document.getElementById('app-body');
    if (!container || !currentUserData) return;

    const user = currentUserData.user || {};
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    
    // ПРИОРИТЕТ ДЛЯ ФОТО: БД -> TG
    const photoUrl = user.photo_url || tgUser.photo_url || '';
    const username = user.username || tgUser.username || 'Странник';

    if (currentUserData.authorized) {
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" id="user-avatar" style="background-image: url('${photoUrl}'); background-size: cover; background-position: center;">
                        ${!photoUrl ? '<span style="font-size:40px; opacity:0.2;">?</span>' : ''}
                    </div>
                </div>
                
                <h2 class="profile-name">@${username}</h2>
                <div class="profile-status">ПОСВЯЩЕННЫЙ</div>

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
                    <button class="menu-btn" onclick="renderEditForm()">РЕДАКТИРОВАТЬ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ</button>
                    <button class="menu-btn danger-outline" onclick="deleteAccount()" style="border-color: #ff4d4d; color: #ff4d4d; margin-top: 10px;">УДАЛИТЬ АККАУНТ</button>
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
                <button class="btn-sync" onclick="startSync()">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="window.history.back()">НАЗАД</button>
            </div>
        `;
    }
}

window.renderEditForm = function() {
    const container = document.getElementById('app-body');
    const user = currentUserData.user || {};
    container.innerHTML = `
        <div class="profile-card-authorized">
            <h2 class="profile-name">АНКЕТА</h2>
            <div class="profile-menu" style="gap: 12px; text-align: left;">
                <div class="stat-item"><label class="stat-label">ИМЯ</label>
                <input type="text" id="edit-first-name" class="stat-value" style="background:transparent;border:none;color:white;width:100%;" value="${user.first_name || ''}"></div>
                <div class="stat-item"><label class="stat-label">ФАМИЛИЯ</label>
                <input type="text" id="edit-last-name" class="stat-value" style="background:transparent;border:none;color:white;width:100%;" value="${user.last_name || ''}"></div>
                <div class="stat-item"><label class="stat-label">ПОЛ</label>
                <select id="edit-gender" class="stat-value" style="background:transparent;border:none;color:white;width:100%;appearance:none;">
                    <option value="" ${!user.gender ? 'selected' : ''}>Не указан</option>
                    <option value="Мужской" ${user.gender === 'Мужской' ? 'selected' : ''}>Мужской</option>
                    <option value="Женский" ${user.gender === 'Женский' ? 'selected' : ''}>Женский</option>
                </select></div>
                <div class="stat-item"><label class="stat-label">РОЖДЕНИЕ</label>
                <input type="date" id="edit-birth-date" class="stat-value" style="background:transparent;border:none;color:white;width:100%;color-scheme:dark;" value="${user.birth_date || ''}"></div>
            </div>
            <div class="profile-menu" style="margin-top: 25px;">
                <button class="menu-btn" onclick="saveAuraData()">СОХРАНИТЬ</button>
                <button class="btn-reset" onclick="renderProfile()">ОТМЕНА</button>
                <button class="menu-btn danger-outline" onclick="deleteAccount()" style="border-color: #ff4d4d; color: #ff4d4d; margin-top: 10px;">УДАЛИТЬ АККАУНТ</button>
        </div>
    `;
};

window.saveAuraData = async function() {
    const tg = window.Telegram?.WebApp;
    const newDate = document.getElementById('edit-birth-date').value;
    
    const payload = {
        initData: tg.initData,
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        gender: document.getElementById('edit-gender').value,
        birth_date: newDate
    };

    // Твоя логика: обновление "мозгов" перед сохранением
    if (window.App && window.App.user) {
        window.App.user.birthDate = newDate;
    }

    const res = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Дата сохранена! Теперь она подтянется в Таро.");
        initProfile();
    } else {
        alert("Ошибка при сохранении данных.");
    }
};

window.startSync = async function() {
    const tg = window.Telegram?.WebApp;
    const res = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, syncOnly: true })
    });
    if (res.ok) initProfile();
};

window.deleteAccount = async function() {
    const tg = window.Telegram?.WebApp;
    
    if (!confirm("ВЫ УВЕРЕНЫ? Все ваши данные и история раскладов будут стерты навсегда.")) {
        return;
    }

    try {
        const res = await fetch('/api/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
        });

        if (res.ok) {
            alert("Ваша судьба стерта из наших свитков.");
            location.reload(); 
        } else {
            alert("Ошибка при удалении");
        }
    } catch (e) {
        console.error(e);
        alert("Сервер не отвечает");
    }
};

initProfile();
