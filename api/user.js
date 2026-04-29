// Примерная логика для /api/get-user
export default async function handler(req, res) {
    const { userId } = req.query;
    // 1. Идем в Postgres
    // 2. SELECT * FROM users WHERE telegram_id = userId
    // 3. Возвращаем JSON
}
