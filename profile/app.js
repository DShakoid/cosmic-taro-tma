/**
 * Логика страницы профиля с привязкой кнопки авторизации
 */

async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    if (container) {
        container.innerHTML = `
            <div class="profile-loader-container">
                <div class="cosmic-loader"></div>
                <div class="loader-text">СИНХРОНИЗАЦИЯ...</div>
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
        console.error('Ошибка профиля:', err);
        if (container) {
            container.innerHTML = `
                <div class="profile-card">
                    <p style="color:#ff4d4d;">${err.message}</p>
                    <button class="btn-reset" onclick="location.reload()">ПОВТОРИТЬ</button>
                </div>`;
        }
    }
}

// Вынес функцию авторизации отдельно, чтобы кнопка работала
window.handleAuthAction = async function() {
    const tg = window.Telegram?.WebApp;
    
    // 1. Сначала пытаемся просто проверить авторизацию еще раз (вдруг юзер уже в базе)
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" })
        });
        const data = await res.json();

        if (data.authorized) {
            // Если сервер узнал юзера — просто перерисовываем профиль
            renderProfile(data);
        } else {
            // Если сервер реально его не знает — отправляем на регистрацию (welcome)
            if (window.navigate) {
                window.navigate('welcome');
            } else {
                window.location.href = '../welcome/index.html';
            }
        }
    } catch (e) {
        console.error("Ошибка при авторизации:", e);
        // Фолбэк — просто ведем на welcome, если API тупит
        window.navigate ? window.navigate('welcome') : window.location.href = '../welcome/index.html';
    }
};

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    if (data.authorized) {
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="avatar-glow"></div>
                    <div class="profile-avatar" style="background-image: url('${data.user?.photo_url || ''}')"></div>
                </div>
                
                <h2 class="profile-name">${data.user?.first_name || 'СТРАННИК'}</h2>
                <div class="profile-status">ПОСВЯЩЕННЫЙ</div>

                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-label">ДАТА РОЖДЕНИЯ</span>
                        <span class="stat-value">${data.user?.birth_date || 'Не указана'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">АРКАН</span>
                        <span class="stat-value">МАГ</span>
                    </div>
                </div>

                <div class="profile-menu">
                    <button class="menu-btn" onclick="navigate('welcome')">ИЗМЕНИТЬ ДАННЫЕ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ СВЯЗЬ</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="profile-card">
                <div style="font-size: 50px; margin-bottom: 20px;">🌘</div>
                <h2 class="profile-name">ВХОД В СИСТЕМУ</h2>
                <p style="text-align: center; opacity: 0.7; margin-bottom: 20px;">
                    Твой профиль еще не связан с энергией звезд. Нажми кнопку для синхронизации.
                </p>
                <button class="btn-sync" onclick="handleAuthAction()">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="navigate('home')">ВЕРНУТЬСЯ</button>
            </div>
        `;
    }
}

initProfile();
