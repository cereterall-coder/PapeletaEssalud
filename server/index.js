const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;
const DATA_DIR = path.join(__dirname, '../data');

// Asegurar que la carpeta de datos exista
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para GUARDAR datos por DNI
app.post('/api/save', (req, res) => {
    const data = req.body;
    if (!data.dni) return res.status(400).json({ error: 'El DNI es obligatorio' });

    const filePath = path.join(DATA_DIR, `${data.dni}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ message: 'Datos guardados en archivo plano' });
});

// Ruta para CARGAR datos por DNI
app.get('/api/load/:dni', (req, res) => {
    const filePath = path.join(DATA_DIR, `${req.params.dni}.json`);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        res.json(JSON.parse(data));
    } else {
        res.status(404).json({ error: 'No se encontraron datos previos' });
    }
});

const JEFES_FILE = path.join(DATA_DIR, 'jefes_rrhh.json');

// Ruta para obtener la lista de jefes
app.get('/api/jefes', (req, res) => {
    if (fs.existsSync(JEFES_FILE)) {
        res.json(JSON.parse(fs.readFileSync(JEFES_FILE)));
    } else {
        res.json(["Juan Carlos Ramirez Grau - Gerencia", "Amaro Vilela - IPRESS"]);
    }
});

// Ruta para guardar la lista de jefes con validación de clave dinámica
app.post('/api/jefes', (req, res) => {
    const { password, jefes } = req.body;
    
    // Generar clave dinámica: 02855470 + DD + MM
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const expectedKey = `02855470${dd}${mm}`;

    if (password !== expectedKey) {
        return res.status(401).json({ error: 'Clave dinámica incorrecta' });
    }

    try {
        fs.writeFileSync(JEFES_FILE, JSON.stringify(jefes, null, 2));
        res.json({ message: 'Lista de jefes actualizada correctamente' });
    } catch (e) {
        res.status(500).json({ error: 'Error al guardar el archivo' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sistema Simplificado corriendo en http://localhost:${PORT}`);
    console.log(`📁 Los datos se guardan en: ${DATA_DIR}`);
});
