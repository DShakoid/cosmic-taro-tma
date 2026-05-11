// taroLogic.js
export const TaroLogic = {
    // Парсинг дня рождения
    getDayFromDate(dateStr) {
        if (!dateStr) return null;
        const numbers = dateStr.match(/\d+/g);
        if (!numbers) return null;
        return numbers[0].length === 4 ? parseInt(numbers[2]) : parseInt(numbers[0]);
    },

    // Выбор случайной карты (с учетом уже вытянутых)
    getRandomCard(tarotDB, excludedIds = [], forcedRemaining = null) {
        if (forcedRemaining && forcedRemaining.length > 0) {
            return forcedRemaining.shift();
        }
        const available = tarotDB.cards.filter(c => !excludedIds.includes(c.id));
        return available[Math.floor(Math.random() * available.length)];
    },

    // Проверка на совпадение с картой рождения (Мастер-карта)
    checkMasterCard(cardId, birthDate) {
        const day = this.getDayFromDate(birthDate);
        if (!day) return false;
        return cardId === day || cardId === (day % 22);
    },

    // Поиск связок (комбо) между картами
    findCombos(selectedCards, tarotDB) {
        if (selectedCards.length < 2) return null;
        for (let i = 0; i < selectedCards.length; i++) {
            for (let j = i + 1; j < selectedCards.length; j++) {
                const id1 = selectedCards[i].id;
                const id2 = selectedCards[j].id;
                const found = tarotDB.combos[`${id1}+${id2}`] || tarotDB.combos[`${id2}+${id1}`];
                if (found) return found;
            }
        }
        return null;
    }
};
