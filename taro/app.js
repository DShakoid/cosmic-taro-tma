(async function initTaro() {
    // 1. Фикс загрузки данных: проверяем tarotDB (у тебя в коде tarotDB, а не tarotCards)
    if (typeof tarotDB === 'undefined') {
        const script = document.createElement('script');
        script.src = '/taro/tarotData.js';
        await new Promise((resolve) => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    // 2. Инициализация Telegram и фикс навигации
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#050508');
        tg.setBackgroundColor('#050508');
    }

    // --- ТВОЙ ОСТАЛЬНОЙ КОД БЕЗ ВЫРЕЗАНИЯ ЛОГИКИ ---

    let currentMode = '';
    let drawnCount = 0;
    let maxCards = 0;
    let selectedCards = [];
    let isAnimating = false;

    // Проброс функций в window, чтобы они были видны из HTML (onclick)
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

    function preloadImages() {
        const images = ['/taro/assets/back_card.jpg'];
        images.forEach(src => { const img = new Image(); img.src = src; });
    }
    preloadImages();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.log);
    }

    function generateBirthdayPrediction(date) {
        const day = date.split('-')[2];
        const box = document.getElementById('prediction-text');
        if (box) {
            box.innerHTML = `<h3>Ваш личный прогноз</h3><p>Для рожденных ${day}-го числа звезды подготовили особый совет. Тяните карту...</p>`;
        }
    }

    // Вместо window.onload используем немедленный запуск, так как мы внутри async IIFE
    const params = new URLSearchParams(window.location.search);
    setMode('day');
    if (params.get('mode') === 'birthday') {
        const date = localStorage.getItem('userBirthDate');
        if (date) generateBirthdayPrediction(date);
    }

    function setMode(newMode) {
        if (isAnimating) return;
        currentMode = newMode;
        drawnCount = 0;
        selectedCards = [];
        window.shuffledRemaining = null;
        // И если у тебя есть лейбл с остатком карт под колодой, его тоже чистим:
        const boxLabel = document.getElementById('deck-label');
        if (boxLabel) boxLabel.innerHTML = '';
        const table = document.getElementById('table');
        if (!table) return;
        table.innerHTML = '';
        document.querySelectorAll('.card-anim').forEach(c => c.remove());
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('btn-' + newMode);
        if (activeBtn) activeBtn.classList.add('active');
        document.getElementById('reset-btn').style.display = 'none';
        document.getElementById('donate-btn').style.display = 'none';
        
        // Твоя оригинальная логика раскладов
        if (newMode === 'day') { createRow(0, 1, true); maxCards = 1; }
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
        if (box && !box.innerHTML.includes('Ваш личный прогноз')) {
            box.innerHTML = "Колода перемешана. Тяните карту.";
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
        const isLargeSlot = slot.classList.contains('large');
        card.style.position = 'fixed';
        card.style.zIndex = '1000';
        card.style.left = deckRect.left + 'px';
        card.style.top = deckRect.top + 'px';
        card.style.width = deckRect.width + 'px';
        card.style.height = deckRect.height + 'px';
        card.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        card.innerHTML = `
            <div class="face back"></div>
            <div class="face front">
                <div class="card-emoji" style="transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);">${cardData.emoji}</div>
                <div class="card-name" style="transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);">${cardData.name}</div>
                ${isReversed ? '<div style="font-size: 6px; color: #ff4d4d; position: absolute; bottom: 5px; width:100%; text-align:center;">ПЕРЕВЕРНУТА</div>' : ''}
            </div>
        `;
        document.body.appendChild(card);
        updatePrediction();
        requestAnimationFrame(() => {
            card.style.left = slotRect.left + 'px';
            card.style.top = slotRect.top + 'px';
            card.style.width = slotRect.width + 'px';
            card.style.height = slotRect.height + 'px';
            if (isLargeSlot) {
                const emoji = card.querySelector('.card-emoji');
                const name = card.querySelector('.card-name');
                emoji.style.transform = 'scale(1.4)';
                name.style.transform = 'scale(1.2)';
            }
            if (isReversed) card.classList.add('is-reversed');
            card.classList.add('flipped');
        });
        setTimeout(() => {
            slot.appendChild(card);
            card.style.position = 'absolute';
            card.style.left = '0'; card.style.top = '0'; card.style.width = '100%'; card.style.height = '100%';
            card.style.margin = '0';
            if (isLargeSlot) {
                const emoji = card.querySelector('.card-emoji');
                const name = card.querySelector('.card-name');
                emoji.style.transform = 'scale(1.4)';
                name.style.transform = 'scale(1.2)';
            }
            card.classList.add('arrived');
            card.onclick = () => showModal(cardInstance);
            createParticles(slotRect.left + slotRect.width / 2, slotRect.top + slotRect.height / 2, '#ec4899');
            const nextSlot = document.getElementById('slot' + drawnCount);
            if (nextSlot) nextSlot.classList.add('active-target');
            isAnimating = false;
        }, 800);
    }

    // --- Дальше вся твоя логика комбо, истории и прочего без изменений ---
    function updatePrediction() {
        const box = document.getElementById('prediction-text');
        if (!box) return;

        // Расширенные стили для визуала стихий
        const elementStyles = { 
            "Огонь": { color: "#ff4d4d", icon: "🔥", shadow: "rgba(255, 77, 77, 0.4)" }, 
            "Вода": { color: "#4db8ff", icon: "💧", shadow: "rgba(77, 184, 255, 0.4)" }, 
            "Воздух": { color: "#ffcc00", icon: "🌪️", shadow: "rgba(255, 204, 0, 0.4)" }, 
            "Земля": { color: "#4dff88", icon: "🌿", shadow: "rgba(77, 255, 136, 0.4)" } 
        };

        const birthDate = localStorage.getItem('userBirthDate');
        let personalNote = "";
        let comboNote = "";

        // 1. Логика персональной связи (День рождения)
        if (birthDate) {
            const day = parseInt(birthDate.split('-')[2]);
            const lastCard = selectedCards[selectedCards.length - 1];
            if (lastCard) {
                if (lastCard.id === day || lastCard.id === (day % 22)) {
                    personalNote = `<div style="margin-top:10px; padding:10px; border:1px solid gold; background: rgba(255,215,0,0.1); border-radius:12px; color: gold; font-size: 0.75rem;">✨ <b>Мистическая связь:</b> Эта карта — ваш личный покровитель.</div>`;
                } else {
                    personalNote = `<div style="margin-top:10px; font-style: italic; opacity: 0.8; font-size: 0.7rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">🎯 Для рожденных ${day}-го числа...</div>`;
                }
            }
        }
        
        // 2. Логика комбо (Парные, Тройные, Дни недели, Время, Специальные)
        if (selectedCards.length >= 2) {
            // Парные связки
            for (let i = 0; i < selectedCards.length; i++) {
                for (let j = i + 1; j < selectedCards.length; j++) {
                    const id1 = selectedCards[i].id;
                    const id2 = selectedCards[j].id;
                    const found = tarotDB.combos[`${id1}+${id2}`] || tarotDB.combos[`${id2}+${id1}`];
                    if (found && !comboNote) comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; background: rgba(168,85,247,0.1); border-radius:12px;">🔮 <b>Связка:</b> ${found}</div>`;
                }
            }

            // Тройные связки
            if (selectedCards.length >= 3 && !comboNote) {
                const ids = selectedCards.map(c => c.id).sort();
                for (let i = 0; i < ids.length - 2; i++) {
                    for (let j = i + 1; j < ids.length - 1; j++) {
                        for (let k = j + 1; k < ids.length; k++) {
                            const tripleKey = `${ids[i]}+${ids[j]}+${ids[k]}`;
                            const tripleFound = tarotDB.combos[tripleKey];
                            if (tripleFound && !comboNote) {
                                comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; background: rgba(168,85,247,0.1); border-radius:12px;">🔮 <b>Тройная связка:</b> ${tripleFound}</div>`;
                                break;
                            }
                        }
                        if (comboNote) break;
                    }
                    if (comboNote) break;
                }
            }

            // День недели
            if (!comboNote) {
                const dayOfWeek = new Date().getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayKey = dayNames[dayOfWeek];
                for (let card of selectedCards) {
                    const dayCombo = tarotDB.combos[`${dayKey}+${card.id}`];
                    if (dayCombo) { 
                        comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; background: rgba(168,85,247,0.1); border-radius:12px;">📅 <b>День недели:</b> ${dayCombo}</div>`; 
                        break; 
                    }
                }
            }

            // День рождения (комбо)
            if (!comboNote && birthDate) {
                for (let card of selectedCards) {
                    const birthdayCombo = tarotDB.combos[`birthday+${card.id}`];
                    if (birthdayCombo) { 
                        comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid gold; background: rgba(255,215,0,0.1); border-radius:12px;">🎂 <b>День рождения:</b> ${birthdayCombo}</div>`; 
                        break; 
                    }
                }
            }

            // Магический час
            if (!comboNote) {
                const hour = new Date().getHours();
                let timeKey = '';
                if (hour >= 23 || hour <= 3) timeKey = 'midnight';
                else if (hour >= 5 && hour <= 8) timeKey = 'morning';
                else if (hour >= 12 && hour <= 14) timeKey = 'noon';
                if (timeKey) {
                    for (let card of selectedCards) {
                        const timeCombo = tarotDB.combos[`${timeKey}+${card.id}`];
                        if (timeCombo) { 
                            comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #a855f7; background: rgba(168,85,247,0.1); border-radius:12px;">⏰ <b>Магический час:</b> ${timeCombo}</div>`; 
                            break; 
                        }
                    }
                }
            }

            // Специальные комбо из БД
            if (!comboNote) {
                for (let special of tarotDB.specialCombos) {
                    if (special.check(selectedCards, currentMode, new Date())) {
                        comboNote = `<div style="margin-top:10px; padding:10px; border:1px solid #ec4899; background: rgba(236,72,153,0.1); border-radius:12px;">✨ <b>${special.name}:</b> ${special.text}</div>`;
                        break;
                    }
                }
            }
        }

        // 3. Сборка финального HTML (Визуал)
        let html = "";
        if (selectedCards.length > 0) {
            if (currentMode === 'day') {
                const last = selectedCards[0];
                html = `
                    <div class="fade-in element-card" style="border-left: 4px solid #a855f7; background: rgba(168, 85, 247, 0.05); text-align: left;">
                        <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; margin-bottom: 4px;">${last.keywords}</div>
                        <div style="color: #fff; font-weight: 900; font-size: 1.1rem; margin-bottom: 8px;">${last.name}</div>
                        <p style="font-size: 0.85rem; line-height: 1.4; color: #e2d5f5; margin: 0;">${last.isReversed ? last.advice_rev : last.advice}</p>
                        ${personalNote}
                        ${comboNote}
                    </div>`;
            } else {
                const counts = {};
                selectedCards.forEach(c => counts[c.element] = (counts[c.element] || 0) + 1);
                const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                const style = elementStyles[dominant] || { color: "#fff", icon: "✨", shadow: "none" };

                html = `
                    <div class="fade-in element-card" style="border: 1px solid ${style.color}; background: rgba(0,0,0,0.3); box-shadow: 0 0 20px ${style.shadow};padding:8px;border-radius:20px;margin-bottom: 30px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px;">
                            <span style="font-size: 1.8rem; filter: drop-shadow(0 0 5px ${style.color});">${style.icon}</span>
                            <span style="color: ${style.color}; font-weight: 600; letter-spacing: 1px; /*text-transform: uppercase; */ font-size: 1.1rem;">${dominant}</span>
                        </div>
                        <div style="font-size: 0.9rem; line-height: 1.4; color: #fff;">
                            ${tarotDB.elementalAdvice[dominant]}
                        </div>
                        ${personalNote}
                        ${comboNote}
                    </div>`;
            }
        }
        
        box.innerHTML = html;

        // 4. Кнопки и история
        if (drawnCount >= maxCards && maxCards > 0) {
            const rBtn = document.getElementById('reset-btn');
            if (rBtn) {
                rBtn.style.display = 'inline-block';
                rBtn.onclick = () => window.setMode(currentMode); 
            }

            const dBtn = document.getElementById('donate-btn');
            if (dBtn) {
                dBtn.style.display = 'inline-block';
                dBtn.onclick = () => window.handleDonate(500); 
            }
            
            saveToHistory();
        }
    }

    
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
            historyList.innerHTML = '<div style="text-align: center; padding: 20px;">📭 Пока нет сохранённых раскладов</div>';
        } else {
            let html = '';
            saved.forEach((item, index) => {
                const date = new Date(item.date).toLocaleString();
                const modeName = { day: 'День', week: 'Неделя', advice: 'Совет' }[item.mode] || item.mode;
                html += `<div style="border-bottom: 1px solid rgba(168,85,247,0.2); padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #a855f7; font-weight: bold;">${modeName}</span>
                        <span style="font-size: 0.65rem; opacity: 0.7;">${date}</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${item.cards.map(card => `<span style="background: rgba(168,85,247,0.2); padding: 2px 8px; border-radius: 15px; font-size: 0.65rem;">${card.name} ${card.isReversed ? '🔄' : ''}</span>`).join('')}
                    </div>
                    <button onclick="repeatHistory(${index})" style="margin-top: 8px; background: none; border: 1px solid #a855f7; color: #a855f7; padding: 4px 12px; border-radius: 15px; font-size: 0.6rem; cursor: pointer;">🔮 Повторить</button>
                </div>`;
            });
            historyList.innerHTML = html;
        }
        document.getElementById('history-modal').style.display = 'flex';
        document.getElementById('history-modal').classList.add('active');
    }

    function closeHistoryModal() {
        document.getElementById('history-modal').classList.remove('active');
        setTimeout(() => { document.getElementById('history-modal').style.display = 'none'; }, 300);
    }

    function clearHistory() {
        if (confirm('Очистить историю?')) { localStorage.removeItem('tarotHistory'); showHistory(); }
    }

    function repeatHistory(index) {
        const saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        const item = saved[index];
        if (item) { setMode(item.mode); closeHistoryModal(); }
    }

    function showInfo() {
        document.getElementById('info-modal').style.display = 'flex';
        document.getElementById('info-modal').classList.add('active');
    }

    function closeInfoModal() {
        document.getElementById('info-modal').classList.remove('active');
        setTimeout(() => { document.getElementById('info-modal').style.display = 'none'; }, 300);
    }

    function shareApp() {
        const url = 'https://t.me/Cosmic_taro_rich_bot/cosmictaro';
        if (tg?.showShareButton) tg.showShareButton(url); else alert('Ссылка: ' + url);
    }

    function shuffleAnimation() {
        if (isAnimating) return;
        isAnimating = true; // Блокируем клики на время анимации
        
        const deck = document.querySelector('.deck');
        const rect = deck.getBoundingClientRect();
        const drawnIds = selectedCards.map(c => c.id);
        const remainingCards = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
        
        // Перемешивание массива
        for (let i = remainingCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingCards[i], remainingCards[j]] = [remainingCards[j], remainingCards[i]];
        }
        window.shuffledRemaining = remainingCards;
        
        deck.style.transform = 'scale(0.95)';
        setTimeout(() => { deck.style.transform = 'scale(1)'; }, 200);
        
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        
        const cardsCount = Math.min(8, remainingCards.length);
        const cards = [];
        for (let i = 0; i < cardsCount; i++) {
            const fakeCard = document.createElement('div');
            fakeCard.className = 'card-anim shuffle-card';
            fakeCard.style.position = 'fixed';
            fakeCard.style.left = rect.left + 'px'; 
            fakeCard.style.top = rect.top + 'px';
            fakeCard.style.width = rect.width + 'px'; 
            fakeCard.style.height = rect.height + 'px';
            fakeCard.innerHTML = '<div class="face back"></div>';
            document.body.appendChild(fakeCard);
            cards.push(fakeCard);
        }

        cards.forEach((card, index) => {
            setTimeout(() => {
                const angle = (index - cardsCount / 2) * 12;
                card.style.transform = `translate(${Math.sin(angle*Math.PI/180)*60}px, -20px) rotate(${angle}deg)`;
                card.style.opacity = '1';
            }, index * 40);
        });

        // Внутри финального setTimeout функции shuffleAnimation:
        setTimeout(() => {
            createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#a855f7');
            
            cards.forEach(c => { 
                c.style.transform = 'translate(0,0) rotate(0deg)'; 
                c.style.opacity = '0'; 
                setTimeout(() => c.remove(), 400);
            });

            const box = document.getElementById('deck-label');
            if (box) {
                const remainingCount = remainingCards.length;
                // Показываем надпись
                box.innerHTML = `<div class="fade-in">🃏 Колода перемешана! ✨<br>Осталось ${remainingCount} карт.</div>`;
                
                // Через 2 секунды ПРОСТО ОЧИЩАЕМ ЭТОТ БЛОК
                setTimeout(() => { 
                    box.innerHTML = ''; // Убираем текст совсем
                    // Или можно вернуть стандартную надпись, если она там была:
                    // box.innerHTML = 'Колода';
                }, 2000);
            }

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

    function showModal(card) {
        document.getElementById('m-emoji').innerText = card.emoji;
        document.getElementById('m-name').innerText = card.name + (card.isReversed ? ' (пер.)' : '');
        document.getElementById('m-desc').innerHTML = card.isReversed ? card.advice_rev : card.advice;
        document.getElementById('card-overlay').classList.add('active');
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }

    function closeModal() { document.getElementById('card-overlay').classList.remove('active'); }

    document.getElementById('donate-btn').onclick = async function() {
        try {
            const res = await fetch('/api/get-invoice');
            const data = await res.json();
            if (tg && data.url) tg.openInvoice(data.url, (s) => { if(s==='paid') tg.showAlert('✨'); });
        } catch (e) { if(tg) tg.showAlert('Ошибка'); }
    };

})();
