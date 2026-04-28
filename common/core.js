/**
 * COSMIC TAROT - CORE ENGINE
 * Отвечает за: инициализацию TMA, фоновую анимацию и навигацию.
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
async function navigate(page) {
    const mainContent = document.getElementById('app-body');
    const pageStyle = document.getElementById('page-style');
    const headerBackBtn = document.getElementById('header-back-btn'); // Кнопка в шапке
    
    try {
        // Управление видимостью кнопки Назад (не показываем на главной)
        if (headerBackBtn) {
            headerBackBtn.style.display = (page === 'welcome' || page === 'index') ? 'none' : 'flex';
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

        window.scrollTo(0, 0);

    } catch (err) {
        console.error('Navigation error:', err);
        mainContent.innerHTML = `<div style="padding:20px; text-align:center;">Ошибка загрузки раздела ${page}</div>`;
    }
}

// --- 3. Обработка кликов в Header (Глобально) ---
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка Назад в шапке
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) {
        backBtn.onclick = () => navigate('welcome');
    }

    // Если есть бургер-меню, можно добавить его открытие тут
    const menuBtn = document.getElementById('main-menu-btn');
    if (menuBtn) {
        menuBtn.onclick = () => {
            console.log('Open menu'); 
            // Тут твоя логика открытия меню, если нужно
        };
    }

    // Стартовая страница
    navigate('welcome');
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

window.addEventListener('resize', () => {
    setCanvasSize();
    initFireflies();
});

setCanvasSize();
initFireflies();
animate();
