const API_URL = 'http://' + window.location.hostname + ':3000/api';
let currentUser = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const navUserName = document.getElementById('nav-user-name');
const navUserRole = document.getElementById('nav-user-role');
const logoutBtn = document.getElementById('logout-btn');
const sidebarItems = document.querySelectorAll('.nav-menu li');
const views = document.querySelectorAll('.content-view');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(user => {
                if (user.error) throw new Error();
                currentUser = user;
                showApp();
            })
            .catch(() => {
                localStorage.removeItem('token');
                showLogin();
            });
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.style.display = 'flex';
    appScreen.style.display = 'none';
}

function showApp() {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'flex';
    navUserName.textContent = currentUser.full_name;
    navUserRole.textContent = currentUser.role.toUpperCase();
    document.getElementById('dash-user-name').textContent = currentUser.full_name;

    if (currentUser.role === 'admin') {
        document.getElementById('menu-admin').style.display = 'block';
    }

    loadDashboardStats();
    loadPapeletas();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) {
            loginError.textContent = data.error;
        } else {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            // Necesitamos los datos completos (DNI, Area) que el login devuelve
            checkAuth(); // Refrescamos para tener el objeto user completo
        }
    } catch (err) {
        loginError.textContent = 'Error al conectar con el servidor';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    location.reload();
});

// Navigation
function setupNavigation() {
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.getAttribute('data-view');
            switchView(viewId);
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchView(viewId) {
    views.forEach(v => v.style.display = 'none');
    document.getElementById(`view-${viewId}`).style.display = 'block';

    if (viewId === 'historial') loadPapeletas();
    if (viewId === 'dashboard') loadDashboardStats();
}

// Form Submission
const papeletaForm = document.getElementById('papeleta-form');
papeletaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();

    const tipo = document.querySelector('input[name="tipo_permiso"]:checked').value;
    formData.append('tipo_permiso', tipo);
    formData.append('fecha_salida', document.getElementById('fecha_salida').value);
    formData.append('fecha_retorno', document.getElementById('fecha_retorno').value);
    formData.append('lugar_destino', document.getElementById('lugar_destino').value);
    formData.append('motivo', document.getElementById('motivo').value);

    const fileInput = document.getElementById('archivo');
    if (fileInput.files[0]) formData.append('archivo', fileInput.files[0]);

    // Calcular horas/días (simplificado)
    const start = new Date(document.getElementById('fecha_salida').value);
    const end = new Date(document.getElementById('fecha_retorno').value);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    formData.append('total_horas', diffHrs);
    formData.append('total_dias', Math.floor(diffHrs / 24));

    try {
        const res = await fetch(`${API_URL}/papeletas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else {
            alert('Papeleta registrada correctamente: ' + data.codigo);
            papeletaForm.reset();
            switchView('historial');
        }
    } catch (err) {
        alert('Error al enviar');
    }
});

// Load Data
async function loadPapeletas() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/papeletas`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    renderTable(data, 'history-table');
    renderTable(data.slice(0, 5), 'recent-table');
}

async function loadDashboardStats() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/papeletas`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const pending = data.filter(p => p.estado === 'pendiente').length;
    const approved = data.filter(p => p.estado === 'aprobado_rrhh').length;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
}

function renderTable(data, tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    data.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.codigo_papeleta}</td>
            <td>${currentUser.role === 'trabajador' ? '' : '<b>' + p.full_name + '</b><br>'}${new Date(p.created_at).toLocaleDateString()}</td>
            <td>${p.tipo_permiso.replace(/_/g, ' ')}</td>
            <td>Out: ${new Date(p.fecha_salida).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })}<br>In: ${new Date(p.fecha_retorno).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
            <td><span class="st-${p.estado}">${p.estado.replace(/_/g, ' ')}</span></td>
            <td><button class="btn-primary btn-sm" onclick="viewPapeleta(${p.id})">Ver / Imprimir</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal & Print
window.viewPapeleta = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/papeletas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const p = await res.json();

    renderPrintable(p);
    document.getElementById('modal-papeleta').style.display = 'block';

    // Acciones de aprobación
    const approvalBox = document.getElementById('approval-actions');
    if ((currentUser.role === 'jefe' && p.estado === 'pendiente') ||
        (currentUser.role === 'rrhh' && p.estado === 'aprobado_jefe')) {
        approvalBox.style.display = 'block';
        document.getElementById('btn-approve').onclick = () => updateStatus(id, currentUser.role === 'jefe' ? 'aprobado_jefe' : 'aprobado_rrhh');
        document.getElementById('btn-reject').onclick = () => updateStatus(id, 'rechazado');
    } else {
        approvalBox.style.display = 'none';
    }
};

async function updateStatus(id, estado) {
    const token = localStorage.getItem('token');
    const observaciones = document.getElementById('obs-rrhh').value;
    const res = await fetch(`${API_URL}/papeletas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado, observaciones })
    });
    if (res.ok) {
        alert('Estado actualizado');
        document.getElementById('modal-papeleta').style.display = 'none';
        loadPapeletas();
    }
}

function renderPrintable(p) {
    const container = document.getElementById('papeleta-render-preview');
    const printContainer = document.getElementById('print-sheet');

    const types = [
        'atencion_medica', 'onomastico', 'enfermedad_familiar', 'comision_servicio',
        'permiso_dias', 'licencia_judicial', 'capacitacion_oficial', 'permiso_minutos',
        'sindicato', 'capacitacion_no_oficial', 'vacaciones', 'sufragio',
        'descanso_tecnico', 'licencia_paternidad', 'comite'
    ];

    const html = `
        <div class="print-header">
            <h1>PAPELETA DE PERMISO</h1>
            <p>Nº ${p.codigo_papeleta} | Fecha: ${new Date(p.fecha_solicitud).toLocaleDateString()}</p>
        </div>
        
        <div class="print-section">
            <h2>DATOS DEL TRABAJADOR</h2>
            <div class="print-row"><span class="label">Nombres y Apellidos:</span> ${p.full_name}</div>
            <div class="print-row"><span class="label">DNI:</span> ${p.dni}</div>
            <div class="print-row"><span class="label">Área:</span> ${p.area}</div>
        </div>

        <div class="print-section">
            <h2>TIPO DE PERMISO</h2>
            <div class="print-check-grid">
                ${types.map(t => `
                    <div class="print-check-item">
                        <span class="box ${p.tipo_permiso === t ? 'checked' : ''}"></span>
                        ${t.replace(/_/g, ' ').toUpperCase()}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="print-section">
            <h2>TIEMPO DEL PERMISO</h2>
            <div class="print-grid">
                <div class="print-row"><span class="label">Fecha Salida:</span> ${new Date(p.fecha_salida).toLocaleString()}</div>
                <div class="print-row"><span class="label">Fecha Retorno:</span> ${new Date(p.fecha_retorno).toLocaleString()}</div>
                <div class="print-row"><span class="label">Total Días:</span> ${p.total_dias}</div>
                <div class="print-row"><span class="label">Total Horas:</span> ${p.total_horas}</div>
            </div>
        </div>

        <div class="print-section">
            <h2>OTROS DATOS</h2>
            <div class="print-row"><span class="label">Lugar:</span> ${p.lugar_destino || '-'}</div>
            <div class="print-row"><span class="label">Motivo:</span> ${p.motivo || '-'}</div>
        </div>

        <div class="print-signatures">
            <div class="sign-box">FIRMA DEL SOLICITANTE<br><small>${p.full_name}</small></div>
            <div class="sign-box">JEFE INMEDIATO<br><small>${p.firma_jefe_date ? 'Aprobado: ' + new Date(p.firma_jefe_date).toLocaleDateString() : 'Pendiente'}</small></div>
            <div class="sign-box">JEFE RR.HH.<br><small>${p.firma_rrhh_date ? 'Aprobado: ' + new Date(p.firma_rrhh_date).toLocaleDateString() : 'Pendiente'}</small></div>
        </div>
        
        <div class="footer-note">
            Este documento es una impresión oficial generada por el Sistema PapeletaEssalud.
        </div>
    `;

    container.innerHTML = html;
    printContainer.innerHTML = html;
}

document.querySelector('.close-modal').onclick = () => {
    document.getElementById('modal-papeleta').style.display = 'none';
};

document.getElementById('btn-print-slip').onclick = () => {
    window.print();
};
