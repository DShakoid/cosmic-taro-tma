// Функция, которая вызывается при входе в профиль
async function initProfile() {
    const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
    
    // Сначала пробуем получить данные без 'sync', просто проверить статус
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: window.Telegram.WebApp.initData }) 
    });
    const data = await response.json();

    renderProfile(data);
}

function renderProfile(data) {
    const container = document.getElementById('profile-content');
    
    if (data.authorized) {
        // Экран авторизованного пользователя
        container.innerHTML = `
            <div class="user-info">
                <p>Привет, ${data.user.first_name}!</p>
                <p>Твоя дата рождения: ${data.user.birth_date || 'Не установлена'}</p>
                <button onclick="updateBirthDate()">Изменить дату</button>
                <button class="danger" onclick="resetAllData()">Сбросить всё (выйти)</button>
            </div>
        `;
    } else {
        // Экран гостя
        container.innerHTML = `
            <div class="guest-info">
                <p>Авторизуйтесь, чтобы сохранять свои прогнозы и данные</p>
                <button onclick="handleAuthSync()">Авторизоваться</button>
            </div>
        `;
    }
}

// Та самая кнопка авторизации
async function handleAuthSync() {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            initData: window.Telegram.WebApp.initData,
            action: 'sync' 
        })
    });
    const data = await response.json();
    if (data.authorized) {
        renderProfile(data);
    }
}
