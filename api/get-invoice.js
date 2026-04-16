export default async function handler(req, res) {
    const BOT_TOKEN = process.env.BOT_TOKEN; // Токен возьмем из настроек Vercel

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: "Поддержка Cosmic Tarot",
            description: "Благодарность за расклад",
            payload: "stars_donate",
            currency: "XTR", // Код для Звезд
            prices: [{ label: "Звезды", amount: 50 }] // 50 звезд
        })
    });

    const data = await response.json();

    if (data.ok) {
        res.status(200).json({ url: data.result });
    } else {
        res.status(500).json({ error: 'Ошибка создания инвойса' });
    }
}
