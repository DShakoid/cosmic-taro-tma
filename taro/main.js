(async function initTaro() {
    // 1. Загрузка базы данных карт (если еще не загружена)
    if (typeof tarotDB === 'undefined') {
        const script = document.createElement('script');
        script.src = '/taro/tarotData.js';
        await new Promise((resolve) => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    // 2. Инициализация Telegram
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#050508');
        tg.setBackgroundColor('#050508');
    }

    // 3. Состояние приложения
    let userAccess = {
        isVip: localStorage.getItem('isVip') === 'true',
        hasPaidOnce: localStorage.getItem('paidBirthday') === 'true'
    };

    const hasFullAccess = () => userAccess.isVip || userAccess.hasPaidOnce;

    let currentMode = '';
    let drawnCount = 0;
    let maxCards = 0;
    let selectedCards = [];
    let isAnimating = false;

    // --- РЕГИСТРАЦИЯ ГЛОБАЛЬНЫХ ФУНКЦИЙ ---
    window.setMode = setMode;
    window.drawCard = drawCard;
    window.shuffleAnimation = shuffleAnimation;
    window.showHistory = showHistory;
    window.closeHistoryModal = closeHistoryModal;
    window.clearHistory = clearHistory;
    window.repeatHistory = repeatHistory;
    window.showInfo = showInfo;
    window.closeInfoModal = closeInfoModal;
    window.shareApp = shareApp;
    window.closeModal = closeModal;
    window.handleDonate = handleDonate;

    Object.defineProperty(window, 'currentMode', { get: () => currentMode });

    // Привязка кнопки сброса
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => setMode(currentMode);
    }

    // Привязка кнопки доната
    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) {
        donateBtn.onclick = () => handleDonate(499);
    }

    // --- ЛОГИКА ИНТЕРФЕЙСА ---

    function setMode(newMode) {
        if (isAnimating) return;

        if (newMode === 'birthday' && !hasFullAccess()) {
            tg?.showConfirm(`Расклад по дате рождения с VIP-анализом стоит 50 ⭐. Открыть доступ?`, (ok) => {
                if (ok) handleDonate(50);
            });
            return;
        }

        currentMode = newMode;
        drawnCount = 0;
        selectedCards = [];
        window.shuffledRemaining = null;

        // Очистка стола
        const table = document.getElementById('table');
        if (table) table.innerHTML = '';
        document.querySelectorAll('.card-anim').forEach(c => c.remove());
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));

        const activeBtn = document.getElementById('btn-' + newMode);
        if (activeBtn) activeBtn.classList.add('active');

        document.getElementById('reset-btn').style.display = 'none';
        document.getElementById('donate-btn').style.display = 'none';

        // Создание сетки (используем вспомогательную функцию внутри)
        if (newMode === 'day' || newMode === 'birthday') { createRow(0, 1, true); maxCards = 1; }
        else if (newMode === 'week') { createRow(0, 4); createRow(4, 7); maxCards = 7; }
        else if (newMode === 'advice') { createRow(0, 3); createRow(3, 6); maxCards = 6; }

        function createRow(start, end, isLarge = false) {
            const row = document.createElement('div');
            row.className = 'table-row';
            for (let i = start; i < end; i++) {
                const s = document.createElement('div');
                s.className = 'slot' + (isLarge ? ' large' : '');
                s.id = 'slot' + i;
                row.appendChild(s);
            }
            table.appendChild(row);
        }

        if (maxCards > 0) {
            const firstSlot = document.getElementById('slot0');
            if (firstSlot) firstSlot.classList.add('active-target');
        }

        // Первичное сообщение
        const box = document.getElementById('prediction-text');
        if (box) {
            const savedDate = localStorage.getItem('userBirthDate');
            if (newMode === 'birthday' && savedDate) {
                const day = TaroLogic.getDayFromDate(savedDate);
                box.innerHTML = `<h3>Ваш личный прогноз</h3><p>Для рожденных ${day}-го числа звезды подготовили особый совет. Тяните карту...</p>`;
            } else {
                box.innerHTML = "Колода перемешана. Тяните карту.";
            }
        }
    }

    function drawCard() {
        if (!currentMode || drawnCount >= maxCards || isAnimating) return;
        isAnimating = true;

        const deck = document.querySelector('.deck');
        const deckRect = deck.getBoundingClientRect();
        createParticles(deckRect.left + deckRect.width / 2, deckRect.top + deckRect.height / 2, '#a855f7');

        const slot = document.getElementById('slot' + drawnCount);
        const slotRect = slot.getBoundingClientRect();
        slot.classList.remove('active-target');

        // ПОЛУЧАЕМ ДАННЫЕ КАРТЫ ИЗ ЛОГИКИ
        const drawnIds = selectedCards.map(c => c.id);
        const cardData = TaroLogic.getRandomCard(tarotDB, drawnIds, window.shuffledRemaining);
        
        const isReversed = Math.random() < 0.25;
        const cardInstance = { ...cardData, isReversed };
        selectedCards.push(cardInstance);
        drawnCount++;

        // Отрисовка карты
        const card = document.createElement('div');
        card.className = `card-anim`;
        card.style.cssText = `position:fixed; z-index:1000; left:${deckRect.left}px; top:${deckRect.top}px; width:${deckRect.width}px; height:${deckRect.height}px; transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);`;

        const cardImg = cardData.image ? `/${cardData.image}` : '/taro/assets/back_card.jpg';
        card.innerHTML = `
            <div class="face back"></div>
            <div class="face front" style="overflow: hidden; background: #1a1a2e;">
                <div class="card-photo" style="position:absolute; top:0; left:0; width:100%; height:100%; background-image:url('${cardImg}'); background-size:cover; background-position:center; opacity:${cardData.image ? 1 : 0.3};"></div>
                ${!cardData.image ? `<div class="card-emoji">${cardData.emoji}</div>` : ''}
                <div style="position:absolute; bottom:0; width:100%; height:40%; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
                <div class="card-name" style="position:absolute; bottom:8px; width:95%; text-align:center; font-size:0.45rem; font-weight:bold; color:#fff;">${cardData.name}</div>
            </div>`;

        document.body.appendChild(card);
        updatePrediction();

        requestAnimationFrame(() => {
            card.style.left = slotRect.left + 'px';
            card.style.top = slotRect.top + 'px';
            card.style.width = slotRect.width + 'px';
            card.style.height = slotRect.height + 'px';
            if (isReversed) card.classList.add('is-reversed');
            card.classList.add('flipped');
        });

        setTimeout(() => {
            slot.appendChild(card);
            card.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%;';
            card.classList.add('arrived');
            card.onclick = () => showModal(cardInstance);
            createParticles(slotRect.left + slotRect.width / 2, slotRect.top + slotRect.height / 2, '#ec4899');
            
            const nextSlot = document.getElementById('slot' + drawnCount);
            if (nextSlot) nextSlot.classList.add('active-target');
            isAnimating = false;
        }, 800);
    }

    function updatePrediction() {
        const box = document.getElementById('prediction-text');
        if (!box) return;

        const birthDate = localStorage.getItem('userBirthDate');
        let personalNote = "";
        let comboNote = "";

        // Используем логику для проверки спец-событий
        if (birthDate && selectedCards.length > 0) {
            const lastCard = selectedCards[selectedCards.length - 1];
            const isMaster = TaroLogic.checkMasterCard(lastCard.id, birthDate);
            const day = TaroLogic.getDayFromDate(birthDate);

            if (hasFullAccess()) {
                personalNote = `<div class="vip-note">
                    <b>🌟 VIP АНАЛИЗ:</b><br>
                    ${isMaster ? `Аркан ${lastCard.name} — ваш покровитель по дате рождения!` : (tarotDB.combos[`birthday+${lastCard.id}`] || 'Ваша дата рождения усиливает влияние этой карты.')}
                </div>`;
            } else {
                personalNote = isMaster ? `<div class="gold-text">✨ Вы вытянули свою карту рождения!</div>` : `<div class="hint-text">🎯 Рожденным ${day}-го числа эта карта сулит важное. Подробности в VIP.</div>`;
            }
        }

        // Ищем комбо через логику
        const comboText = TaroLogic.findCombos(selectedCards, tarotDB);
        if (comboText) comboNote = `<div class="combo-box">🔮 <b>Связка:</b> ${comboText}</div>`;

        // Генерация итогового HTML (упрощено для краткости)
        if (currentMode === 'day' || currentMode === 'birthday') {
            const last = selectedCards[0];
            box.innerHTML = `
                <div class="fade-in element-card">
                    <div class="card-keywords">${last.keywords}</div>
                    <div class="card-title">${last.name}</div>
                    <p>${last.isReversed ? last.advice_rev : last.advice}</p>
                    ${personalNote} ${comboNote}
                </div>`;
        } else {
            // Логика стихий (можно тоже вынести в TaroLogic, если будет расти)
            const counts = {};
            selectedCards.forEach(c => counts[c.element] = (counts[c.element] || 0) + 1);
            const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            box.innerHTML = `<div class="fade-in element-card">
                <b>Доминирующая стихия: ${dominant}</b><br>
                ${tarotDB.elementalAdvice[dominant]}
                ${personalNote} ${comboNote}
            </div>`;
        }

        if (drawnCount >= maxCards && maxCards > 0) {
            document.getElementById('reset-btn').style.display = 'inline-block';
            document.getElementById('donate-btn').style.display = 'inline-block';
            saveToHistory();
        }
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ UI ФУНКЦИИ ---

    function createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const p = document.createElement('div'); p.className = 'particle';
            p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = color;
            const a = Math.random() * Math.PI * 2, v = Math.random() * 50 + 20;
            p.style.setProperty('--dx', Math.cos(a) * v); p.style.setProperty('--dy', Math.sin(a) * v);
            document.body.appendChild(p); setTimeout(() => p.remove(), 800);
        }
    }

    function shuffleAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        const deck = document.querySelector('.deck');
        const rect = deck.getBoundingClientRect();
        
        // Логика перемешивания
        const drawnIds = selectedCards.map(c => c.id);
        const remaining = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        window.shuffledRemaining = remaining;

        deck.style.transform = 'scale(0.95)';
        setTimeout(() => deck.style.transform = 'scale(1)', 200);
        tg?.HapticFeedback?.impactOccurred('medium');

        // Визуал перемешивания
        for (let i = 0; i < 6; i++) {
            const fc = document.createElement('div');
            fc.className = 'card-anim shuffle-card';
            fc.style.cssText = `position:fixed; left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px;`;
            fc.innerHTML = '<div class="face back"></div>';
            document.body.appendChild(fc);
            setTimeout(() => {
                const angle = (i - 3) * 10;
                fc.style.transform = `translate(${Math.sin(angle)*40}px, -20px) rotate(${angle}deg)`;
                fc.style.opacity = '0';
                setTimeout(() => fc.remove(), 400);
            }, i * 50);
        }
        setTimeout(() => isAnimating = false, 600);
    }

    // Остальные функции (Modal, History, Donate, Share) остаются практически без изменений
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

    function showHistory() {
        const saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        const historyList = document.getElementById('history-list');
        if (saved.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 20px;">📭 Пока нет истории</div>';
        } else {
            historyList.innerHTML = saved.map((item, index) => {
                const date = new Date(item.date).toLocaleString();
                return `<div style="border-bottom: 1px solid rgba(168,85,247,0.2); padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #a855f7; font-weight: bold;">${item.mode}</span>
                        <span style="font-size: 0.65rem; opacity: 0.7;">${date}</span>
                    </div>
                    <div style="margin-top:5px; font-size:0.65rem;">${item.cards.map(c => c.name).join(', ')}</div>
                    <button onclick="repeatHistory(${index})" style="margin-top:8px; background:none; border:1px solid #a855f7; color:#a855f7; border-radius:15px; font-size:0.6rem; padding:4px 10px;">Повторить</button>
                </div>`;
            }).join('');
        }
        document.getElementById('history-modal').classList.add('active');
    }

    function repeatHistory(index) {
        const saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        if (saved[index]) { setMode(saved[index].mode); closeHistoryModal(); }
    }
    function showModal(card) {
        const modalImage = document.getElementById('m-image');
        const modalEmoji = document.getElementById('m-emoji');
        
        if (card.image) {
            if (modalImage) {
                modalImage.style.backgroundImage = `url('/${card.image}')`;
                modalImage.style.display = 'block';
            }
            if (modalEmoji) modalEmoji.style.display = 'none';
        } else {
            if (modalEmoji) {
                modalEmoji.innerText = card.emoji;
                modalEmoji.style.display = 'block';
            }
            if (modalImage) modalImage.style.display = 'none';
        }
        
        document.getElementById('m-name').innerText = card.name + (card.isReversed ? ' (пер.)' : '');
        document.getElementById('m-desc').innerHTML = card.isReversed ? card.advice_rev : card.advice;
        document.getElementById('card-overlay').classList.add('active');
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }

    function closeModal() { document.getElementById('card-overlay').classList.remove('active'); }
    function closeHistoryModal() { document.getElementById('history-modal').classList.remove('active'); }
    function closeInfoModal() { document.getElementById('info-modal').classList.remove('active'); }
    function clearHistory() { if(confirm('Очистить?')) { localStorage.removeItem('tarotHistory'); showHistory(); } }
    function showInfo() { document.getElementById('info-modal').classList.add('active'); }
    function shareApp() { const url = 'https://t.me/Cosmic_taro_rich_bot/cosmictaro'; if (tg?.showShareButton) tg.showShareButton(url); else alert(url); }

    async function handleDonate(amount) {
        try {
            const res = await fetch(`/api/get-invoice?amount=${amount}`);
            const data = await res.json();
            if (tg && data.url) {
                tg.openInvoice(data.url, (status) => {
                    if (status === 'paid') {
                        if (amount === 499) localStorage.setItem('isVip', 'true');
                        if (amount === 50) localStorage.setItem('paidBirthday', 'true');
                        tg.showAlert('✨ Доступ открыт!');
                        location.reload();
                    }
                });
            }
        } catch (e) { tg.showAlert('Ошибка оплаты'); }
    }
    function shareApp() { const url = 'https://t.me/Cosmic_taro_rich_bot/cosmictaro'; if (tg?.showShareButton) tg.showShareButton(url); else alert(url); }


    // Старт
    const params = new URLSearchParams(window.location.search);
    setMode(params.get('mode') === 'birthday' ? 'birthday' : 'day');

})();
