const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'assets');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

app.use(express.static(__dirname));
app.use(express.json());

app.post('/upload', upload.single('image'), (req, res) => {
    res.json({ filename: req.file.filename, path: '/assets/' + req.file.filename });
});

app.post('/delete', (req, res) => {
    const filepath = path.join(uploadDir, req.body.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));