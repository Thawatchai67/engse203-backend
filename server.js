// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // << Import helmet
const Joi = require('joi'); // << Import Joi
require('dotenv').config(); // << เพิ่มบรรทัดนี้ที่ด้านบน

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3000; // << อ่านค่า PORT จาก .env
const APP_NAME = process.env.APP_NAME || "MyApp"; // << สำคัญ! ต้องมี middleware นี้เพื่ออ่าน JSON body

app.use(cors());
app.use(helmet()); // << เพิ่มบรรทัดนี้: ใส่เกราะป้องกัน!
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<h1>Hello from ${APP_NAME}!</h1>`);
});

app.get('/api/data', (req, res) => {
  res.json({ message: 'This data is open for everyone!' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'Use POST method to create a new user' });
});

// สร้าง Schema สำหรับตรวจสอบข้อมูล user
const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required(),
    birth_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required()
});

// Route สำหรับสร้าง user
app.post('/api/users', (req, res) => {
    console.log("POST /api/users called");
    console.log("req.body:", req.body);

    const { error, value } = userSchema.validate(req.body);

    if (error) {
        console.log("Validation error:", error.details);
        // ถ้าข้อมูลไม่ถูกต้อง ส่ง 400 Bad Request กลับไปพร้อมรายละเอียด
        return res.status(400).json({ message: 'Invalid data', details: error.details });
    }

    // ถ้าข้อมูลถูกต้อง
    console.log('Validated data:', value);
    res.status(201).json({ message: 'User created successfully!', data: value });

    
});
//...

const server = http.createServer(app); 
const io = new Server(server, {  
    cors: { origin: "*" } 
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // รับข้อความ chat message จาก client
    socket.on('chat message', (msg) => {
        console.log('message:', msg);
        io.emit('chat message', `[${socket.id} says]: ${msg}`); // ส่งกลับทุก client
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
  console.log(`🚀 ${APP_NAME} with WebSocket running on http://localhost:${PORT}`);
});

