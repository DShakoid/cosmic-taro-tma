// --- ВИЗУАЛЬНАЯ ЧАСТЬ И ИНИЦИАЛИЗАЦИЯ (taro/app.js) ---

(async function initTaro() {
    // Загрузка БД, если её нет
    if (typeof tarotDB === 'undefined') {
        const script = document.createElement('script');
        script.src = '/taro/tarotData.js';
        await new Promise((resolve) => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    let isAnimating = false;

    // Регистрация функций в глобальной области (твои оригинальные названия)
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

    // Стало (правильно):
window.currentMode = currentMode;

    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#050508');
        tg.setBackgroundColor('#050508');
    }

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
        
        const table = document.getElementById('table');
        if (!table) return;
        table.innerHTML = '';
        
        document.querySelectorAll('.card-anim').forEach(c => c.remove());
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        
        const activeBtn = document.getElementById('btn-' + newMode);
        if (activeBtn) activeBtn.classList.add('active');
        
        document.getElementById('reset-btn').style.display = 'none';
        document.getElementById('donate-btn').style.display = 'none';
        
        if (newMode === 'day' || newMode === 'birthday') { createRow(0, 1, true); maxCards = 1; }
        else if (newMode === 'week') { createRow(0, 4); createRow(4, 7); maxCards = 7; }
        else if (newMode === 'advice') { createRow(0, 3); createRow(3, 6); maxCards = 6; }
        
        function createRow(startId, endId, isLarge = false) {
            const row = document.createElement('div');
            row.className = 'table-row';
            for (let i = startId; i < endId; i++) {
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

        const box = document.getElementById('prediction-text');
        if (box) {
            const savedDate = localStorage.getItem('userBirthDate');
            if (newMode === 'birthday' && savedDate) {
                generateBirthdayPrediction(savedDate);
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

        let cardData;
        const drawnIds = selectedCards.map(c => c.id);
        
        if (window.shuffledRemaining && window.shuffledRemaining.length > 0) {
            cardData = window.shuffledRemaining[0];
            window.shuffledRemaining.shift();
        } else {
            const availableCards = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
            cardData = availableCards[Math.floor(Math.random() * availableCards.length)];
        }

        const isReversed = Math.random() < 0.25;
        const cardInstance = { ...cardData, isReversed };
        selectedCards.push(cardInstance);
        drawnCount++;

        const card = document.createElement('div');
        card.className = `card-anim`;
        card.style.position = 'fixed';
        card.style.zIndex = '1000';
        card.style.left = deckRect.left + 'px';
        card.style.top = deckRect.top + 'px';
        card.style.width = deckRect.width + 'px';
        card.style.height = deckRect.height + 'px';
        card.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';

        const cardImg = cardData.image ? `/${cardData.image}` : '/taro/assets/back_card.jpg';

        card.innerHTML = `
            <div class="face back"></div>
            <div class="face front" style="overflow: hidden; background: #1a1a2e;">
                <div class="card-photo" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${cardImg}'); background-size: cover; background-position: center; opacity: ${cardData.image ? 1 : 0.3}; transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);"></div>
                ${!cardData.image ? `<div class="card-emoji">${cardData.emoji}</div>` : ''}
                <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
                <div class="card-name" style="position: absolute; bottom: 8px; width: 95%; text-align: center; font-size: 0.45rem; font-weight: bold; color: #fff;">${cardData.name}</div>
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
            card.style.position = 'absolute';
            card.style.left = '0'; card.style.top = '0'; card.style.width = '100%'; card.style.height = '100%';
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

        const elementStyles = { 
            "Огонь": { color: "#ff4d4d", icon: "🔥", shadow: "rgba(255, 77, 77, 0.4)" }, 
            "Вода": { color: "#4db8ff", icon: "💧", shadow: "rgba(77, 184, 255, 0.4)" }, 
            "Воздух": { color: "#ffcc00", icon: "🌪️", shadow: "rgba(255, 204, 0, 0.4)" }, 
            "Земля": { color: "#4dff88", icon: "🌿", shadow: "rgba(77, 255, 136, 0.4)" } 
        };

        const birthDate = localStorage.getItem('userBirthDate');
        let personalNote = "";
        let comboNote = "";

        if (birthDate) {
            const day = getDayFromDate(birthDate);
            const lastCard = selectedCards[selectedCards.length - 1];
            if (lastCard) {
                const isMasterCard = (lastCard.id === day || lastCard.id === (day % 22));
                if (hasFullAccess()) {
                    personalNote = `<div style="margin-top:15px; padding:12px; border:1px solid gold; background: rgba(255,215,0,0.1); border-radius:12px;"><div style="color:gold; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">🌟 VIP АНАЛИЗ ПО ДАТЕ:</div><div style="font-size:0.85rem; color:#fff;">${isMasterCard ? `Мистическое совпадение! Аркан ${lastCard.name} — ваш прямой покровитель.` : ''}${tarotDB.combos[`birthday+${lastCard.id}`] || 'Ваша дата рождения наделяет эту карту особым смыслом сегодня.'}</div></div>`;
                } else {
                    personalNote = isMasterCard ? `<div style="margin-top:10px; color: gold; font-size: 0.75rem;">✨ Вы вытянули свою карту рождения! Это добрый знак.</div>` : `<div style="margin-top:10px; font-style: italic; opacity: 0.6; font-size: 0.7rem; border-top: 1px solid #333; padding-top: 5px;">🎯 Рожденным ${day}-го числа эта карта сулит нечто важное. Детали в VIP-режиме.</div>`;
                }
            }
        }

        if (selectedCards.length >= 2) {
            for (let i = 0; i < selectedCards.length; i++) {
                for (let j = i + 1; j < selectedCards.length; j++) {
                    const id1 = selectedCards[i].id;
                    const id2 = selectedCards[j].id;
                    const found = tarotDB.combos[`${id1}+${id2}`] || tarotDB.combos[`${id2}+${id1}`];
                    if (found && !comboNote) comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; background: rgba(168,85,247,0.1); border-radius:12px;">🔮 <b>Связка:</b> ${found}</div>`;
                }
            }
        }

        let html = "";
        if (selectedCards.length > 0) {
            if (currentMode === 'day' || currentMode === 'birthday') {
                const last = selectedCards[0];
                html = `<div class="fade-in element-card" style="border-left: 4px solid #a855f7; background: rgba(168, 85, 247, 0.05); padding: 15px; border-radius: 5px 15px 15px 5px;"><div style="font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; margin-bottom: 4px;">${last.keywords}</div><div style="color: #fff; font-weight: 900; font-size: 1.1rem; margin-bottom: 8px;">${last.name}</div><p style="font-size: 0.85rem; line-height: 1.4; color: #e2d5f5; margin: 0;">${last.isReversed ? last.advice_rev : last.advice}</p>${personalNote}${comboNote}</div>`;
            } else {
                const counts = {};
                selectedCards.forEach(c => counts[c.element] = (counts[c.element] || 0) + 1);
                const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                const style = elementStyles[dominant] || { color: "#fff", icon: "✨", shadow: "none" };
                html = `<div class="fade-in element-card" style="border: 1px solid ${style.color}; background: rgba(0,0,0,0.3); padding:15px; border-radius:20px;"><div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;"><span style="font-size: 1.8rem;">${style.icon}</span><span style="color: ${style.color}; font-weight: 600; font-size: 1.1rem;">${dominant}</span></div><div style="font-size: 0.9rem; color: #fff;">${tarotDB.elementalAdvice[dominant]}</div>${personalNote}${comboNote}</div>`;
            }
        }
        box.innerHTML = html;

        if (drawnCount >= maxCards && maxCards > 0) {
            document.getElementById('reset-btn').style.display = 'inline-block';
            document.getElementById('donate-btn').style.display = 'inline-block';
            saveToHistory();
        }
    }

    function shuffleAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        const deck = document.querySelector('.deck');
        const rect = deck.getBoundingClientRect();
        
        const drawnIds = selectedCards.map(c => c.id);
        const remainingCards = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
        for (let i = remainingCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingCards[i], remainingCards[j]] = [remainingCards[j], remainingCards[i]];
        }
        window.shuffledRemaining = remainingCards;
        
        deck.style.transform = 'scale(0.95)';
        setTimeout(() => { deck.style.transform = 'scale(1)'; }, 200);
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        
        const cardsCount = Math.min(8, remainingCards.length);
        const tempCards = [];
        for (let i = 0; i < cardsCount; i++) {
            const fc = document.createElement('div');
            fc.className = 'card-anim shuffle-card';
            fc.style.position = 'fixed';
            fc.style.left = rect.left + 'px'; fc.style.top = rect.top + 'px';
            fc.style.width = rect.width + 'px'; fc.style.height = rect.height + 'px';
            fc.innerHTML = '<div class="face back"></div>';
            document.body.appendChild(fc);
            tempCards.push(fc);
        }

        tempCards.forEach((c, index) => {
            setTimeout(() => {
                const angle = (index - cardsCount / 2) * 12;
                c.style.transform = `translate(${Math.sin(angle*Math.PI/180)*60}px, -20px) rotate(${angle}deg)`;
                c.style.opacity = '1';
            }, index * 40);
        });

        setTimeout(() => {
            tempCards.forEach(c => { c.style.transform = 'translate(0,0) rotate(0deg)'; c.style.opacity = '0'; setTimeout(() => c.remove(), 400); });
            isAnimating = false;
        }, 800);
    }

    function createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const p = document.createElement('div'); p.className = 'particle';
            p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = color;
            const a = Math.random() * Math.PI * 2, v = Math.random() * 50 + 20;
            p.style.setProperty('--dx', Math.cos(a) * v); p.style.setProperty('--dy', Math.sin(a) * v);
            document.body.appendChild(p); setTimeout(() => p.remove(), 800);
        }
    }

    function showHistory() {
        const saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        const historyList = document.getElementById('history-list');
        if (saved.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 20px;">📭 Пока нет истории</div>';
        } else {
            historyList.innerHTML = saved.map((item, index) => {
                const date = new Date(item.date).toLocaleString();
                return `<div style="border-bottom: 1px solid rgba(168,85,247,0.2); padding: 12px 0;"><div style="display: flex; justify-content: space-between;"><span style="color: #a855f7; font-weight: bold;">${item.mode}</span><span style="font-size: 0.65rem; opacity: 0.7;">${date}</span></div><div style="margin-top:5px; font-size:0.65rem;">${item.cards.map(c => c.name).join(', ')}</div><button onclick="repeatHistory(${index})" style="margin-top:8px; background:none; border:1px solid #a855f7; color:#a855f7; border-radius:15px; font-size:0.6rem; padding:4px 10px;">Повторить</button></div>`;
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
            if (modalImage) { modalImage.style.backgroundImage = `url('/${card.image}')`; modalImage.style.display = 'block'; }
            if (modalEmoji) modalEmoji.style.display = 'none';
        } else {
            if (modalEmoji) { modalEmoji.innerText = card.emoji; modalEmoji.style.display = 'block'; }
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

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) { resetBtn.onclick = () => { setMode(window.currentMode); }; }

    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) { donateBtn.onclick = () => handleDonate(499); }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'birthday') { setMode('birthday'); } else { setMode('day'); }

})();
