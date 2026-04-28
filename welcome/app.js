/**
 * Логика страницы Welcome
 */

// Флаг для предотвращения повторных кликов при оплате
let isPaying = false;

// 1. Открытие модального окна
window.openDateModal = function() {
    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Автофокус на поле ввода даты для удобства
        setTimeout(() => {
            document.getElementById('birth-date')?.focus();
        }, 100);
    }
};

// 2. Закрытие модального окна
window.closeDateModal = function() {
    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.style.display = 'none';
        isPaying = false;
    }
};

// 3. Процесс оплаты Stars
window.processPayment = async function() {
    if (isPaying) return;
    
    const birthDate = document.getElementById('birth-date')?.value;
    
    if (!birthDate) {
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert("Пожалуйста, выберите дату рождения");
        } else {
            alert("Пожалуйста, выберите дату рождения");
        }
        return;
    }

    // Проверка возраста (минимум 13 лет)
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 13) {
        const msg = "Сервис доступен пользователям старше 13 лет";
        window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        return;
    }

    isPaying = true;

    try {
        // Запрос инвойса у твоего API [см. файл api/get-invoice.js в репозитории]
        const res = await fetch('/api/get-invoice?type=birthday');
        const data = await res.json();
        
        if (window.Telegram?.WebApp?.openInvoice && data.url) {
            window.Telegram.WebApp.openInvoice(data.url, (status) => {
                if (status === 'paid') {
                    // Сохраняем дату и переходим к результату
                    localStorage.setItem('userBirthDate', birthDate);
                    // Используем функцию навигации из core.js
                    if (window.navigate) {
                        window.navigate('taro'); // или куда должен вести прогноз
                    } else {
                        window.location.href = '/taro/index.html?mode=birthday';
                    }
                } else {
                    isPaying = false;
                }
            });
        } else {
            console.log("Demo mode or No Telegram context. Invoice URL:", data.url);
            alert("Демо-режим: оплата через Telegram Stars доступна только внутри приложения.");
            isPaying = false;
        }
    } catch (e) {
        console.error("Payment error:", e);
        const errorMsg = "Ошибка при инициализации оплаты. Попробуйте позже.";
        window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(errorMsg) : alert(errorMsg);
        isPaying = false;
    }
};

// 4. Слушатели событий для UX
(function initWelcomeEvents() {
    const birthInput = document.getElementById('birth-date');
    if (birthInput) {
        birthInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.processPayment();
        });
    }

    // Закрытие по клику вне контента модалки
    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeDateModal();
        });
    }
})();
