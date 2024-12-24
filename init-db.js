const { MongoClient } = require('mongodb');
const initialData = require('./initial-data.json');

async function initDB() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('swift');
        const collection = db.collection('homework');

        // Очищаем коллекцию
        await collection.deleteMany({});

        // Вставляем начальные данные
        await collection.insertMany(initialData.homework);

        console.log('База данных успешно инициализирована');
    } catch (err) {
        console.error('Ошибка при инициализации базы данных:', err);
    } finally {
        await client.close();
    }
}

// Запускаем инициализацию если скрипт запущен напрямую
if (require.main === module) {
    initDB();
}

module.exports = initDB; 