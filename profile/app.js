async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    // Используем твои классы лоадера
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
        console.error('Ошибка:', err);
        if (container) {
            container.innerHTML = `
                <div class="profile-card">
                    <p style="color:#ff4d4d;">${err.message}</p>
                    <button class="btn-reset" onclick="location.reload()">ПОВТОРИТЬ</button>
                </div>`;
        }
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    if (data.authorized) {
        // Используем твою сетку параметров и карточку из CSS
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
                        <span class="stat-value">В процессе</span>
                    </div>
                </div>

                <div class="profile-menu">
                    <button class="menu-btn" onclick="navigate('welcome')">ИЗМЕНИТЬ ДАННЫЕ</button>
                    <button class="menu-btn danger-outline" onclick="location.reload()">ОБНОВИТЬ СВЯЗЬ</button>
                </div>
            </div>
        `;
    } else {
        // Используем твою брендовую кнопку синхронизации
        container.innerHTML = `
            <div class="profile-card">
                <div style="font-size: 50px; margin-bottom: 20px;">🌘</div>
                <h2 class="profile-name">ВХОД В СИСТЕМУ</h2>
                <p style="text-align: center; opacity: 0.7; margin-bottom: 20px;">
                    Твой профиль еще не связан с энергией звезд.
                </p>
                <button class="btn-sync" onclick="navigate('welcome')">АВТОРИЗАЦИЯ TG</button>
                <button class="btn-reset" onclick="navigate('home')">ВЕРНУТЬСЯ</button>
            </div>
        `;
    }
}

initProfile();
