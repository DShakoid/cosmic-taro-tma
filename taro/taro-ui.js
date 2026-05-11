/**
 * COSMIC TAROT: UI & Animation Module
 * Отвечает за: рендеринг, анимации, клики, частицы
 */

(async function initTaroUI() {
    let isAnimating = false;
    const tg = window.Telegram?.WebApp;

    // Инициализация интерфейса
    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#050508');
    }

    // РЕГИСТРАЦИЯ ГЛОБАЛЬНЫХ ФУНКЦИЙ ДЛЯ HTML
    window.setMode = setMode;
    window.drawCard = drawCard;
    window.shuffleAnimation = shuffleAnimation;
    window.handleDonate = handleDonate;
    window.showModal = showModal;
    window.closeModal = () => document.getElementById('card-overlay').classList.remove('active');
    window.showHistory = showHistory;
    window.closeHistoryModal = () => document.getElementById('history-modal').classList.remove('active');

    function setMode(newMode) {
        if (isAnimating) return;

        if (newMode === 'birthday' && !TaroLogic.hasFullAccess()) {
            tg?.showConfirm(`Расклад по дате рождения с VIP-анализом стоит 50 ⭐. Открыть доступ?`, (ok) => {
                if (ok) handleDonate(50);
            });
            return;
        }

        // Сброс состояния в логике
        TaroLogic.state.currentMode = newMode;
        TaroLogic.state.drawnCount = 0;
        TaroLogic.state.selectedCards = [];
        TaroLogic.state.shuffledRemaining = null;

        // Очистка стола
        const table = document.getElementById('table');
        table.innerHTML = '';
        document.querySelectorAll('.card-anim').forEach(c => c.remove());
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        
        const activeBtn = document.getElementById('btn-' + newMode);
        if (activeBtn) activeBtn.classList.add('active');

        // Создание слотов
        if (newMode === 'day' || newMode === 'birthday') { createRow(0, 1, true); TaroLogic.state.maxCards = 1; }
        else if (newMode === 'week') { createRow(0, 4); createRow(4, 7); TaroLogic.state.maxCards = 7; }
        else if (newMode === 'advice') { createRow(0, 3); createRow(3, 6); TaroLogic.state.maxCards = 6; }

        updateUI();
    }

    function createRow(startId, endId, isLarge = false) {
        const row = document.createElement('div');
        row.className = 'table-row';
        for (let i = startId; i < endId; i++) {
            const s = document.createElement('div');
            s.className = 'slot' + (isLarge ? ' large' : '');
            s.id = 'slot' + i;
            if (i === 0) s.classList.add('active-target');
            row.appendChild(s);
        }
        document.getElementById('table').appendChild(row);
    }

    function drawCard() {
        if (isAnimating || TaroLogic.state.drawnCount >= TaroLogic.state.maxCards) return;
        isAnimating = true;

        const cardData = TaroLogic.getNextCard();
        const deck = document.querySelector('.deck');
        const slot = document.getElementById('slot' + (TaroLogic.state.drawnCount - 1));
        const deckRect = deck.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();

        slot.classList.remove('active-target');
        createParticles(deckRect.left + deckRect.width/2, deckRect.top + deckRect.height/2, '#a855f7');

        const card = document.createElement('div');
        card.className = `card-anim`;
        card.style.cssText = `position:fixed; z-index:1000; left:${deckRect.left}px; top:${deckRect.top}px; width:${deckRect.width}px; height:${deckRect.height}px; transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);`;
        
        const cardImg = cardData.image ? `/${cardData.image}` : '/taro/assets/back_card.jpg';
        card.innerHTML = `
            <div class="face back"></div>
            <div class="face front" style="overflow: hidden; background: #1a1a2e;">
                <div class="card-photo" style="position:absolute; top:0; left:0; width:100%; height:100%; background-image:url('${cardImg}'); background-size:cover; background-position:center; opacity:${cardData.image ? 1 : 0.3};"></div>
                <div class="card-name" style="position:absolute; bottom:8px; width:95%; text-align:center; font-size:0.45rem; font-weight:bold; color:#fff;">${cardData.name}</div>
            </div>`;

        document.body.appendChild(card);

        requestAnimationFrame(() => {
            card.style.left = slotRect.left + 'px';
            card.style.top = slotRect.top + 'px';
            card.style.width = slotRect.width + 'px';
            card.style.height = slotRect.height + 'px';
            if (cardData.isReversed) card.classList.add('is-reversed');
            card.classList.add('flipped');
        });

        setTimeout(() => {
            slot.appendChild(card);
            card.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%;';
            card.onclick = () => showModal(cardData);
            createParticles(slotRect.left + slotRect.width/2, slotRect.top + slotRect.height/2, '#ec4899');
            
            const nextSlot = document.getElementById('slot' + TaroLogic.state.drawnCount);
            if (nextSlot) nextSlot.classList.add('active-target');
            
            updateUI();
            isAnimating = false;
        }, 800);
    }

    function updateUI() {
        const box = document.getElementById('prediction-text');
        if (!box) return;

        const info = TaroLogic.getInterpretation();
        if (TaroLogic.state.drawnCount === 0) {
            box.innerHTML = info.currentMode === 'birthday' ? "Тяните вашу карту рождения..." : "Колода перемешана. Тяните карту.";
            return;
        }

        // Рендеринг текста (твой стиль с элементами)
        let html = "";
        const { lastCard } = info;

        if (info.currentMode === 'day' || info.currentMode === 'birthday') {
            html = `
                <div class="fade-in element-card" style="border-left: 4px solid #a855f7; background: rgba(168, 85, 247, 0.05); padding: 15px; border-radius: 12px;">
                    <div style="font-size: 0.65rem; text-transform: uppercase; opacity: 0.5;">${lastCard.keywords}</div>
                    <div style="color: #fff; font-weight: 900; font-size: 1.1rem; margin: 5px 0;">${lastCard.name}</div>
                    <p style="font-size: 0.85rem; color: #e2d5f5;">${lastCard.isReversed ? lastCard.advice_rev : lastCard.advice}</p>
                </div>`;
        }

        // Добавляем VIP заметку
        if (info.day) {
            if (info.hasFullAccess) {
                html += `<div style="margin-top:10px; padding:10px; border:1px solid gold; border-radius:12px; font-size:0.8rem;">
                    🌟 VIP: ${info.isMasterCard ? 'Это ваша карта-покровитель!' : 'Влияние вашей даты рождения усиливает этот аркан.'}</div>`;
            } else {
                html += `<div style="opacity:0.6; font-size:0.7rem; margin-top:10px;">🎯 Рожденным ${info.day}-го числа доступен расширенный анализ.</div>`;
            }
        }

        if (info.comboNote) {
            html += `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; border-radius:12px; font-size:0.8rem;">🔮 <b>Связка:</b> ${info.comboNote}</div>`;
        }

        box.innerHTML = html;

        // Показ кнопок в конце
        if (TaroLogic.state.drawnCount >= TaroLogic.state.maxCards) {
            document.getElementById('reset-btn').style.display = 'inline-block';
            TaroLogic.saveHistory();
        }
    }

    function shuffleAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        TaroLogic.prepareDeck();
        
        const deck = document.querySelector('.deck');
        deck.classList.add('shuffling'); 
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        setTimeout(() => {
            deck.classList.remove('shuffling');
            isAnimating = false;
        }, 1000);
    }

    function createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `left:${x}px; top:${y}px; background:${color};`;
            const a = Math.random() * Math.PI * 2, v = Math.random() * 40 + 20;
            p.style.setProperty('--dx', Math.cos(a) * v);
            p.style.setProperty('--dy', Math.sin(a) * v);
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 800);
        }
    }

    async function handleDonate(amount) {
        try {
            const res = await fetch(`/api/get-invoice?amount=${amount}`);
            const data = await res.json();
            if (tg && data.url) {
                tg.openInvoice(data.url, (status) => {
                    if (status === 'paid') {
                        if (amount === 499) localStorage.setItem('isVip', 'true');
                        if (amount === 50) localStorage.setItem('paidBirthday', 'true');
                        location.reload();
                    }
                });
            }
        } catch (e) { console.error("Donate error", e); }
    }

    function showModal(card) {
        document.getElementById('m-name').innerText = card.name + (card.isReversed ? ' (пер.)' : '');
        document.getElementById('m-desc').innerHTML = card.isReversed ? card.advice_rev : card.advice;
        document.getElementById('card-overlay').classList.add('active');
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }

    function showHistory() {
        const saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        const list = document.getElementById('history-list');
        list.innerHTML = saved.map(item => `
            <div style="border-bottom:1px solid #333; padding:10px 0;">
                <div style="color:#a855f7; font-size:0.8rem;">${item.mode} — ${new Date(item.date).toLocaleDateString()}</div>
                <div style="font-size:0.7rem;">${item.cards.map(c => c.name).join(', ')}</div>
            </div>
        `).join('') || 'История пуста';
        document.getElementById('history-modal').classList.add('active');
    }

    // Стартовый запуск
    setMode('day');

})();
