require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware ss
app.use(cors());
app.use(express.json());
app.use(express.static('www'));

// In-memory storage
let DB = {
    homework: [
        {
            "subject": "Математика",
            "text": "тест",
            "dueDate": "20 марта",
            "important": true
        },
        {
            "subject": "Русский язык",
            "text": "упр 356",
            "dueDate": "21 марта",
            "important": false
        },
        {
            "subject": "История",
            "text": "• Прочитать параграф 23\n• Ответить на вопросы\n• Подготовить доклад",
            "dueDate": "22 марта",
            "important": true
        },
        {
            "subject": "Физика",
            "text": "• Выучить формулы по теме 'Электричество'\n• Решить задачи из сборника\n• Подготовить лабораторную работу",
            "dueDate": "23 марта",
            "important": true
        }
    ]
};

// Создаем бота без polling
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Добавим хранение состояний пользователей
const userStates = {};

// API endpoints
app.get('/api/homework', (req, res) => {
    res.json(DB.homework);
});

// Webhook endpoint для Telegram
app.post('/bot', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.sendStatus(200);

        const chatId = message.chat.id;
        const text = message.text;

        // Обработка команд
        if (text === '/start') {
            await bot.sendMessage(chatId, 
                'Привет! Я бот для управления домашними заданиями.\n' +
                'Используйте следующие команды:\n' +
                '/homework - посмотреть все домашние задания\n' +
                '/edit - изменить домашнее задание'
            );
        }
        else if (text === '/homework') {
            let message = 'Текущие домашние задания:\n\n';
            DB.homework.forEach((hw, index) => {
                message += `${index + 1}. ${hw.subject}\n${hw.text}\nДо: ${hw.dueDate}\n\n`;
            });
            await bot.sendMessage(chatId, message);
        }
        else if (text === '/edit') {
            const keyboard = DB.homework.map((hw) => ([
                { text: hw.subject }
            ]));
            userStates[chatId] = { state: 'SELECTING_SUBJECT' };
            await bot.sendMessage(chatId, 'Выберите предмет для редактирования:', {
                reply_markup: {
                    keyboard,
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
        }
        // Обработка состояний
        else if (userStates[chatId]) {
            switch (userStates[chatId].state) {
                case 'SELECTING_SUBJECT':
                    userStates[chatId] = {
                        state: 'ENTERING_TEXT',
                        subject: text
                    };
                    await bot.sendMessage(chatId, 
                        'Введите новый текст домашнего задания:',
                        { reply_markup: { remove_keyboard: true } }
                    );
                    break;
                    
                case 'ENTERING_TEXT':
                    const homeworkIndex = DB.homework.findIndex(
                        hw => hw.subject === userStates[chatId].subject
                    );
                    
                    if (homeworkIndex !== -1) {
                        DB.homework[homeworkIndex].text = text;
                        await bot.sendMessage(chatId, 'Домашнее задание успешно обновлено!');
                    }
                    
                    delete userStates[chatId];
                    break;
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    const VERCEL_URL = 'https://swift-server-red.vercel.app';
    const webhookUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${VERCEL_URL}/bot`;
    
    console.log('Setting webhook:', webhookUrl);
    fetch(webhookUrl)
        .then(res => res.json())
        .then(data => console.log('Webhook response:', data))
        .catch(err => console.error('Webhook error:', err));
}); 
