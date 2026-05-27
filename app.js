/* ==========================================================================
   State & Setup Configuration
   ========================================================================== */
let state = {
    participants: [],
    attendance: {},
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    searchQuery: '',
    groupFilter: 'Todos',
    editingParticipantId: null,
    deletingParticipantId: null,
    deleteType: null
};

// Initial Sample Data to make the page instantly engaging
const DEMO_PARTICIPANTS = [
    { id: 'part_1', name: 'Sofía Rodríguez', group: 'Grupo 1', createdAt: Date.now() - 50000 },
    { id: 'part_2', name: 'Carlos Mendoza', group: 'Grupo 2', createdAt: Date.now() - 40000 },
    { id: 'part_3', name: 'Mateo Silva', group: 'Grupo 1', createdAt: Date.now() - 30000 }
];

const DEMO_ATTENDANCE = {
    'part_1': {},
    'part_2': {},
    'part_3': {}
};

// Populate some demo attendances for the current month
function setupDemoData(thursdays) {
    if (thursdays.length > 0) {
        // Sofía attended almost all
        thursdays.forEach((th, idx) => {
            if (idx !== 1) DEMO_ATTENDANCE['part_1'][th.dateString] = true;
        });
        // Carlos attended first two
        if (thursdays[0]) DEMO_ATTENDANCE['part_2'][thursdays[0].dateString] = true;
        if (thursdays[1]) DEMO_ATTENDANCE['part_2'][thursdays[1].dateString] = true;
        // Mateo attended the last one
        if (thursdays[thursdays.length - 1]) {
            DEMO_ATTENDANCE['part_3'][thursdays[thursdays.length - 1].dateString] = true;
        }
    }
}

/* ==========================================================================
   Core Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadFromLocalStorage();
    initSelectors();
    initEventListeners();
    renderApp();
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('asistencia_theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-theme');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('asistencia_theme', isLight ? 'light' : 'dark');
        showToast(isLight ? 'Modo claro activado' : 'Modo oscuro activado', 'info');
    });
}

/* ==========================================================================
   Local Storage Management
   ========================================================================== */
function loadFromLocalStorage() {
    const storedParticipants = localStorage.getItem('asistencia_participants');
    const storedAttendance = localStorage.getItem('asistencia_records');
    
    if (storedParticipants) {
        state.participants = JSON.parse(storedParticipants);
    } else {
        // Setup initial demo data if storage is completely empty
        state.participants = [...DEMO_PARTICIPANTS];
        const thursdays = getThursdaysInMonth(state.currentMonth, state.currentYear);
        setupDemoData(thursdays);
        state.attendance = {...DEMO_ATTENDANCE};
        saveToLocalStorage();
    }
    
    if (storedAttendance) {
        state.attendance = JSON.parse(storedAttendance);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('asistencia_participants', JSON.stringify(state.participants));
    localStorage.setItem('asistencia_records', JSON.stringify(state.attendance));
}

/* ==========================================================================
   DOM Elements & Handlers Init
   ========================================================================== */
function initSelectors() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    // Set default select values to current month and year
    monthSelect.value = state.currentMonth;
    
    // Set up year selector range
    const currentYr = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let yr = currentYr - 2; yr <= currentYr + 3; yr++) {
        const option = document.createElement('option');
        option.value = yr;
        option.textContent = yr;
        if (yr === state.currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

function initEventListeners() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const searchInput = document.getElementById('search-participant');
    
    // Drawer triggers and buttons
    const openDrawerBtn = document.getElementById('open-drawer-btn');
    const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const cancelDrawerBtn = document.getElementById('cancel-drawer-btn');
    const backdrop = document.getElementById('add-participant-drawer-backdrop');
    const drawerForm = document.getElementById('drawer-add-participant-form');
    
    monthSelect.addEventListener('change', (e) => {
        state.currentMonth = parseInt(e.target.value);
        renderApp();
    });
    
    yearSelect.addEventListener('change', (e) => {
        state.currentYear = parseInt(e.target.value);
        renderApp();
    });
    
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderRowsOnly(); // Optimization: just re-render row contents
    });
    
    // Group filter event
    const filterGroupSelect = document.getElementById('filter-group');
    if (filterGroupSelect) {
        filterGroupSelect.addEventListener('change', (e) => {
            state.groupFilter = e.target.value;
            renderApp();
        });
    }
    
    // Open Drawer events
    if (openDrawerBtn) {
        openDrawerBtn.addEventListener('click', openDrawer);
    }
    if (emptyStateAddBtn) {
        emptyStateAddBtn.addEventListener('click', openDrawer);
    }
    
    // Close Drawer events
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (cancelDrawerBtn) cancelDrawerBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    
    // Modal buttons (Custom Delete Confirmation)
    const closeDeleteBtn = document.getElementById('close-delete-modal-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteBackdrop = document.getElementById('delete-confirm-backdrop');
    
    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteBackdrop) deleteBackdrop.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeleteParticipant);

    // Delete options modal buttons
    const closeDeleteOptionsBtn = document.getElementById('close-delete-options-btn');
    const deleteOptionCancelBtn = document.getElementById('delete-option-cancel-btn');
    const deleteOptionMonthBtn = document.getElementById('delete-option-month-btn');
    const deleteOptionAllBtn = document.getElementById('delete-option-all-btn');
    const deleteOptionsBackdrop = document.getElementById('delete-options-backdrop');

    if (closeDeleteOptionsBtn) closeDeleteOptionsBtn.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionCancelBtn) deleteOptionCancelBtn.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionsBackdrop) deleteOptionsBackdrop.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionMonthBtn) deleteOptionMonthBtn.addEventListener('click', handleDeleteOptionMonth);
    if (deleteOptionAllBtn) deleteOptionAllBtn.addEventListener('click', handleDeleteOptionAll);

    // Close drawer or modal on Escape key press
    window.addEventListener('keydown', (e) => {
        const drawer = document.getElementById('add-participant-drawer');
        const deleteOptionsModal = document.getElementById('delete-options-modal');
        const deleteModal = document.getElementById('delete-confirm-modal');
        if (e.key === 'Escape') {
            if (drawer && !drawer.classList.contains('hidden')) {
                closeDrawer();
            }
            if (deleteOptionsModal && !deleteOptionsModal.classList.contains('hidden')) {
                closeDeleteOptionsModal();
            }
            if (deleteModal && !deleteModal.classList.contains('hidden')) {
                closeDeleteModal();
            }
        }
    });
    
    // Add / Edit Participant inside the Drawer Form
    if (drawerForm) {
        drawerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleParticipantSubmit();
        });
    }
}

/* ==========================================================================
   Date / Thursday Calculations
   ========================================================================== */
/**
 * Calculates all Thursdays of a given month and year
 * @param {number} month - Index of month (0-11)
 * @param {number} year - Full year digits (e.g. 2026)
 * @returns {Array} - Array of Thursday details
 */
function getThursdaysInMonth(month, year) {
    const thursdays = [];
    const date = new Date(year, month, 1);
    
    while (date.getMonth() === month) {
        if (date.getDay() === 4) { // 4 is Thursday (Jueves)
            const dateStr = formatDateString(date);
            thursdays.push({
                dateString: dateStr,
                dayNumber: date.getDate(),
                dayName: 'Jue'
            });
        }
        date.setDate(date.getDate() + 1);
    }
    return thursdays;
}

function formatDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonthName(monthIndex) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
}

function isMonthAfterOrEqual(m1, y1, m2, y2) {
    if (y1 > y2) return true;
    if (y1 === y2 && m1 >= m2) return true;
    return false;
}

function isDateInMonth(dateStr, month, year) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === year && m === month;
}

/* ==========================================================================
   CRUD Operations
   ========================================================================== */
function addParticipant() {
    const inputElement = document.getElementById('drawer-participant-name');
    const groupElement = document.getElementById('drawer-participant-group');
    const name = inputElement.value.trim();
    const group = groupElement ? groupElement.value : 'Grupo 1';
    
    if (!name) return;
    
    // Check duplicate
    const isDuplicate = state.participants.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
        showToast('Este participante ya está registrado', 'danger');
        return;
    }
    
    const newId = 'part_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const newParticipant = {
        id: newId,
        name: name,
        group: group,
        createdAt: Date.now(),
        startMonth: state.currentMonth,
        startYear: state.currentYear,
        excludedMonths: []
    };
    
    state.participants.push(newParticipant);
    state.attendance[newId] = {};
    
    saveToLocalStorage();
    inputElement.value = '';
    if (groupElement) groupElement.value = 'Grupo 1';
    
    closeDrawer();
    
    renderApp();
    showToast(`Participante "${name}" agregado correctamente`);
}

/* ==========================================================================
   Drawer Actions (Abrir y Cerrar Cajón)
   ========================================================================== */
function openDrawer() {
    const drawer = document.getElementById('add-participant-drawer');
    const backdrop = document.getElementById('add-participant-drawer-backdrop');
    const input = document.getElementById('drawer-participant-name');
    
    drawer.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    
    // Trigger layout reflow to allow transition
    void drawer.offsetWidth;
    void backdrop.offsetWidth;
    
    drawer.classList.add('show');
    backdrop.classList.add('show');
    document.body.classList.add('drawer-open');
    
    // Focus the input after transiton
    setTimeout(() => {
        input.focus();
    }, 200);
}

function closeDrawer() {
    const drawer = document.getElementById('add-participant-drawer');
    const backdrop = document.getElementById('add-participant-drawer-backdrop');
    const input = document.getElementById('drawer-participant-name');
    const groupElement = document.getElementById('drawer-participant-group');
    
    drawer.classList.remove('show');
    backdrop.classList.remove('show');
    document.body.classList.remove('drawer-open');
    
    // Wait for animation to finish before adding hidden class back
    setTimeout(() => {
        drawer.classList.add('hidden');
        backdrop.classList.add('hidden');
        
        // Reset state & values
        state.editingParticipantId = null;
        input.value = '';
        if (groupElement) groupElement.value = 'Grupo 1';
        
        // Reset drawer text back to "Agregar"
        const drawerTitle = document.querySelector('#add-participant-drawer .drawer-header h3');
        if (drawerTitle) drawerTitle.textContent = 'Agregar Nuevo Participante';
        
        const drawerDesc = document.querySelector('#add-participant-drawer .drawer-desc');
        if (drawerDesc) drawerDesc.textContent = 'Ingresa el nombre completo del nuevo participante para registrarlo en la lista de asistencia de este mes.';
        
        const submitBtn = document.querySelector('#drawer-add-participant-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Agregar
            `;
        }
    }, 300); // 300ms matches the CSS transition duration
}

function openEditDrawer(participant) {
    state.editingParticipantId = participant.id;
    
    const inputElement = document.getElementById('drawer-participant-name');
    const groupElement = document.getElementById('drawer-participant-group');
    
    if (inputElement) inputElement.value = participant.name;
    if (groupElement) groupElement.value = participant.group || 'Grupo 1';
    
    const drawerTitle = document.querySelector('#add-participant-drawer .drawer-header h3');
    if (drawerTitle) drawerTitle.textContent = 'Editar Participante';
    
    const drawerDesc = document.querySelector('#add-participant-drawer .drawer-desc');
    if (drawerDesc) drawerDesc.textContent = 'Modifica el nombre completo y el grupo del participante seleccionado.';
    
    const submitBtn = document.querySelector('#drawer-add-participant-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar
        `;
    }
    
    const drawer = document.getElementById('add-participant-drawer');
    const backdrop = document.getElementById('add-participant-drawer-backdrop');
    
    if (drawer && backdrop) {
        drawer.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        void drawer.offsetWidth;
        void backdrop.offsetWidth;
        
        drawer.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('drawer-open');
        
        setTimeout(() => {
            inputElement.focus();
        }, 200);
    }
}

function handleParticipantSubmit() {
    if (state.editingParticipantId) {
        saveParticipantEdit();
    } else {
        addParticipant();
    }
}

function saveParticipantEdit() {
    const inputElement = document.getElementById('drawer-participant-name');
    const groupElement = document.getElementById('drawer-participant-group');
    const name = inputElement.value.trim();
    const group = groupElement ? groupElement.value : 'Grupo 1';
    
    if (!name) return;
    
    const isDuplicate = state.participants.some(p => 
        p.id !== state.editingParticipantId && p.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
        showToast('Ya existe un participante con este nombre', 'danger');
        return;
    }
    
    const index = state.participants.findIndex(p => p.id === state.editingParticipantId);
    if (index !== -1) {
        const oldName = state.participants[index].name;
        state.participants[index].name = name;
        state.participants[index].group = group;
        
        saveToLocalStorage();
        closeDrawer();
        renderApp();
        showToast(`Participante "${oldName}" actualizado a "${name}"`);
    } else {
        showToast('Error al editar el participante', 'danger');
        closeDrawer();
    }
}

function showDeleteOptionsModal(id, name) {
    state.deletingParticipantId = id;
    
    const nameSpan = document.getElementById('delete-options-participant-name');
    if (nameSpan) nameSpan.textContent = name;
    
    const modal = document.getElementById('delete-options-modal');
    const backdrop = document.getElementById('delete-options-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        void modal.offsetWidth;
        void backdrop.offsetWidth;
        
        modal.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeDeleteOptionsModal() {
    const modal = document.getElementById('delete-options-modal');
    const backdrop = document.getElementById('delete-options-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
        }, 300);
    }
}

function handleDeleteOptionMonth() {
    const id = state.deletingParticipantId;
    if (!id) return;
    
    const participant = state.participants.find(p => p.id === id);
    if (!participant) return;
    
    state.deleteType = 'month';
    
    // Close options modal
    closeDeleteOptionsModal();
    
    // Customize confirmation modal
    const titleEl = document.getElementById('delete-confirm-title');
    const textEl = document.getElementById('delete-confirm-text');
    const nameEl = document.getElementById('delete-participant-name');
    
    if (titleEl) titleEl.textContent = 'Confirmar Eliminación - Solo este mes';
    if (textEl) {
        textEl.innerHTML = `¿Seguro que quieres ocultar y eliminar el registro de <strong>${participant.name}</strong> para el mes de <strong>${getMonthName(state.currentMonth)} de ${state.currentYear}</strong>? (Sus datos de otros meses quedarán intactos)`;
    } else if (nameEl) {
        nameEl.textContent = participant.name;
    }
    
    // Open confirmation modal
    showDeleteConfirmModal();
}

function handleDeleteOptionAll() {
    const id = state.deletingParticipantId;
    if (!id) return;
    
    const participant = state.participants.find(p => p.id === id);
    if (!participant) return;
    
    state.deleteType = 'all';
    
    // Close options modal
    closeDeleteOptionsModal();
    
    // Customize confirmation modal
    const titleEl = document.getElementById('delete-confirm-title');
    const textEl = document.getElementById('delete-confirm-text');
    const nameEl = document.getElementById('delete-participant-name');
    
    if (titleEl) titleEl.textContent = 'Confirmar Eliminación - Todos los meses';
    if (textEl) {
        textEl.innerHTML = `¿Seguro que quieres eliminar a <strong>${participant.name}</strong> de todos los meses de manera permanente? Esta acción no se puede deshacer.`;
    } else if (nameEl) {
        nameEl.textContent = participant.name;
    }
    
    // Open confirmation modal
    showDeleteConfirmModal();
}

function showDeleteConfirmModal() {
    const modal = document.getElementById('delete-confirm-modal');
    const backdrop = document.getElementById('delete-confirm-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        void modal.offsetWidth;
        void backdrop.offsetWidth;
        
        modal.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-confirm-modal');
    const backdrop = document.getElementById('delete-confirm-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            state.deletingParticipantId = null;
            state.deleteType = null;
        }, 300);
    }
}

function confirmDeleteParticipant() {
    const id = state.deletingParticipantId;
    if (!id) return;
    
    const participant = state.participants.find(p => p.id === id);
    if (!participant) return;
    
    const name = participant.name;
    
    if (state.deleteType === 'month') {
        // Exclude participant from the current month
        if (!participant.excludedMonths) {
            participant.excludedMonths = [];
        }
        const monthKey = `${state.currentYear}-${state.currentMonth}`;
        if (!participant.excludedMonths.includes(monthKey)) {
            participant.excludedMonths.push(monthKey);
        }
        
        // Clear all attendance records for this month
        if (state.attendance[id]) {
            Object.keys(state.attendance[id]).forEach(dateStr => {
                if (isDateInMonth(dateStr, state.currentMonth, state.currentYear)) {
                    delete state.attendance[id][dateStr];
                }
            });
        }
        
        saveToLocalStorage();
        closeDeleteModal();
        renderApp();
        showToast(`Registro de "${name}" eliminado solo para este mes`, 'danger');
    } else {
        // Full permanent deletion from all months
        state.participants = state.participants.filter(p => p.id !== id);
        delete state.attendance[id];
        
        saveToLocalStorage();
        closeDeleteModal();
        renderApp();
        showToast(`Registro de "${name}" eliminado de manera permanente`, 'danger');
    }
}

/* ==========================================================================
   Rendering & DOM Updating
   ========================================================================== */
function renderApp() {
    const thursdays = getThursdaysInMonth(state.currentMonth, state.currentYear);
    
    // Update heading displaying the month name
    const monthDisplay = document.getElementById('current-month-display');
    monthDisplay.textContent = `Refuerzos de ${getMonthName(state.currentMonth)} ${state.currentYear}`;
    
    renderHeaders(thursdays);
    renderRowsOnly();
    renderStats(thursdays);
}

function renderHeaders(thursdays) {
    const headersRow = document.getElementById('table-headers');
    headersRow.innerHTML = '';
    
    // 1. Name header
    const nameTh = document.createElement('th');
    nameTh.textContent = 'Nombre';
    headersRow.appendChild(nameTh);
    
    // 1b. Group header
    const groupTh = document.createElement('th');
    groupTh.textContent = 'Grupo';
    groupTh.className = 'text-center';
    headersRow.appendChild(groupTh);
    
    // 2. Thursdays dates headers
    thursdays.forEach(th => {
        const thEl = document.createElement('th');
        thEl.className = 'text-center';
        thEl.innerHTML = `
            <div class="th-date-container">
                <span class="th-day-name">${th.dayName}</span>
                <span class="th-day-number">${th.dayNumber}</span>
            </div>
        `;
        headersRow.appendChild(thEl);
    });
    
    // 3. Total stats header
    const totalTh = document.createElement('th');
    totalTh.textContent = 'Total Mes';
    totalTh.className = 'text-center';
    headersRow.appendChild(totalTh);
    
    // 4. Actions header
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Acciones';
    actionsTh.className = 'text-center';
    headersRow.appendChild(actionsTh);
}

function getFilteredParticipants() {
    const filtered = state.participants.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(state.searchQuery);
        const matchesGroup = state.groupFilter === 'Todos' || (p.group || 'Grupo 1') === state.groupFilter;
        
        // Month registration & eligibility check
        const startMonth = typeof p.startMonth === 'number' ? p.startMonth : 0;
        const startYear = typeof p.startYear === 'number' ? p.startYear : 2025;
        const isEligibleByStart = isMonthAfterOrEqual(state.currentMonth, state.currentYear, startMonth, startYear);
        
        // Excluded months check (Solo este mes deletion)
        const monthKey = `${state.currentYear}-${state.currentMonth}`;
        const isNotExcluded = !p.excludedMonths || !p.excludedMonths.includes(monthKey);
        
        return matchesSearch && matchesGroup && isEligibleByStart && isNotExcluded;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

function renderFooter(thursdays, filteredParticipants) {
    const tfoot = document.getElementById('attendance-tfoot');
    if (!tfoot) return;
    tfoot.innerHTML = '';
    
    if (filteredParticipants.length === 0) {
        return;
    }
    
    const tr = document.createElement('tr');
    
    // 1. Label column
    const labelTd = document.createElement('td');
    labelTd.innerHTML = '<span class="tfoot-total-label">Asistieron</span>';
    tr.appendChild(labelTd);
    
    // 2. Group column (empty)
    const groupTd = document.createElement('td');
    tr.appendChild(groupTd);
    
    // 3. Thursdays counts
    let totalThursdaysAttended = 0;
    thursdays.forEach(th => {
        const td = document.createElement('td');
        td.className = 'text-center';
        
        let count = 0;
        filteredParticipants.forEach(p => {
            if (state.attendance[p.id] && state.attendance[p.id][th.dateString]) {
                count++;
            }
        });
        
        td.innerHTML = `<strong>${count}</strong>`;
        tr.appendChild(td);
        totalThursdaysAttended += count;
    });
    
    // 4. Total Month Column
    const totalTd = document.createElement('td');
    totalTd.className = 'text-center';
    totalTd.innerHTML = `<strong>${totalThursdaysAttended}</strong>`;
    tr.appendChild(totalTd);
    
    // 5. Actions Column (empty)
    const actionsTd = document.createElement('td');
    tr.appendChild(actionsTd);
    
    tfoot.appendChild(tr);
}

function renderRowsOnly() {
    const tbody = document.getElementById('attendance-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableElement = document.getElementById('attendance-table');
    tbody.innerHTML = '';
    
    const thursdays = getThursdaysInMonth(state.currentMonth, state.currentYear);
    
    // Filter participants by search and group
    const filteredParticipants = getFilteredParticipants();
    
    // Empty state logic
    if (state.participants.length === 0) {
        tableElement.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h4').textContent = 'No hay participantes agregados';
        emptyState.querySelector('p').textContent = 'Agrega un nuevo participante para comenzar a registrar la asistencia.';
        return;
    }
    
    if (filteredParticipants.length === 0 && (state.searchQuery !== '' || state.groupFilter !== 'Todos')) {
        tableElement.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = thursdays.length + 4; // increment by 1 for Group column
        td.className = 'text-center text-muted';
        td.style.padding = '32px';
        td.textContent = 'No se encontraron participantes que coincidan con los filtros';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    
    tableElement.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Render rows
    filteredParticipants.forEach(participant => {
        const tr = document.createElement('tr');
        
        // 1. Cell: Name
        const nameTd = document.createElement('td');
        nameTd.textContent = participant.name;
        tr.appendChild(nameTd);
        
        // 1b. Cell: Group Badge
        const groupTd = document.createElement('td');
        groupTd.className = 'text-center';
        
        const groupBadge = document.createElement('span');
        const pGroup = participant.group || 'Grupo 1';
        groupBadge.className = `badge ${pGroup === 'Grupo 2' ? 'badge-purple' : 'badge-blue'}`;
        groupBadge.textContent = pGroup;
        
        groupTd.appendChild(groupBadge);
        tr.appendChild(groupTd);
        
        // 2. Checkboxes for thursdays
        let attendedInMonthCount = 0;
        thursdays.forEach(th => {
            const td = document.createElement('td');
            td.className = 'text-center';
            
            const isAttended = !!(state.attendance[participant.id] && state.attendance[participant.id][th.dateString]);
            if (isAttended) {
                attendedInMonthCount++;
            }
            
            const label = document.createElement('label');
            label.className = 'attendance-checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isAttended;
            checkbox.dataset.participantId = participant.id;
            checkbox.dataset.dateString = th.dateString;
            
            checkbox.addEventListener('change', (e) => {
                toggleAttendance(participant.id, th.dateString, e.target.checked);
            });
            
            const customBox = document.createElement('span');
            customBox.className = 'checkbox-custom';
            
            label.appendChild(checkbox);
            label.appendChild(customBox);
            td.appendChild(label);
            tr.appendChild(td);
        });
        
        // 3. Cell: Total Badge
        const totalTd = document.createElement('td');
        totalTd.className = 'text-center';
        
        const badge = document.createElement('span');
        badge.id = `badge-${participant.id}`;
        badge.className = 'attendance-count-badge';
        updateBadgeClasses(badge, attendedInMonthCount, thursdays.length);
        badge.textContent = `${attendedInMonthCount} / ${thursdays.length}`;
        
        totalTd.appendChild(badge);
        tr.appendChild(totalTd);
        
        // 4. Cell: Actions (Edit and Delete)
        const actionsTd = document.createElement('td');
        actionsTd.className = 'text-center';
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-cell';
        
        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action btn-action-edit';
        editBtn.title = `Editar a ${participant.name}`;
        editBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        `;
        editBtn.addEventListener('click', () => {
            openEditDrawer(participant);
        });
        
        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action btn-action-delete';
        deleteBtn.title = `Eliminar a ${participant.name}`;
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        `;
        deleteBtn.addEventListener('click', () => {
            showDeleteOptionsModal(participant.id, participant.name);
        });
        
        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);
        actionsTd.appendChild(actionsContainer);
        tr.appendChild(actionsTd);
        
        tbody.appendChild(tr);
    });
    
    // Render footer
    renderFooter(thursdays, filteredParticipants);
}

function updateBadgeClasses(badge, current, total) {
    badge.className = 'attendance-count-badge'; // reset
    if (current === 0) {
        badge.classList.add('no-attendance');
    } else if (current === total) {
        badge.classList.add('high-attendance');
    }
}

function renderStats(thursdays) {
    // Filter participants based on active group filter
    const activeParticipants = state.participants.filter(p => 
        state.groupFilter === 'Todos' || (p.group || 'Grupo 1') === state.groupFilter
    );
    
    const totalParticipants = activeParticipants.length;
    
    const totalEl = document.getElementById('total-participants-stat');
    if (totalEl) {
        totalEl.textContent = totalParticipants;
    }
}

/* ==========================================================================
   Attendance Actions
   ========================================================================== */
function toggleAttendance(participantId, dateString, checked) {
    if (!state.attendance[participantId]) {
        state.attendance[participantId] = {};
    }
    
    if (checked) {
        state.attendance[participantId][dateString] = true;
    } else {
        delete state.attendance[participantId][dateString];
    }
    
    saveToLocalStorage();
    
    // Update the individual participant total badge in real-time
    const thursdays = getThursdaysInMonth(state.currentMonth, state.currentYear);
    let attendedInMonthCount = 0;
    thursdays.forEach(th => {
        if (state.attendance[participantId] && state.attendance[participantId][th.dateString]) {
            attendedInMonthCount++;
        }
    });
    
    const badge = document.getElementById(`badge-${participantId}`);
    if (badge) {
        updateBadgeClasses(badge, attendedInMonthCount, thursdays.length);
        badge.textContent = `${attendedInMonthCount} / ${thursdays.length}`;
    }
    
    // Update global statistics
    renderStats(thursdays);
    
    // Update footer counters in real-time
    const filtered = getFilteredParticipants();
    renderFooter(thursdays, filtered);
}

/* ==========================================================================
   Toast Notification Helper
   ========================================================================== */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    // Clear display type classes
    toast.className = 'toast';
    
    // Add active classes
    if (type === 'success') {
        toast.classList.add('toast-success');
    } else if (type === 'danger') {
        toast.classList.add('toast-danger');
    }
    
    toast.classList.add('show');
    
    // Auto-remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
