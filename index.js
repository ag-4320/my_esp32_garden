const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 1. HiveMQ 連線資訊 (保持不變) ---
const MQTT_URL = 'mqtts://f17a8164c5cb466da01ab155fdc041cf.s1.eu.hivemq.cloud:8883'; 
const MQTT_USER = 'ag-4320';
const MQTT_PASS = 'Jason5238137';

// --- 2. 連接到 HiveMQ ---
const mqttClient = mqtt.connect(MQTT_URL, {
    username: MQTT_USER,
    password: MQTT_PASS,
    rejectUnauthorized: false // 確保在雲端環境連線更穩定
});

mqttClient.on('connect', () => {
    console.log('✅ 成功連線到 HiveMQ！');
    // 修改訂閱主題：與 ESP32 的發送主題對齊
    mqttClient.subscribe('esp32/garden/all'); 
});

mqttClient.on('message', (topic, message) => {
    const value = message.toString();
    console.log(`[${topic}] 收到數據:`, value);
    // 透過 Socket.io 把 JSON 字串直接傳給前端網頁
    io.emit('mqtt_data', value); 
});

// --- 3. 新增：處理從網頁傳來的控制指令 ---
io.on('connection', (socket) => {
    console.log('🌐 網頁使用者已連線');

    // 當網頁按下「開啟/關閉水閥」按鈕時
    socket.on('control_valve', (command) => {
        console.log("收到網頁指令，準備發送至 ESP32:", command);
        // 將指令 (on/off) 發布到 MQTT，ESP32 會訂閱這個主題
        mqttClient.publish('esp32/control', command);
    });
});

// --- 4. 設定靜態檔案路徑與路由 ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. 啟動伺服器 ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🚀 伺服器已啟動，監聽 Port:', PORT);
});
