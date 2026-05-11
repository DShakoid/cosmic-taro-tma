/**
 * COSMIC TAROT - CORE ENGINE (GLOBAL ARCHITECTURE)
 */

const tg = window.Telegram?.WebApp;

// --- 1. ГЛОБАЛЬНЫЙ ОБЪЕКТ ПРИЛОЖЕНИЯ (МОЗГИ) ---
// --- 1. ГЛОБАЛЬНЫЙ ОБЪЕКТ ПРИЛОЖЕНИЯ (МОЗГИ) ---
window.App = {
    user: {
        id: null,
        username: null,
        birthDate: null,
        isVip: false,
        paidBirthday: false,
        isLoaded: false
    },

    async init() {
        if (tg && tg.initDataUnsafe?.user) {
            // Мы внутри Telegram
            tg.ready();
            tg.expand();
            this.user.id = tg.initDataUnsafe.user.id;
            this.user.username = tg.initDataUnsafe.user.username;
            
            if (tg.setHeaderColor) tg.setHeaderColor('#050508');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#050508');
        } else {
            // ПРАВКА: Мы в обычном браузере (Chrome)
            console.log("Core: Running in Browser mode");
            this.user.id = 7777777; // Твой тестовый ID для отладки
            this.user.username = 'LocalDev';
        }

        // Загружаем данные из БД или локально
        await this.syncWithServer();
        this.user.isLoaded = true;
        
        // Оповещаем систему, что данные загружены
        document.dispatchEvent(new Event('appReady'));
        console.log("App Core: Profile Loaded", this.user);
    },
    
    async syncWithServer() {
        // ПРАВКА: Если ID еще нет, сразу прыгаем в catch (в локальное хранилище)
        if (!this.user.id) {
            this.loadLocalData();
            return;
        }

        try {
            const res = await fetch(`/api/user?id=${this.user.id}`);
            if (res.ok) {
                const data = await res.json();
                this.user.birthDate = data.birthDate;
                this.user.isVip = data.isVip;
                this.user.paidBirthday = data.paidBirthday;
                
                // Обновляем локалку актуальными данными с сервера
                if (data.birthDate) localStorage.setItem('userBirthDate', data.birthDate);
            } else {
                throw new Error("API error");
            }
        } catch (e) {
            this.loadLocalData();
        }
    },

    loadLocalData() {
        this.user.birthDate = localStorage.getItem('userBirthDate');
        this.user.isVip = localStorage.getItem('isVip') === 'true';
        this.user.paidBirthday = localStorage.getItem('paidBirthday') === 'true';
    },

    checkAccess(feature) {
        if (this.user.isVip) return true;
        if (feature === 'birthday_spread') return this.user.paidBirthday;
        return false;
    }
};

window.App.init();

// --- 2. УПРАВЛЕНИЕ НАВИГАЦИЕЙ ---
async function navigate(page, pushState = true) {
    const mainContent = document.getElementById('app-body');
    const pageStyle = document.getElementById('page-style');
    const headerBackBtn = document.getElementById('header-back-btn'); 
    
    try {
        const isHome = (page === 'welcome' || page === 'index');
        if (headerBackBtn) headerBackBtn.style.display = isHome ? 'none' : 'flex';

        if (tg) {
            if (!isHome) {
                tg.BackButton.show();
                tg.BackButton.onClick(() => window.history.back());
            } else {
                tg.BackButton.hide();
            }
        }

        const response = await fetch(`/${page}/${page}.html`);
        if (!response.ok) throw new Error('Ошибка загрузки страницы');
        const html = await response.text();
        
        mainContent.innerHTML = html;
        pageStyle.href = `/${page}/style.css`;

        const newScript = document.createElement('script');
        newScript.id = 'page-script';
        newScript.src = `/${page}/app.js`;
        newScript.type = 'text/javascript';
        document.body.appendChild(newScript);

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

// --- 3. ОБРАБОТКА КЛИКОВ И ИСТОРИИ ---
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) backBtn.onclick = () => window.history.back();

    window.onpopstate = (event) => {
        const page = event.state?.page || 'welcome';
        navigate(page, false);
    };

    const params = new URLSearchParams(window.location.search);
    const startPage = params.get('page') || 'welcome';
    navigate(startPage, true);
    initFooter();
});

// --- 4. АНИМАЦИЯ СВЕТЛЯЧКОВ (Canvas) ---
const canvas = document.getElementById('fireflies-canvas');
const ctx = canvas.getContext('2d');
let width, height, fireflies = [];
const config = { quantity: 60, size: { min: 1, max: 3 }, speed: { min: 0.2, max: 0.6 }, color: '#d4a1f9', glow: true };

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
        this.x += this.vx; this.y += this.vy;
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

// --- 5. ГЛОБАЛЬНАЯ ОПЛАТА ---
window.handleDonate = async function(amount = null) {
    try {
        const response = await fetch('/api/get-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, userId: window.App.user.id })
        });
        const data = await response.json();
        if (tg && data.url) {
            tg.openInvoice(data.url, async (status) => {
                if (status === 'paid') {
                    tg.showAlert('✨ Спасибо за покупку!');
                    await window.App.syncWithServer(); // Обновляем данные пользователя сразу после оплаты
                    location.reload(); // Перезагружаем, чтобы применились права
                }
            });
        }
    } catch (e) { console.error('Ошибка оплаты:', e); }
};

// Конфигурация Инстаграм
const APP_CONFIG = {
    instagramNick: 'hfdfhjvffnmkkhghb', 
    get instaUrl() { return `https://www.instagram.com/${this.instagramNick}/`; }
};

function initFooter() {
    const instaLink = document.getElementById('insta-link');
    if (instaLink && APP_CONFIG.instagramNick) {
        instaLink.href = APP_CONFIG.instaUrl;
    }
}

window.addEventListener('resize', () => { setCanvasSize(); initFireflies(); });
setCanvasSize(); initFireflies(); animate();
