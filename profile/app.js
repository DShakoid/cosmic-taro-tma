/**
 * PROFILE MODULE - COSMIC TAROT
 */

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('profile-content');
    
    // ВОЗВРАЩАЕМ ТВОЮ АНИМАЦИЮ
    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <p class="loader-text">Считываем твою судьбу...</p>
            </div>
        `;
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
        if (container) {
            container.innerHTML = `
                <div class="error-box">
                    <p>Космос временно недоступен</p>
                    <button class="btn-reset" onclick="initProfile()">Повторить попытку</button>
                </div>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    if (data.authorized) {
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="profile-avatar" style="background-image: url('${data.user.photo_url || '../assets/default-avatar.png'}')"></div>
                    <div class="avatar-glow"></div>
                </div>
                <h2 class="profile-name">${data.user.first_name || 'Путешественник'}</h2>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-label">Дата рождения</span>
                        <span class="stat-value">${data.user.birth_date || 'Не указана'}</span>
                    </div>
                </div>
                <div class="profile-menu">
                    <button class="menu-btn" onclick="navigate('welcome')">✨ Изменить данные</button>
                    <button class="menu-btn danger-outline" onclick="resetAllData()">🌑 Сбросить данные</button>
                </div>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="profile-card">
                <p>Ваши прогнозы не сохраняются в облаке.</p>
                <button class="btn-sync" onclick="handleAuthSync()">Авторизоваться TG</button>
            </div>`;
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
        tg.showAlert('Ошибка авторизации');
    }
}

async function resetAllData() {
    const tg = window.Telegram.WebApp;
    tg.showConfirm("Сбросить дату рождения?", async (confirmed) => {
        if (confirmed) {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData, action: 'clear_birthdate' })
            });
            localStorage.removeItem('user_birth_date');
            if (window.navigate) window.navigate('welcome');
        }
    });
}

initProfile();
