// Убираем export, чтобы объект был доступен глобально через <script>
const TaroLogic = {
    // Парсинг дня рождения
    getDayFromDate(dateStr) {
        if (!dateStr) return null;
        const numbers = dateStr.match(/\d+/g);
        if (!numbers || numbers.length === 0) return null;
        // Если формат YYYY-MM-DD, берем DD (индекс 2), иначе берем первый найденный блок цифр
        const day = numbers[0].length === 4 ? parseInt(numbers[2]) : parseInt(numbers[0]);
        return isNaN(day) ? null : day;
    },

    // Выбор случайной карты
    getRandomCard(tarotDB, excludedIds = [], forcedRemaining = null) {
        // Если есть заранее перемешанная колода, берем первую карту и удаляем её из массива
        if (forcedRemaining && Array.isArray(forcedRemaining) && forcedRemaining.length > 0) {
            return forcedRemaining.shift();
        }
        
        if (!tarotDB || !tarotDB.cards) return null;

        // Фильтруем карты, которых еще нет на столе
        const available = tarotDB.cards.filter(c => !excludedIds.includes(c.id));
        
        // Защита: если карты закончились (маловероятно для Таро, но всё же)
        if (available.length === 0) return tarotDB.cards[0]; 

        return available[Math.floor(Math.random() * available.length)];
    },

    // Проверка на Мастер-карту
    checkMasterCard(cardId, birthDate) {
        const day = this.getDayFromDate(birthDate);
        if (!day) return false;
        // Логика Таро: если день > 22, обычно вычитают 22 или приводят к нумерологическому аркану
        return cardId === day || cardId === (day % 22);
    },

    // Поиск связок
    findCombos(selectedCards, tarotDB) {
        if (!selectedCards || selectedCards.length < 2 || !tarotDB.combos) return null;
        
        for (let i = 0; i < selectedCards.length; i++) {
            for (let j = i + 1; j < selectedCards.length; j++) {
                const id1 = selectedCards[i].id;
                const id2 = selectedCards[j].id;
                
                // Проверяем оба варианта ключа (1+2 или 2+1)
                const combo = tarotDB.combos[`${id1}+${id2}`] || tarotDB.combos[`${id2}+${id1}`];
                if (combo) return combo;
            }
        }
        return null;
    }
};
