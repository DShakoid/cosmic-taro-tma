// --- ЛОГИЧЕСКАЯ ЧАСТЬ (taro/logic.js) ---

// Парсинг даты
function getDayFromDate(dateStr) {
    if (!dateStr) return null;
    const numbers = dateStr.match(/\d+/g);
    if (!numbers) return null;
    if (numbers[0].length === 4) return parseInt(numbers[2]);
    return parseInt(numbers[0]);
}

// Состояние и уровни доступа
let userAccess = {
    isVip: localStorage.getItem('isVip') === 'true',
    hasPaidOnce: localStorage.getItem('paidBirthday') === 'true'
};

const hasFullAccess = () => userAccess.isVip || userAccess.hasPaidOnce;

let currentMode = '';
let drawnCount = 0;
let maxCards = 0;
let selectedCards = [];

// Проверка предикта по дате рождения
function generateBirthdayPrediction(date) {
    const day = getDayFromDate(date);
    const box = document.getElementById('prediction-text');
    if (box && day) {
        box.innerHTML = `<h3>Ваш личный прогноз</h3><p>Для рожденных ${day}-го числа звезды подготовили особый совет. Тяните карту...</p>`;
    }
}

// Сохранение в историю
function saveToHistory() {
    const history = {
        date: new Date().toISOString(),
        mode: currentMode,
        cards: selectedCards.map(c => ({ id: c.id, name: c.name, isReversed: c.isReversed }))
    };
    let saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
    saved.unshift(history);
    if (saved.length > 10) saved.pop();
    localStorage.setItem('tarotHistory', JSON.stringify(saved));
}

// Очистка истории
function clearHistory() { 
    if(confirm('Очистить?')) { 
        localStorage.removeItem('tarotHistory'); 
        showHistory(); 
    } 
}

// Инициализация Telegram параметров
const tg = window.Telegram?.WebApp;
