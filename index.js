const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 1. HiveMQ 連線資訊 ---
const MQTT_URL = 'mqtts://f17a8164c5cb466da01ab155fdc041cf.s1.eu.hivemq.cloud:8883'; 
const MQTT_USER = 'ag-4320';
const MQTT_PASS = 'Jason5238137';

const mqttClient = mqtt.connect(MQTT_URL, {
    username: MQTT_USER,
    password: MQTT_PASS,
    rejectUnauthorized: false 
});

mqttClient.on('connect', () => {
    console.log('✅ 已連線至 HiveMQ 雲端');
    // 修改處：訂閱包含所有感測數據的主題
    mqttClient.subscribe('esp32/garden/all'); 
});

mqttClient.on('message', (topic, message) => {
    // 將 ESP32 傳來的 JSON 字串轉發給網頁
    io.emit('mqtt_data', message.toString()); 
});

// --- 2. 接收網頁指令並轉傳給 ESP32 ---
io.on('connection', (socket) => {
    socket.on('control_valve', (command) => {
        console.log("轉發控制指令:", command);
        // 修改處：發送到 ESP32 訂閱的控制主題
        mqttClient.publish('esp32/control', command); 
    });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', '首頁.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('🚀 伺服器運行中 Port:', PORT));
