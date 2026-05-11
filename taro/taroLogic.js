/**
 * COSMIC TAROT: Logic Module
 * Отвечает за: данные, расчеты, LocalStorage, Telegram API
 */

const TaroLogic = {
    state: {
        currentMode: '',
        drawnCount: 0,
        maxCards: 0,
        selectedCards: [],
        shuffledRemaining: null,
        userAccess: {
            isVip: localStorage.getItem('isVip') === 'true',
            hasPaidOnce: localStorage.getItem('paidBirthday') === 'true'
        }
    },

    // Вспомогательные методы
    hasFullAccess() {
        return this.state.userAccess.isVip || this.state.userAccess.hasPaidOnce;
    },

    getDayFromDate(dateStr) {
        if (!dateStr) return null;
        const numbers = dateStr.match(/\d+/g);
        if (!numbers) return null;
        return numbers[0].length === 4 ? parseInt(numbers[2]) : parseInt(numbers[0]);
    },

    // Работа с колодой
    prepareDeck() {
        const drawnIds = this.state.selectedCards.map(c => c.id);
        const remaining = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
        // Тасование Фишера-Йетса
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        this.state.shuffledRemaining = remaining;
        return remaining;
    },

    getNextCard() {
        let cardData;
        if (this.state.shuffledRemaining && this.state.shuffledRemaining.length > 0) {
            cardData = this.state.shuffledRemaining.shift();
        } else {
            const drawnIds = this.state.selectedCards.map(c => c.id);
            const available = tarotDB.cards.filter(c => !drawnIds.includes(c.id));
            cardData = available[Math.floor(Math.random() * available.length)];
        }
        
        const isReversed = Math.random() < 0.25;
        const cardInstance = { ...cardData, isReversed };
        this.state.selectedCards.push(cardInstance);
        this.state.drawnCount++;
        return cardInstance;
    },

    // Логика предиктов и связок
    getInterpretation() {
        const { selectedCards, currentMode } = this.state;
        const lastCard = selectedCards[selectedCards.length - 1];
        const birthDate = localStorage.getItem('userBirthDate');
        const day = this.getDayFromDate(birthDate);

        let personalNote = "";
        let comboNote = "";

        // Поиск связок
        if (selectedCards.length >= 2) {
            for (let i = 0; i < selectedCards.length; i++) {
                for (let j = i + 1; j < selectedCards.length; j++) {
                    const id1 = selectedCards[i].id;
                    const id2 = selectedCards[j].id;
                    const found = tarotDB.combos[`${id1}+${id2}`] || tarotDB.combos[`${id2}+${id1}`];
                    if (found) comboNote = found;
                }
            }
        }

        // VIP Анализ
        let isMasterCard = false;
        if (day && lastCard) {
            isMasterCard = (lastCard.id === day || lastCard.id === (day % 22));
        }

        return {
            lastCard,
            currentMode,
            comboNote,
            personalNote,
            isMasterCard,
            day,
            hasFullAccess: this.hasFullAccess()
        };
    },

    saveHistory() {
        const history = {
            date: new Date().toISOString(),
            mode: this.state.currentMode,
            cards: this.state.selectedCards.map(c => ({ id: c.id, name: c.name, isReversed: c.isReversed }))
        };
        let saved = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
        saved.unshift(history);
        if (saved.length > 10) saved.pop();
        localStorage.setItem('tarotHistory', JSON.stringify(saved));
    }
};
