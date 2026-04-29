/**
 * COSMIC TAROT - CORE ENGINE
 */

const tg = window.Telegram?.WebApp;

// --- 1. Инициализация Telegram WebApp ---
if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#050508');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#050508');
}

// --- 2. Управление навигацией ---
// pushState = true означает, что мы записываем переход в историю (для ссылок)
async function navigate(page, pushState = true) {
    const mainContent = document.getElementById('app-body');
    const pageStyle = document.getElementById('page-style');
    const headerBackBtn = document.getElementById('header-back-btn'); 
    
    try {
        // Управление видимостью кнопок Назад
        const isHome = (page === 'welcome' || page === 'index');
        
        if (headerBackBtn) {
            headerBackBtn.style.display = isHome ? 'none' : 'flex';
        }

        // Системная кнопка Telegram (в самом верху экрана)
        if (tg) {
            if (!isHome) {
                tg.BackButton.show();
                tg.BackButton.onClick(() => window.history.back());
            } else {
                tg.BackButton.hide();
            }
        }

        // Загружаем HTML контент страницы
        const response = await fetch(`/${page}/${page}.html`);
        if (!response.ok) throw new Error('Ошибка загрузки страницы');
        const html = await response.text();
        
        mainContent.innerHTML = html;

        // Подгружаем стили страницы
        pageStyle.href = `/${page}/style.css`;

        // Перезагружаем JS модуль страницы
        const oldScript = document.getElementById('page-script');
        if (oldScript) oldScript.remove();

        const newScript = document.createElement('script');
        newScript.id = 'page-script';
        newScript.src = `/${page}/app.js`;
        newScript.type = 'text/javascript';
        document.body.appendChild(newScript);

        // ОБНОВЛЯЕМ URL (чтобы работали прямые ссылки)
        if (pushState) {
            const url = new URL(window.location);
            url.searchParams.set('page', page);
            window.history.pushState({ page }, '', url);
        }

        window.scrollTo(0, 0);

    } catch (err) {
        console.error('Navigation error:', err);
        mainContent.innerHTML = `<div style="padding:20px; text-align:center;">Ошибка загрузки раздела ${page}</div>`;
    }
}

// --- 3. Обработка кликов и истории ---
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) {
        // Кнопка в шапке теперь просто эмулирует нажатие "Назад" в браузере
        backBtn.onclick = () => window.history.back();
    }

    // Слушаем кнопку "Назад" на телефоне/в браузере
    window.onpopstate = (event) => {
        const page = event.state?.page || 'welcome';
        navigate(page, false); // false, чтобы не перезаписывать историю при возврате
    };

    // СТАРТОВАЯ ЛОГИКА: Читаем страницу из ссылки или открываем welcome
    const params = new URLSearchParams(window.location.search);
    const startPage = params.get('page') || 'welcome';
    
    navigate(startPage, true);

    initFooter(); // Инициализация футера
});

// --- 4. Анимация светлячков (Canvas) ---
const canvas = document.getElementById('fireflies-canvas');
const ctx = canvas.getContext('2d');
let width, height, fireflies = [];
const config = { 
    quantity: 60, 
    size: { min: 1, max: 3 }, 
    speed: { min: 0.2, max: 0.6 }, 
    color: '#d4a1f9',
    glow: true
};

function setCanvasSize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Firefly {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.r = Math.random() * (config.size.max - config.size.min) + config.size.min;
        this.vx = (Math.random() - 0.5) * config.speed.max;
        this.vy = (Math.random() - 0.5) * config.speed.max;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.fadeRate = Math.random() * 0.01 + 0.003;
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = config.glow ? 10 : 0;
        ctx.shadowColor = config.color;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        ctx.fillStyle = config.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha += this.fadeRate;
        if (this.alpha > 0.8 || this.alpha < 0.1) this.fadeRate = -this.fadeRate;
        if (this.x > width + this.r) this.x = -this.r;
        else if (this.x < -this.r) this.x = width + this.r;
        if (this.y > height + this.r) this.y = -this.r;
        else if (this.y < -this.r) this.y = height + this.r;
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    fireflies.forEach(f => { f.update(); f.draw(); });
    requestAnimationFrame(animate);
}

function initFireflies() {
    fireflies = [];
    for(let i = 0; i < config.quantity; i++) fireflies.push(new Firefly());
}

// --- 5. Глобальная логика оплаты ---
window.handleDonate = async function(amount = null) {
    const tg = window.Telegram?.WebApp;
    
    try {
        // Если хочешь разные суммы, можно слать их в body
        const response = await fetch('/api/get-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });

        const data = await response.json();

        if (tg && data.url) {
            tg.openInvoice(data.url, (status) => {
                if (status === 'paid') {
                    tg.showAlert('✨ Благодарим за поддержку Космического Таро!');
                    // Здесь можно вызвать функцию обновления баланса, если она есть
                } else if (status === 'cancelled') {
                    console.log('Платеж отменен');
                }
            });
        } else {
            // Фолбек для браузера
            if (data.url) window.open(data.url, '_blank');
        }
    } catch (e) {
        console.error('Ошибка оплаты:', e);
        if (tg) tg.showAlert('Произошла ошибка при формировании счета');
    }
};

window.addEventListener('resize', () => {
    setCanvasSize();
    initFireflies();
});

// Конфигурация приложения
const APP_CONFIG = {
    instagramNick: 'hfdfhjvffnmkkhghb', // Меняй только здесь
    get instaUrl() {
        return `https://www.instagram.com/${this.instagramNick}/`;
    }
};

// Функция инициализации футера
function initFooter() {
    const instaLink = document.getElementById('insta-link');
    if (instaLink) {
        instaLink.href = APP_CONFIG.instaUrl;
        instaLink.target = "_blank";
        instaLink.rel = "noopener noreferrer";
        if (!APP_CONFIG.instagramNick) {
            instaLink.parentElement.style.display = 'none';
        }
    }
}

setCanvasSize();
initFireflies();
animate();
