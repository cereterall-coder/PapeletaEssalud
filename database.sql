CREATE DATABASE IF NOT EXISTS papeleta_essalud;
USE papeleta_essalud;

-- Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE,
    area VARCHAR(100) NOT NULL,
    role ENUM('admin', 'trabajador', 'jefe', 'rrhh') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Papeletas
CREATE TABLE papeletas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_papeleta VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    jefe_rrhh_nombre VARCHAR(100) DEFAULT 'JEFE DE RECURSOS HUMANOS',
    
    -- Tipo de Permiso
    tipo_permiso ENUM(
        'atencion_medica', 'onomastico', 'enfermedad_familiar', 'comision_servicio',
        'permiso_dias', 'licencia_judicial', 'capacitacion_oficial', 'permiso_minutos',
        'sindicato', 'capacitacion_no_oficial', 'vacaciones', 'sufragio',
        'descanso_tecnico', 'licencia_paternidad', 'comite'
    ) NOT NULL,
    
    -- Tiempo
    fecha_salida DATETIME NOT NULL,
    fecha_retorno DATETIME NOT NULL,
    total_dias INT DEFAULT 0,
    total_horas INT DEFAULT 0,
    
    -- Otros datos
    lugar_destino VARCHAR(255),
    motivo TEXT,
    archivo_constancia VARCHAR(255),
    
    -- Estados y Firmas
    estado ENUM('pendiente', 'aprobado_jefe', 'aprobado_rrhh', 'rechazado') DEFAULT 'pendiente',
    firma_solicitante_date TIMESTAMP NULL,
    firma_jefe_date TIMESTAMP NULL,
    firma_rrhh_date TIMESTAMP NULL,
    observaciones_rrhh TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Inserción de usuarios iniciales (password: admin123)
-- Nota: En producción las contraseñas deben ser hasheadas con bcrypt.
INSERT INTO users (username, password, full_name, dni, area, role) VALUES 
('admin', '$2b$10$7R.5m5fLp5G0V6D0p5K5u.W5g/y3r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'Administrador del Sistema', '00000000', 'SISTEMAS', 'admin'),
('jefe1', '$2b$10$7R.5m5fLp5G0V6D0p5K5u.W5g/y3r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'Jefe de Area Demo', '11111111', 'ADMINISTRACION', 'jefe'),
('rrhh1', '$2b$10$7R.5m5fLp5G0V6D0p5K5u.W5g/y3r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'Responsable RRHH', '22222222', 'RRHH', 'rrhh'),
('user1', '$2b$10$7R.5m5fLp5G0V6D0p5K5u.W5g/y3r5Y2m5Y2m5Y2m5Y2m5Y2m5Y2m', 'Juan Perez', '33333333', 'CONTABILIDAD', 'trabajador');
