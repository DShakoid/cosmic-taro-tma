// --- ЛОГИЧЕСКАЯ ЧАСТЬ (taro/taroLogic.js) ---

// Инициализация Telegram параметров (сразу в window)
window.tg = window.Telegram?.WebApp;

// Состояние (делаем глобальным, чтобы main.js мог менять эти значения)
window.currentMode = '';
window.drawnCount = 0;
window.maxCards = 0;
window.selectedCards = [];

// Парсинг даты
window.getDayFromDate = function(dateStr) {
    if (!dateStr) return null;
    const numbers = dateStr.match(/\d+/g);
    if (!numbers) return null;
    if (numbers[0].length === 4) return parseInt(numbers[2]);
    return parseInt(numbers[0]);
};

// Проверка доступа (вычисляем на лету, чтобы всегда были актуальные данные из localStorage)
window.hasFullAccess = function() {
    const isVip = localStorage.getItem('isVip') === 'true';
    const hasPaidOnce = localStorage.getItem('paidBirthday') === 'true';
    return isVip || hasPaidOnce;
};

// Проверка предикта по дате рождения
window.generateBirthdayPrediction = function(date) {
    const day = window.getDayFromDate(date);
    const box = document.getElementById('prediction-text');
    if (box && day) {
        box.innerHTML = `<h3>Ваш личный прогноз</h3><p>Для рожденных ${day}-го числа звезды подготовили особый совет. Тяните карту...</p>`;
    }
};

// Сохранение в историю
window.saveToHistory = function() {
    const history = {
        date: new Date().toISOString(),
        mode: window.currentMode,
        cards: window.selectedCards.map(c => ({ id: c.id, name: c.name, isReversed: c.isReversed }))
    };
    let saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
    saved.unshift(history);
    if (saved.length > 10) saved.pop();
    localStorage.setItem('tarotHistory', JSON.stringify(saved));
};

// Очистка истории
window.clearHistory = function() { 
    if(confirm('Очистить?')) { 
        localStorage.removeItem('tarotHistory'); 
        if (typeof window.showHistory === 'function') {
            window.showHistory(); 
        }
    } 
};
