/**
 * Логика страницы Welcome с синхронизацией данных в Supabase
 */

// Флаг для предотвращения повторных кликов при оплате
let isPaying = false;

// 1. Открытие модального окна
window.openDateModal = function() {
    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.style.display = 'flex';
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

// 3. Процесс оплаты Stars и сохранения данных
window.processPayment = async function() {
    if (isPaying) return;
    
    const birthDate = document.getElementById('birth-date')?.value;
    const tg = window.Telegram?.WebApp;
    
    if (!birthDate) {
        const msg = "Пожалуйста, выберите дату рождения";
        tg?.showAlert ? tg.showAlert(msg) : alert(msg);
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
        tg?.showAlert ? tg.showAlert(msg) : alert(msg);
        return;
    }

    isPaying = true;

    try {
        // Запрос инвойса
        const res = await fetch('/api/get-invoice?type=birthday');
        const data = await res.json();
        
        if (tg?.openInvoice && data.url) {
            tg.openInvoice(data.url, async (status) => {
                if (status === 'paid') {
                    // СОХРАНЕНИЕ В БАЗУ (SUPABASE)
                    try {
                        await fetch('/api/save-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                initData: tg.initData || "",
                                birthDate: birthDate
                            })
                        });
                        localStorage.setItem('userBirthDate', birthDate);
                    } catch (dbErr) {
                        console.error("Ошибка синхронизации:", dbErr);
                    }

                    // Навигация после успеха
                    if (window.navigate) {
                        window.navigate('profile'); 
                    } else {
                        window.location.href = '/profile/profile.html';
                    }
                } else {
                    isPaying = false;
                }
            });
        } else {
            console.log("Demo mode. Invoice URL:", data.url);
            alert("Демо-режим: оплата доступна только внутри Telegram.");
            isPaying = false;
        }
    } catch (e) {
        console.error("Payment error:", e);
        const errorMsg = "Ошибка при инициализации. Попробуйте позже.";
        tg?.showAlert ? tg.showAlert(errorMsg) : alert(errorMsg);
        isPaying = false;
    }
};

// 4. Слушатели событий
(function initWelcomeEvents() {
    const birthInput = document.getElementById('birth-date');
    if (birthInput) {
        birthInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.processPayment();
        });
    }

    const modal = document.getElementById('date-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeDateModal();
        });
    }
})();
