/**
 * PROFILE MODULE - COSMIC TAROT
 */

// 1. Инициализация при входе на страницу
async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('profile-content');
    
    // Показываем лоадер (тот, что мы стилизовали в CSS)
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

// 2. Отрисовка интерфейса (Гость или Авторизован)
function renderProfile(data) {
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    if (data.authorized) {
        // ЭКРАН АВТОРИЗОВАННОГО
        container.innerHTML = `
            <div class="profile-card-authorized">
                <div class="profile-avatar-wrapper">
                    <div class="profile-avatar" style="background-image: url('${data.user.photo_url || '../assets/default-avatar.png'}')"></div>
                    <div class="avatar-glow"></div>
                </div>

                <h2 class="profile-name">${data.user.first_name || 'Путешественник'}</h2>
                <p class="profile-status">Звездный странник</p>

                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-label">Дата рождения</span>
                        <span class="stat-value">${data.user.birth_date || 'Не указана'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Прогнозов</span>
                        <span class="stat-value">${data.history?.length || 0}</span>
                    </div>
                </div>

                <div class="profile-menu">
                    <button class="menu-btn" onclick="navigate('welcome')">
                        <span class="icon">✨</span> Изменить данные
                    </button>
                    <button class="menu-btn danger-outline" onclick="resetAllData()">
                        <span class="icon">🌑</span> Сбросить данные
                    </button>
                </div>
            </div>
        `;
    } else {
        // ЭКРАН ГОСТЯ
        container.innerHTML = `
            <div class="profile-card">
                <p>Ваши прогнозы не сохраняются в облаке.</p>
                <p class="hint">Авторизуйтесь, чтобы синхронизировать данные.</p>
                
                <button class="btn-sync" onclick="handleAuthSync()">Авторизоваться TG</button>
                
                <div id="user-data-display"></div>
            </div>
        `;
    }
}

// 3. Кнопка авторизации (action: 'sync')
async function handleAuthSync() {
    const tg = window.Telegram.WebApp;
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                initData: tg.initData,
                action: 'sync' 
            })
        });
        const data = await response.json();
        if (data.authorized) {
            renderProfile(data);
            tg.showAlert('Вы успешно авторизованы!');
        }
    } catch (err) {
        tg.showAlert('Ошибка авторизации');
    }
}

// 4. ФУНКЦИЯ СБРОСА
async function resetAllData() {
    const tg = window.Telegram.WebApp;
    
    tg.showConfirm("Вы действительно хотите удалить данные о дате рождения из базы?", async (confirmed) => {
        if (confirmed) {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        initData: tg.initData,
                        action: 'clear_birthdate' 
                    })
                });

                if (response.ok) {
                    localStorage.removeItem('user_birth_date');
                    tg.showAlert('Космическая пыль стерта. Введите новые данные.');
                    if (window.navigate) window.navigate('welcome');
                } else {
                    tg.showAlert('Не удалось сбросить данные');
                }
            } catch (err) {
                console.error('Reset error:', err);
                tg.showAlert('Произошла ошибка при связи с сервером');
            }
        }
    });
}

// Запуск при загрузке
initProfile();
