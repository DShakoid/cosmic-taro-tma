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
        // ЭКРАН АВТОРИЗОВАННОГО
        container.innerHTML = `
            <div class="user-info">
                <p class="status-online">✨ В сети Космоса</p>
                <h3>${data.user.first_name || 'Путешественник'}</h3>
                <div class="data-row">
                    <span>Дата рождения:</span>
                    <strong>${data.user.birth_date || 'Не установлена'}</strong>
                </div>
                <div class="profile-actions">
                    <button class="btn-secondary" onclick="navigate('welcome')">Изменить дату</button>
                    <button class="btn-danger" onclick="resetAllData()">Сбросить данные</button>
                </div>
            </div>
        `;
    } else {
        // ЭКРАН ГОСТЯ
        container.innerHTML = `
            <div class="guest-info">
                <p>Ваши данные сейчас хранятся только локально.</p>
                <p class="hint">Авторизуйтесь, чтобы синхронизировать прогнозы между устройствами.</p>
                <button class="btn-primary" onclick="handleAuthSync()">Авторизоваться</button>
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
