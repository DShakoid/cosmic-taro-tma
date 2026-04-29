/**
 * PROFILE MODULE - COSMIC TAROT
 */

// 1. Инициализация при входе на страницу
async function initProfile() {
    const tg = window.Telegram?.WebApp;
    
    // Показываем лоадер, пока ждем ответ от базы
    const container = document.getElementById('profile-content');
    if (container) container.innerHTML = '<div class="loading">Связь с космосом...</div>';

    try {
        // Проверяем статус: залогинен юзер в БД или он просто гость
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData }) 
        });
        const data = await response.json();

        renderProfile(data);
    } catch (err) {
        console.error('Profile init error:', err);
    }
}

// 2. Отрисовка интерфейса (Гость или Авторизован)
function renderProfile(data) {
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    if (data.authorized) {
        // ЭКРАН АВТОРИЗОВАННОГО (Красивая карточка)
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
                        <span class="icon">🌑</span> Сбросить историю
                    </button>
                </div>
            </div>
        `;
    } else {
        // ЭКРАН ГОСТЯ (Кнопка входа)
        container.innerHTML = `
            <div class="profile-card">
                <p>Ваши прогнозы не сохраняются в облаке.</p>
                <p class="hint">Авторизуйтесь, чтобы синхронизировать данные.</p>
                
                <button class="btn-sync" onclick="handleAuthSync()">Авторизоваться TG</button>
                
                <div id="user-data-display">
                    </div>
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

// 4. ТА САМАЯ ФУНКЦИЯ СБРОСА (чтобы убрать тестовую дату)
async function resetAllData() {
    const tg = window.Telegram.WebApp;
    
    tg.showConfirm("Вы действительно хотите удалить данные о дате рождения из базы?", async (confirmed) => {
        if (confirmed) {
            try {
                // Шлем запрос на сброс (нужно добавить обработку clear_birthdate в /api/auth.js)
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        initData: tg.initData,
                        action: 'clear_birthdate' 
                    })
                });

                if (response.ok) {
                    // Чистим локальные следы
                    localStorage.removeItem('user_birth_date');
                    tg.showAlert('Космическая пыль стерта. Введите новые данные.');
                    // Уходим на welcome, чтобы ввести новую дату
                    if (window.navigate) window.navigate('welcome');
                }
            } catch (err) {
                console.error('Reset error:', err);
            }
        }
    });
}

// Запускаем всё
initProfile();
