async function initProfile() {
    const tg = window.Telegram?.WebApp;
    const container = document.getElementById('app-body');

    if (container) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh;">
                <div class="cosmic-loader"></div>
                <p style="margin-top:20px; color:#d4a1f9; letter-spacing:2px; font-size:12px;">СВЯЗЬ СО ЗВЕЗДАМИ...</p>
            </div>`;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg?.initData || "" }) 
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
        
        renderProfile(data);
    } catch (err) {
        renderError(err.message);
    }
}

function renderProfile(data) {
    const container = document.getElementById('app-body');
    if (!container) return;

    if (data.authorized) {
        // Если пользователь уже есть в базе Supabase
        container.innerHTML = `
            <div class="profile-card" style="padding:20px; text-align:center; color:white; animation: fadeIn 0.5s;">
                <div style="font-size:40px; margin-bottom:10px;">✨</div>
                <h2 style="color:#d4a1f9; margin:0;">${data.user?.first_name}</h2>
                <p style="font-size:12px; color:rgba(255,255,255,0.5);">ТВОЯ КАРТА СУДЬБЫ АКТИВНА</p>
                <div style="background:rgba(212,161,249,0.1); padding:15px; border-radius:15px; margin:20px 0;">
                    <small style="color:#d4a1f9;">ДАТА РОЖДЕНИЯ</small>
                    <div style="font-size:18px;">${data.user?.birth_date || 'Не указана'}</div>
                </div>
                <button onclick="navigate('welcome')" style="width:100%; background:none; border:1px solid #d4a1f9; color:white; padding:12px; border-radius:12px;">ИЗМЕНИТЬ ДАННЫЕ</button>
            </div>`;
    } else {
        // Если пользователя нет в базе — показываем кнопку авторизации
        container.innerHTML = `
            <div style="padding:30px; text-align:center; color:white;">
                <div style="font-size:50px; margin-bottom:20px;">👤</div>
                <h2 style="margin-bottom:10px;">ВХОД В СИСТЕМУ</h2>
                <p style="font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:30px;">
                    Чтобы сохранить свои прогнозы и настроить натальную карту, подтверди свою личность.
                </p>
                
                <button onclick="handleTgAuth()" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    background: #54a9eb;
                    color: white;
                    border: none;
                    padding: 15px;
                    border-radius: 15px;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(84, 169, 235, 0.3);
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right:10px;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.37-.48 1.01-.74 3.94-1.72 6.57-2.85 7.89-3.4 3.76-1.56 4.54-1.83 5.05-1.84.11 0 .36.03.52.16.13.1.17.24.19.34.02.07.02.21.01.29z"/>
                    </svg>
                    АВТОРИЗАЦИЯ ЧЕРЕЗ TG
                </button>
                
                <p style="font-size:10px; color:gray; margin-top:20px; text-transform:uppercase; letter-spacing:1px;">
                    Нажимая кнопку, ты синхронизируешь свой профиль с базой Cosmic Tarot
                </p>
            </div>`;
    }
}

function handleTgAuth() {
    // В Mini App мы просто перенаправляем на ввод данных
    // Так как данные из initData уже ушли на сервер, эта кнопка
    // просто создает понятный пользователю процесс регистрации.
    navigate('welcome');
}

function renderError(msg) {
    const container = document.getElementById('app-body');
    if (container) {
        container.innerHTML = `<p style="color:#ff4d4d; text-align:center; padding-top:50px;">${msg}</p>`;
    }
}

initProfile();
