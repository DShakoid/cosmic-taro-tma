const tg = window.Telegram?.WebApp;

// 1. Инициализация светлячков (твой код из индекса теперь тут)
// ... (вставляешь сюда функции initFireflies, animate и т.д.) ...

// 2. Функция навигации
async function navigate(page) {
    const main = document.getElementById('app-body');
    const style = document.getElementById('page-style');

    // Загружаем контент
    const response = await fetch(`/${page}/${page}.html`);
    main.innerHTML = await response.text();

    // Загружаем стили страницы
    style.href = `/${page}/style.css`;

    // Загружаем скрипты страницы (удаляем старый, если был)
    document.getElementById('page-script')?.remove();
    const script = document.createElement('script');
    script.id = 'page-script';
    script.src = `/${page}/${page}.js`;
    document.body.appendChild(script);

    // Скроллим вверх при переходе
    window.scrollTo(0,0);
}

// Запуск при старте
if (tg) {
    tg.ready();
    tg.expand();
}
setCanvasSize();
initFireflies();
animate();

// По умолчанию открываем приветствие
navigate('welcome');
