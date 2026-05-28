/* ==========================================================================
   State & Setup Configuration
   ========================================================================== */
let state = {
    // Thursday general attendance states
    participants: [],
    attendance: {},
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    searchQuery: '',
    groupFilter: 'Todos',
    editingParticipantId: null,
    deletingParticipantId: null,
    deleteType: null,
    
    // SPA Router & Navigation State
    currentView: 'menu', // 'menu' | 'general' | 'personalized'
    
    // Personalized tutorings states
    persParticipants: [],
    persClasses: {},  // participantId -> array of class objects
    persPayments: {}, // participantId -> array of payment objects
    persNotes: {},    // participantId -> array of note objects
    selectedPersParticipantId: null,
    persSearchQuery: '',
    deletingPersId: null,
    deletingPersType: null, // 'participant' | 'class' | 'payment' | 'note'
    editingPersClassId: null,
    editingPersPaymentId: null,
    editingPersNoteId: null
};

// Initial Sample Data for General Reinforcements
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

// Initial Sample Data for Personalized Reinforcements
const DEMO_PERS_PARTICIPANTS = [
    { id: 'pers_1', name: 'Andrés Felipe Gómez', createdAt: Date.now() - 360000000 },
    { id: 'pers_2', name: 'Camila Torres', createdAt: Date.now() - 250000000 }
];

const DEMO_PERS_CLASSES = {
    'pers_1': [
        { id: 'class_1_1', day: 'Lunes', date: '2026-05-18', startTime: '15:00', endTime: '16:00', price: 15000, paid: true, paymentId: 'pay_1_1' },
        { id: 'class_1_2', day: 'Miércoles', date: '2026-05-20', startTime: '15:00', endTime: '16:00', price: 15000, paid: true, paymentId: 'pay_1_2' },
        { id: 'class_1_3', day: 'Viernes', date: '2026-05-22', startTime: '15:30', endTime: '16:30', price: 18000, paid: false, paymentId: null }
    ],
    'pers_2': [
        { id: 'class_2_1', day: 'Martes', date: '2026-05-19', startTime: '10:00', endTime: '11:30', price: 20000, paid: true, paymentId: 'pay_2_1' }
    ]
};

const DEMO_PERS_PAYMENTS = {
    'pers_1': [
        { id: 'pay_1_1', date: '2026-05-18', amount: 15000 },
        { id: 'pay_1_2', date: '2026-05-20', amount: 15000 }
    ],
    'pers_2': [
        { id: 'pay_2_1', date: '2026-05-19', amount: 20000 }
    ]
};

const DEMO_PERS_NOTES = {
    'pers_1': [
        { id: 'note_1_1', date: '2026-05-18', text: 'El alumno avanzó bastante en la resolución de ecuaciones de primer grado.' },
        { id: 'note_1_2', date: '2026-05-20', text: 'Se le dificulta un poco recordar la ley de los signos. Se recomienda repasar antes de la próxima clase.' }
    ]
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
   Theme Management
   ========================================================================== */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const menuThemeToggle = document.getElementById('menu-theme-toggle');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('asistencia_theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-theme');
    }
    
    const handleThemeToggle = () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('asistencia_theme', isLight ? 'light' : 'dark');
        showToast(isLight ? 'Modo claro activado' : 'Modo oscuro activado', 'info');
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', handleThemeToggle);
    }
    if (menuThemeToggle) {
        menuThemeToggle.addEventListener('click', handleThemeToggle);
    }
}

/* ==========================================================================
   Local Storage Management
   ========================================================================== */
function loadFromLocalStorage() {
    // 1. Thursday General Attendance
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

    // 2. Personalized Reinforcements
    const storedPersParticipants = localStorage.getItem('asistencia_pers_participants');
    const storedPersClasses = localStorage.getItem('asistencia_pers_classes');
    const storedPersPayments = localStorage.getItem('asistencia_pers_payments');
    const storedPersNotes = localStorage.getItem('asistencia_pers_notes');

    if (storedPersParticipants) {
        state.persParticipants = JSON.parse(storedPersParticipants);
        state.persClasses = storedPersClasses ? JSON.parse(storedPersClasses) : {};
        state.persPayments = storedPersPayments ? JSON.parse(storedPersPayments) : {};
        state.persNotes = storedPersNotes ? JSON.parse(storedPersNotes) : {};
    } else {
        // Setup initial personalized demo data
        state.persParticipants = [...DEMO_PERS_PARTICIPANTS];
        state.persClasses = {...DEMO_PERS_CLASSES};
        state.persPayments = {...DEMO_PERS_PAYMENTS};
        state.persNotes = {...DEMO_PERS_NOTES};
        savePersToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('asistencia_participants', JSON.stringify(state.participants));
    localStorage.setItem('asistencia_records', JSON.stringify(state.attendance));
}

function savePersToLocalStorage() {
    localStorage.setItem('asistencia_pers_participants', JSON.stringify(state.persParticipants));
    localStorage.setItem('asistencia_pers_classes', JSON.stringify(state.persClasses));
    localStorage.setItem('asistencia_pers_payments', JSON.stringify(state.persPayments));
    localStorage.setItem('asistencia_pers_notes', JSON.stringify(state.persNotes));
}

/* ==========================================================================
   DOM Elements & Handlers Init
   ========================================================================== */
function initSelectors() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    // Set default select values to current month and year
    if (monthSelect) monthSelect.value = state.currentMonth;
    
    // Set up year selector range
    if (yearSelect) {
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
}

function initEventListeners() {
    // === SPA View Navigation ===
    const btnNavGeneral = document.getElementById('btn-nav-general');
    const btnNavPersonalized = document.getElementById('btn-nav-personalized');
    const btnBackToMenu = document.getElementById('btn-back-to-menu');
    const btnBackToMenuFromPers = document.getElementById('btn-back-to-menu-from-pers');

    if (btnNavGeneral) {
        btnNavGeneral.addEventListener('click', () => {
            state.currentView = 'general';
            renderApp();
        });
    }

    if (btnNavPersonalized) {
        btnNavPersonalized.addEventListener('click', () => {
            state.currentView = 'personalized';
            state.selectedPersParticipantId = null; // reset details subview
            renderApp();
        });
    }

    if (btnBackToMenu) {
        btnBackToMenu.addEventListener('click', () => {
            state.currentView = 'menu';
            renderApp();
        });
    }

    if (btnBackToMenuFromPers) {
        btnBackToMenuFromPers.addEventListener('click', () => {
            state.currentView = 'menu';
            renderApp();
        });
    }

    // === Thursday General Reinforcements Event Listeners ===
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
    
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            state.currentMonth = parseInt(e.target.value);
            renderApp();
        });
    }
    
    if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            state.currentYear = parseInt(e.target.value);
            renderApp();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            renderRowsOnly(); 
        });
    }
    
    // Group filter event
    const filterGroupSelect = document.getElementById('filter-group');
    if (filterGroupSelect) {
        filterGroupSelect.addEventListener('change', (e) => {
            state.groupFilter = e.target.value;
            renderApp();
        });
    }
    
    // Open Drawer events
    if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
    if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', openDrawer);
    
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
    const deleteOptionFutureBtn = document.getElementById('delete-option-future-btn');
    const deleteOptionAllBtn = document.getElementById('delete-option-all-btn');
    const deleteOptionsBackdrop = document.getElementById('delete-options-backdrop');

    if (closeDeleteOptionsBtn) closeDeleteOptionsBtn.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionCancelBtn) deleteOptionCancelBtn.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionsBackdrop) deleteOptionsBackdrop.addEventListener('click', closeDeleteOptionsModal);
    if (deleteOptionMonthBtn) deleteOptionMonthBtn.addEventListener('click', handleDeleteOptionMonth);
    if (deleteOptionFutureBtn) deleteOptionFutureBtn.addEventListener('click', handleDeleteOptionFuture);
    if (deleteOptionAllBtn) deleteOptionAllBtn.addEventListener('click', handleDeleteOptionAll);

    
    if (drawerForm) {
        drawerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleParticipantSubmit();
        });
    }

    // === Refuerzos Personalizados Event Listeners ===
    const searchPersInput = document.getElementById('search-pers-participant');
    const openPersDrawerBtn = document.getElementById('open-pers-drawer-btn');
    const persEmptyStateAddBtn = document.getElementById('pers-empty-state-add-btn');
    const closePersDrawerBtn = document.getElementById('close-pers-drawer-btn');
    const cancelPersDrawerBtn = document.getElementById('cancel-pers-drawer-btn');
    const persDrawerBackdrop = document.getElementById('add-pers-participant-drawer-backdrop');
    const persDrawerForm = document.getElementById('drawer-add-pers-participant-form');
    
    const btnBackToPersList = document.getElementById('btn-back-to-pers-list');
    const btnPersAddClass = document.getElementById('btn-pers-add-class');
    const btnPersAddPayment = document.getElementById('btn-pers-add-payment');

    // Class Modal buttons
    const closePersClassBtn = document.getElementById('close-pers-class-modal-btn');
    const cancelPersClassBtn = document.getElementById('cancel-pers-class-btn');
    const persClassBackdrop = document.getElementById('add-pers-class-backdrop');
    const persClassForm = document.getElementById('pers-class-form');

    // Payment Modal buttons
    const closePersPaymentBtn = document.getElementById('close-pers-payment-modal-btn');
    const cancelPersPaymentBtn = document.getElementById('cancel-pers-payment-btn');
    const persPaymentBackdrop = document.getElementById('add-pers-payment-backdrop');
    const persPaymentForm = document.getElementById('pers-payment-form');

    // Delete Confirmation personalized modal buttons
    const closePersDeleteBtn = document.getElementById('close-pers-delete-modal-btn');
    const cancelPersDeleteBtn = document.getElementById('cancel-pers-delete-btn');
    const confirmPersDeleteBtn = document.getElementById('confirm-pers-delete-btn');
    const persDeleteBackdrop = document.getElementById('pers-delete-confirm-backdrop');

    if (searchPersInput) {
        searchPersInput.addEventListener('input', (e) => {
            state.persSearchQuery = e.target.value.toLowerCase().trim();
            renderPersParticipantsGrid();
        });
    }

    if (openPersDrawerBtn) openPersDrawerBtn.addEventListener('click', openPersDrawer);
    if (persEmptyStateAddBtn) persEmptyStateAddBtn.addEventListener('click', openPersDrawer);
    if (closePersDrawerBtn) closePersDrawerBtn.addEventListener('click', closePersDrawer);
    if (cancelPersDrawerBtn) cancelPersDrawerBtn.addEventListener('click', closePersDrawer);
    if (persDrawerBackdrop) persDrawerBackdrop.addEventListener('click', closePersDrawer);

    if (persDrawerForm) {
        persDrawerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addPersParticipant();
        });
    }

    if (btnBackToPersList) {
        btnBackToPersList.addEventListener('click', () => {
            state.selectedPersParticipantId = null;
            renderPersView();
        });
    }

    if (btnPersAddClass) btnPersAddClass.addEventListener('click', openPersClassModal);
    if (closePersClassBtn) closePersClassBtn.addEventListener('click', closePersClassModal);
    if (cancelPersClassBtn) cancelPersClassBtn.addEventListener('click', closePersClassModal);
    if (persClassBackdrop) persClassBackdrop.addEventListener('click', closePersClassModal);
    if (persClassForm) {
        persClassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePersClassSubmit();
        });
    }

    if (btnPersAddPayment) btnPersAddPayment.addEventListener('click', openPersPaymentModal);
    if (closePersPaymentBtn) closePersPaymentBtn.addEventListener('click', closePersPaymentModal);
    if (cancelPersPaymentBtn) cancelPersPaymentBtn.addEventListener('click', closePersPaymentModal);
    if (persPaymentBackdrop) persPaymentBackdrop.addEventListener('click', closePersPaymentModal);
    if (persPaymentForm) {
        persPaymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePersPaymentSubmit();
        });
    }

    // Notes Modal event listeners
    const btnPersAddNote = document.getElementById('btn-pers-add-note');
    const closePersNoteBtn = document.getElementById('close-pers-note-modal-btn');
    const cancelPersNoteBtn = document.getElementById('cancel-pers-note-btn');
    const persNoteBackdrop = document.getElementById('add-pers-note-backdrop');
    const persNoteForm = document.getElementById('pers-note-form');

    if (btnPersAddNote) btnPersAddNote.addEventListener('click', openPersNoteModal);
    if (closePersNoteBtn) closePersNoteBtn.addEventListener('click', closePersNoteModal);
    if (cancelPersNoteBtn) cancelPersNoteBtn.addEventListener('click', closePersNoteModal);
    if (persNoteBackdrop) persNoteBackdrop.addEventListener('click', closePersNoteModal);
    if (persNoteForm) {
        persNoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePersNoteSubmit();
        });
    }

    if (closePersDeleteBtn) closePersDeleteBtn.addEventListener('click', closePersDeleteModal);
    if (cancelPersDeleteBtn) cancelPersDeleteBtn.addEventListener('click', closePersDeleteModal);
    if (persDeleteBackdrop) persDeleteBackdrop.addEventListener('click', closePersDeleteModal);
    if (confirmPersDeleteBtn) confirmPersDeleteBtn.addEventListener('click', confirmPersDelete);

    // Global Key Bindings (Escape closing)
    window.addEventListener('keydown', (e) => {
        const drawer = document.getElementById('add-participant-drawer');
        const deleteOptionsModal = document.getElementById('delete-options-modal');
        const deleteModal = document.getElementById('delete-confirm-modal');
        
        // Personalized dialogs
        const persDrawer = document.getElementById('add-pers-participant-drawer');
        const persClassModal = document.getElementById('add-pers-class-modal');
        const persPaymentModal = document.getElementById('add-pers-payment-modal');
        const persNoteModal = document.getElementById('add-pers-note-modal');
        const persDeleteModal = document.getElementById('pers-delete-confirm-modal');

        if (e.key === 'Escape') {
            if (drawer && !drawer.classList.contains('hidden')) closeDrawer();
            if (deleteOptionsModal && !deleteOptionsModal.classList.contains('hidden')) closeDeleteOptionsModal();
            if (deleteModal && !deleteModal.classList.contains('hidden')) closeDeleteModal();
            
            if (persDrawer && !persDrawer.classList.contains('hidden')) closePersDrawer();
            if (persClassModal && !persClassModal.classList.contains('hidden')) closePersClassModal();
            if (persPaymentModal && !persPaymentModal.classList.contains('hidden')) closePersPaymentModal();
            if (persNoteModal && !persNoteModal.classList.contains('hidden')) closePersNoteModal();
            if (persDeleteModal && !persDeleteModal.classList.contains('hidden')) closePersDeleteModal();
        }
    });
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

function handleDeleteOptionFuture() {
    const id = state.deletingParticipantId;
    if (!id) return;
    
    const participant = state.participants.find(p => p.id === id);
    if (!participant) return;
    
    state.deleteType = 'future';
    
    // Close options modal
    closeDeleteOptionsModal();
    
    // Customize confirmation modal
    const titleEl = document.getElementById('delete-confirm-title');
    const textEl = document.getElementById('delete-confirm-text');
    const nameEl = document.getElementById('delete-participant-name');
    
    if (titleEl) titleEl.textContent = 'Confirmar Eliminación - Este y futuros';
    if (textEl) {
        textEl.innerHTML = `¿Seguro que quieres ocultar y eliminar el registro de <strong>${participant.name}</strong> para <strong>este mes y todos los meses futuros</strong>? (Sus datos de meses anteriores quedarán intactos)`;
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
    } else if (state.deleteType === 'future') {
        // Set end month and year
        participant.endMonth = state.currentMonth;
        participant.endYear = state.currentYear;
        
        // Clear all attendance records for current and future months
        if (state.attendance[id]) {
            Object.keys(state.attendance[id]).forEach(dateStr => {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    if (isMonthAfterOrEqual(m, y, state.currentMonth, state.currentYear)) {
                        delete state.attendance[id][dateStr];
                    }
                }
            });
        }
        
        saveToLocalStorage();
        closeDeleteModal();
        renderApp();
        showToast(`Registro de "${name}" eliminado para este mes y meses futuros`, 'danger');
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
    // Hide all views first
    document.getElementById('main-menu-view').classList.add('hidden');
    document.getElementById('general-reinforcements-view').classList.add('hidden');
    document.getElementById('personalized-reinforcements-view').classList.add('hidden');
    
    if (state.currentView === 'menu') {
        document.getElementById('main-menu-view').classList.remove('hidden');
    } else if (state.currentView === 'general') {
        document.getElementById('general-reinforcements-view').classList.remove('hidden');
        
        const thursdays = getThursdaysInMonth(state.currentMonth, state.currentYear);
        const monthDisplay = document.getElementById('current-month-display');
        monthDisplay.textContent = `Refuerzos de ${getMonthName(state.currentMonth)} ${state.currentYear}`;
        
        renderHeaders(thursdays);
        renderRowsOnly();
        renderStats(thursdays);
    } else if (state.currentView === 'personalized') {
        document.getElementById('personalized-reinforcements-view').classList.remove('hidden');
        renderPersView();
    }
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
        
        // End month/year check (Este y futuros deletion)
        const hasEnded = p.endYear !== undefined && p.endMonth !== undefined && 
                         isMonthAfterOrEqual(state.currentMonth, state.currentYear, p.endMonth, p.endYear);
        const isEligibleByEnd = !hasEnded;
        
        return matchesSearch && matchesGroup && isEligibleByStart && isNotExcluded && isEligibleByEnd;
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

/* ==========================================================================
   Refuerzos Personalizados - Logic Operations
   ========================================================================== */

function renderPersView() {
    const listSubview = document.getElementById('pers-list-subview');
    const detailSubview = document.getElementById('pers-detail-subview');
    
    // Update sidebar counts
    const totalPersEl = document.getElementById('pers-total-participants-stat');
    if (totalPersEl) {
        totalPersEl.textContent = state.persParticipants.length;
    }

    if (state.selectedPersParticipantId === null) {
        // Show List subview A
        listSubview.classList.remove('hidden');
        detailSubview.classList.add('hidden');
        renderPersParticipantsGrid();
    } else {
        // Show Detail subview B
        listSubview.classList.add('hidden');
        detailSubview.classList.remove('hidden');
        renderPersParticipantDetail();
    }
}

function renderPersParticipantsGrid() {
    const grid = document.getElementById('pers-participants-grid');
    const emptyState = document.getElementById('pers-empty-state');
    
    if (!grid) return;
    grid.innerHTML = '';

    // Filter participants by search query
    const filtered = state.persParticipants.filter(p => 
        p.name.toLowerCase().includes(state.persSearchQuery)
    );

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    if (state.persParticipants.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h4').textContent = 'No hay alumnos personalizados';
        emptyState.querySelector('p').textContent = 'Agrega un nuevo participante para registrar asistencia y cobros.';
        return;
    }

    if (filtered.length === 0 && state.persSearchQuery !== '') {
        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        grid.innerHTML = `<div class="text-center text-muted" style="grid-column: 1 / -1; padding: 40px;">No se encontraron participantes que coincidan con la búsqueda</div>`;
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'pers-card animate-slide-up';
        
        // Calculate student financial standings
        const classes = state.persClasses[p.id] || [];
        const payments = state.persPayments[p.id] || [];

        const totalCost = classes.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
        const totalPaid = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
        const remaining = totalCost - totalPaid;

        const firstLetter = p.name.trim().charAt(0).toUpperCase();

        card.innerHTML = `
            <div class="pers-card-header">
                <div class="pers-card-avatar">${firstLetter}</div>
                <div class="pers-card-info">
                    <span class="pers-card-name" title="${p.name}">${p.name}</span>
                    <span class="pers-card-label">Alumno Personalizado</span>
                </div>
            </div>
            <div class="pers-card-stats">
                <div class="pers-stat-item">
                    <span class="pers-stat-label">Clases registradas</span>
                    <span class="pers-stat-value">${classes.length}</span>
                </div>
                <div class="pers-stat-item">
                    <span class="pers-stat-label">Estado Financiero</span>
                    <span class="pers-stat-value ${remaining > 0 ? 'debt' : 'clear'}">
                        ${remaining > 0 ? `$${remaining.toLocaleString('es-ES')} pendiente` : 'Al día'}
                    </span>
                </div>
            </div>
            <div class="pers-card-actions">
                <button class="btn-action btn-action-delete" title="Eliminar participante" onclick="event.stopPropagation(); openPersDeleteModal('${p.id}', 'participant');">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        `;

        // Card navigation
        card.addEventListener('click', () => {
            state.selectedPersParticipantId = p.id;
            renderPersView();
        });

        grid.appendChild(card);
    });
}

function renderPersParticipantDetail() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const student = state.persParticipants.find(p => p.id === studentId);
    if (!student) return;

    // Display student name
    const titleEl = document.getElementById('pers-detail-name');
    if (titleEl) titleEl.textContent = student.name;

    const classes = state.persClasses[studentId] || [];
    const payments = state.persPayments[studentId] || [];

    // Financial balance calculations
    const totalCost = classes.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const remaining = totalCost - totalPaid;

    // Display values formatted beautifully
    document.getElementById('pers-stat-total-cost').textContent = `$${totalCost.toLocaleString('es-ES')}`;
    document.getElementById('pers-stat-total-paid').textContent = `$${totalPaid.toLocaleString('es-ES')}`;
    document.getElementById('pers-stat-remaining').textContent = `$${remaining.toLocaleString('es-ES')}`;

    // Glow outstanding status color according to positive or negative debt
    const pendingCard = document.getElementById('pers-stat-pending-card');
    if (pendingCard) {
        if (remaining > 0) {
            pendingCard.className = 'balance-card total-pending outstanding';
            pendingCard.querySelector('.balance-label').textContent = 'Falta por pagar';
        } else {
            pendingCard.className = 'balance-card total-pending no-outstanding';
            pendingCard.querySelector('.balance-label').textContent = 'Saldo a Favor / Al día';
        }
    }

    // === Populate Classes List ===
    const classesTbody = document.getElementById('pers-classes-tbody');
    const classesEmpty = document.getElementById('pers-classes-empty');
    if (classesTbody) {
        classesTbody.innerHTML = '';
        if (classes.length === 0) {
            classesEmpty.classList.remove('hidden');
        } else {
            classesEmpty.classList.add('hidden');
            
            // Sort classes by date descending
            const sortedClasses = [...classes].sort((a,b) => b.date.localeCompare(a.date));
            
            sortedClasses.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${c.day}</strong></td>
                    <td>${c.date.split('-').reverse().join('/')}</td>
                    <td>${c.startTime} - ${c.endTime}</td>
                    <td class="text-right"><strong>$${Number(c.price).toLocaleString('es-ES')}</strong></td>
                    <td class="text-center">
                        <label class="attendance-checkbox-label">
                            <input type="checkbox" ${c.paid ? 'checked' : ''} onchange="togglePersClassPayment('${studentId}', '${c.id}', this.checked)">
                            <span class="checkbox-custom"></span>
                        </label>
                    </td>
                    <td class="text-center">
                        <div class="actions-cell" style="justify-content: center;">
                            <button class="btn-action btn-action-edit" title="Editar clase" onclick="openPersClassEdit('${c.id}');">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-action btn-action-delete" title="Eliminar clase" onclick="openPersDeleteModal('${c.id}', 'class');">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                `;
                classesTbody.appendChild(tr);
            });
        }
    }

    // === Populate Payments List ===
    const paymentsTbody = document.getElementById('pers-payments-tbody');
    const paymentsEmpty = document.getElementById('pers-payments-empty');
    if (paymentsTbody) {
        paymentsTbody.innerHTML = '';
        if (payments.length === 0) {
            paymentsEmpty.classList.remove('hidden');
        } else {
            paymentsEmpty.classList.add('hidden');
            
            // Sort payments by date descending
            const sortedPayments = [...payments].sort((a,b) => b.date.localeCompare(a.date));
            
            sortedPayments.forEach(pay => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${pay.date.split('-').reverse().join('/')}</strong></td>
                    <td class="text-right" style="color: var(--success-color);"><strong>$${Number(pay.amount).toLocaleString('es-ES')}</strong></td>
                    <td class="text-center">
                        <div class="actions-cell" style="justify-content: center;">
                            <button class="btn-action btn-action-edit" title="Editar pago" onclick="openPersPaymentEdit('${pay.id}');">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-action btn-action-delete" title="Eliminar pago" onclick="openPersDeleteModal('${pay.id}', 'payment');">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                `;
                paymentsTbody.appendChild(tr);
            });
        }
    }

    // Render notes
    renderPersNotes(studentId);
}

/* === Add Student Dialog === */
function openPersDrawer() {
    const drawer = document.getElementById('add-pers-participant-drawer');
    const backdrop = document.getElementById('add-pers-participant-drawer-backdrop');
    const input = document.getElementById('drawer-pers-participant-name');
    
    if (drawer && backdrop) {
        drawer.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        void drawer.offsetWidth;
        void backdrop.offsetWidth;
        
        drawer.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('drawer-open');
        
        setTimeout(() => { if (input) input.focus(); }, 200);
    }
}

function closePersDrawer() {
    const drawer = document.getElementById('add-pers-participant-drawer');
    const backdrop = document.getElementById('add-pers-participant-drawer-backdrop');
    const input = document.getElementById('drawer-pers-participant-name');
    
    if (drawer && backdrop) {
        drawer.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('drawer-open');
        
        setTimeout(() => {
            drawer.classList.add('hidden');
            backdrop.classList.add('hidden');
            if (input) input.value = '';
        }, 300);
    }
}

function addPersParticipant() {
    const input = document.getElementById('drawer-pers-participant-name');
    const name = input ? input.value.trim() : '';

    if (!name) return;

    // Check duplicate
    const isDuplicate = state.persParticipants.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
        showToast('Este alumno ya está registrado', 'danger');
        return;
    }

    const newId = 'pers_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newParticipant = {
        id: newId,
        name: name,
        createdAt: Date.now()
    };

    state.persParticipants.push(newParticipant);
    state.persClasses[newId] = [];
    state.persPayments[newId] = [];

    savePersToLocalStorage();
    closePersDrawer();
    renderPersView();
    showToast(`Alumno "${name}" agregado exitosamente`);
}

/* === Add Class Session Dialog === */
function openPersClassModal() {
    const modal = document.getElementById('add-pers-class-modal');
    const backdrop = document.getElementById('add-pers-class-backdrop');
    
    // Set default fields values
    const dateInput = document.getElementById('pers-class-date');
    const startInput = document.getElementById('pers-class-start-time');
    const endInput = document.getElementById('pers-class-end-time');
    const priceInput = document.getElementById('pers-class-price');
    const paidInput = document.getElementById('pers-class-paid-checkbox');

    if (dateInput) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${y}-${m}-${d}`;
    }

    if (startInput) startInput.value = "16:00";
    if (endInput) endInput.value = "17:00";
    if (priceInput) priceInput.value = "";
    if (paidInput) paidInput.checked = false;

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

function closePersClassModal() {
    const modal = document.getElementById('add-pers-class-modal');
    const backdrop = document.getElementById('add-pers-class-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            state.editingPersClassId = null;
            const modalTitle = modal.querySelector('.modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Registrar Clase / Asistencia';
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Registrar';
        }, 300);
    }
}

function handlePersClassSubmit() {
    if (state.editingPersClassId) {
        savePersClassEdit();
    } else {
        addPersClass();
    }
}

function openPersClassEdit(classId) {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const classes = state.persClasses[studentId] || [];
    const classObj = classes.find(c => c.id === classId);
    if (!classObj) return;

    state.editingPersClassId = classId;

    const modal = document.getElementById('add-pers-class-modal');
    const backdrop = document.getElementById('add-pers-class-backdrop');

    // Fill form
    document.getElementById('pers-class-day').value = classObj.day;
    document.getElementById('pers-class-date').value = classObj.date;
    document.getElementById('pers-class-start-time').value = classObj.startTime;
    document.getElementById('pers-class-end-time').value = classObj.endTime;
    document.getElementById('pers-class-price').value = classObj.price;
    document.getElementById('pers-class-paid-checkbox').checked = classObj.paid;

    // Change title and button text
    const title = modal.querySelector('.modal-header h3');
    if (title) title.textContent = 'Editar Clase / Asistencia';

    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';

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

function savePersClassEdit() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const classId = state.editingPersClassId;
    const classes = state.persClasses[studentId] || [];
    const classObj = classes.find(c => c.id === classId);
    if (!classObj) return;

    const day = document.getElementById('pers-class-day').value;
    const date = document.getElementById('pers-class-date').value;
    const startTime = document.getElementById('pers-class-start-time').value;
    const endTime = document.getElementById('pers-class-end-time').value;
    const price = Number(document.getElementById('pers-class-price').value) || 0;
    const isPaid = document.getElementById('pers-class-paid-checkbox').checked;

    if (!date || !startTime || !endTime) {
        showToast('Por favor completa todos los campos requeridos', 'danger');
        return;
    }

    classObj.day = day;
    classObj.date = date;
    classObj.startTime = startTime;
    classObj.endTime = endTime;
    classObj.price = price;

    // Check payment state transitions
    const wasPaid = classObj.paid;
    const oldPaymentId = classObj.paymentId;

    classObj.paid = isPaid;

    if (isPaid) {
        if (wasPaid && oldPaymentId) {
            // Update existing linked payment
            const payments = state.persPayments[studentId] || [];
            const payObj = payments.find(p => p.id === oldPaymentId);
            if (payObj) {
                payObj.date = date;
                payObj.amount = price;
            }
        } else if (price > 0) {
            // Create a new linked payment
            const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const newPayment = {
                id: paymentId,
                date: date,
                amount: price
            };
            if (!state.persPayments[studentId]) state.persPayments[studentId] = [];
            state.persPayments[studentId].push(newPayment);
            classObj.paymentId = paymentId;
        }
    } else {
        if (wasPaid && oldPaymentId) {
            // Remove the linked payment
            state.persPayments[studentId] = (state.persPayments[studentId] || []).filter(pay => pay.id !== oldPaymentId);
            classObj.paymentId = null;
        }
    }

    savePersToLocalStorage();
    closePersClassModal();
    renderPersParticipantDetail();
    showToast('Clase actualizada correctamente');
}

function addPersClass() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const day = document.getElementById('pers-class-day').value;
    const date = document.getElementById('pers-class-date').value;
    const startTime = document.getElementById('pers-class-start-time').value;
    const endTime = document.getElementById('pers-class-end-time').value;
    const price = Number(document.getElementById('pers-class-price').value) || 0;
    const isPaid = document.getElementById('pers-class-paid-checkbox').checked;

    if (!date || !startTime || !endTime) {
        showToast('Por favor completa todos los campos requeridos', 'danger');
        return;
    }

    const classId = 'class_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    let paymentId = null;

    if (isPaid && price > 0) {
        paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newPayment = {
            id: paymentId,
            date: date,
            amount: price
        };
        if (!state.persPayments[studentId]) state.persPayments[studentId] = [];
        state.persPayments[studentId].push(newPayment);
    }

    const newClass = {
        id: classId,
        day: day,
        date: date,
        startTime: startTime,
        endTime: endTime,
        price: price,
        paid: isPaid,
        paymentId: paymentId
    };

    if (!state.persClasses[studentId]) state.persClasses[studentId] = [];
    state.persClasses[studentId].push(newClass);

    savePersToLocalStorage();
    closePersClassModal();
    renderPersParticipantDetail();
    showToast('Clase registrada correctamente');
}

function togglePersClassPayment(studentId, classId, isChecked) {
    const classes = state.persClasses[studentId] || [];
    const classObj = classes.find(c => c.id === classId);
    if (!classObj) return;

    classObj.paid = isChecked;

    if (isChecked) {
        // Automatically create linked payment
        const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newPayment = {
            id: paymentId,
            date: classObj.date,
            amount: classObj.price
        };
        if (!state.persPayments[studentId]) state.persPayments[studentId] = [];
        state.persPayments[studentId].push(newPayment);
        classObj.paymentId = paymentId;
        showToast('Pago registrado y enlazado automáticamente');
    } else {
        // Delete linked payment
        if (classObj.paymentId) {
            state.persPayments[studentId] = (state.persPayments[studentId] || []).filter(pay => pay.id !== classObj.paymentId);
            classObj.paymentId = null;
            showToast('Pago desvinculado y retirado del historial');
        }
    }

    savePersToLocalStorage();
    renderPersParticipantDetail();
}

/* === Add Payment manual Dialog === */
function openPersPaymentModal() {
    const modal = document.getElementById('add-pers-payment-modal');
    const backdrop = document.getElementById('add-pers-payment-backdrop');
    
    const dateInput = document.getElementById('pers-payment-date');
    const amountInput = document.getElementById('pers-payment-amount');

    if (dateInput) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${y}-${m}-${d}`;
    }

    if (amountInput) amountInput.value = "";

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

function closePersPaymentModal() {
    const modal = document.getElementById('add-pers-payment-modal');
    const backdrop = document.getElementById('add-pers-payment-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            state.editingPersPaymentId = null;
            const modalTitle = modal.querySelector('.modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Registrar Pago / Abono';
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Registrar Pago';
        }, 300);
    }
}

function handlePersPaymentSubmit() {
    if (state.editingPersPaymentId) {
        savePersPaymentEdit();
    } else {
        addPersPayment();
    }
}

function openPersPaymentEdit(paymentId) {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const payments = state.persPayments[studentId] || [];
    const payObj = payments.find(p => p.id === paymentId);
    if (!payObj) return;

    state.editingPersPaymentId = paymentId;

    const modal = document.getElementById('add-pers-payment-modal');
    const backdrop = document.getElementById('add-pers-payment-backdrop');

    // Fill form
    document.getElementById('pers-payment-date').value = payObj.date;
    document.getElementById('pers-payment-amount').value = payObj.amount;

    // Change title and button text
    const title = modal.querySelector('.modal-header h3');
    if (title) title.textContent = 'Editar Pago / Abono';

    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';

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

function savePersPaymentEdit() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const paymentId = state.editingPersPaymentId;
    const payments = state.persPayments[studentId] || [];
    const payObj = payments.find(p => p.id === paymentId);
    if (!payObj) return;

    const date = document.getElementById('pers-payment-date').value;
    const amount = Number(document.getElementById('pers-payment-amount').value) || 0;

    if (!date || amount <= 0) {
        showToast('Completa los campos con valores válidos', 'danger');
        return;
    }

    payObj.date = date;
    payObj.amount = amount;

    // Update linked class price and date if any
    const classes = state.persClasses[studentId] || [];
    classes.forEach(c => {
        if (c.paymentId === paymentId) {
            c.price = amount;
            c.date = date;
            const dateObj = new Date(date + 'T00:00:00');
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            c.day = dayNames[dateObj.getDay()];
        }
    });

    savePersToLocalStorage();
    closePersPaymentModal();
    renderPersParticipantDetail();
    showToast('Pago actualizado correctamente');
}

function addPersPayment() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const date = document.getElementById('pers-payment-date').value;
    const amount = Number(document.getElementById('pers-payment-amount').value) || 0;

    if (!date || amount <= 0) {
        showToast('Completa los campos con valores válidos', 'danger');
        return;
    }

    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newPayment = {
        id: paymentId,
        date: date,
        amount: amount
    };

    if (!state.persPayments[studentId]) state.persPayments[studentId] = [];
    state.persPayments[studentId].push(newPayment);

    savePersToLocalStorage();
    closePersPaymentModal();
    renderPersParticipantDetail();
    showToast(`Pago de $${amount.toLocaleString('es-ES')} registrado`);
}

/* === Add Note Dialog & Render Functions === */
function openPersNoteModal() {
    const modal = document.getElementById('add-pers-note-modal');
    const backdrop = document.getElementById('add-pers-note-backdrop');
    
    // Set default fields values
    const dateInput = document.getElementById('pers-note-date');
    const textInput = document.getElementById('pers-note-text');

    if (dateInput) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${y}-${m}-${d}`;
    }

    if (textInput) textInput.value = "";

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

function closePersNoteModal() {
    const modal = document.getElementById('add-pers-note-modal');
    const backdrop = document.getElementById('add-pers-note-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            state.editingPersNoteId = null;
            const modalTitle = modal.querySelector('.modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Agregar Nota de Seguimiento';
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Guardar Nota';
                submitBtn.style.backgroundColor = 'var(--warning-color)';
                submitBtn.style.color = '#ffffff';
            }
        }, 300);
    }
}

function handlePersNoteSubmit() {
    if (state.editingPersNoteId) {
        savePersNoteEdit();
    } else {
        addPersNote();
    }
}

function openPersNoteEdit(noteId) {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const notes = state.persNotes[studentId] || [];
    const noteObj = notes.find(n => n.id === noteId);
    if (!noteObj) return;

    state.editingPersNoteId = noteId;

    const modal = document.getElementById('add-pers-note-modal');
    const backdrop = document.getElementById('add-pers-note-backdrop');

    // Fill form
    document.getElementById('pers-note-date').value = noteObj.date;
    document.getElementById('pers-note-text').value = noteObj.text;

    // Change title and button text
    const title = modal.querySelector('.modal-header h3');
    if (title) title.textContent = 'Editar Nota de Seguimiento';

    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Guardar Cambios';
        submitBtn.style.backgroundColor = 'var(--warning-color)';
        submitBtn.style.color = '#ffffff';
    }

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

function savePersNoteEdit() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const noteId = state.editingPersNoteId;
    const notes = state.persNotes[studentId] || [];
    const noteObj = notes.find(n => n.id === noteId);
    if (!noteObj) return;

    const date = document.getElementById('pers-note-date').value;
    const text = document.getElementById('pers-note-text').value.trim();

    if (!date || !text) {
        showToast('Por favor completa todos los campos', 'danger');
        return;
    }

    noteObj.date = date;
    noteObj.text = text;

    savePersToLocalStorage();
    closePersNoteModal();
    renderPersParticipantDetail();
    showToast('Nota actualizada correctamente');
}

function addPersNote() {
    const studentId = state.selectedPersParticipantId;
    if (!studentId) return;

    const date = document.getElementById('pers-note-date').value;
    const text = document.getElementById('pers-note-text').value.trim();

    if (!date || !text) {
        showToast('Por favor completa todos los campos', 'danger');
        return;
    }

    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newNote = {
        id: noteId,
        date: date,
        text: text
    };

    if (!state.persNotes[studentId]) state.persNotes[studentId] = [];
    state.persNotes[studentId].push(newNote);

    savePersToLocalStorage();
    closePersNoteModal();
    renderPersParticipantDetail();
    showToast('Nota registrada correctamente');
}

function renderPersNotes(studentId) {
    const notesContainer = document.getElementById('pers-notes-container');
    const notesEmpty = document.getElementById('pers-notes-empty');
    if (!notesContainer) return;

    notesContainer.innerHTML = '';
    const notes = state.persNotes[studentId] || [];

    if (notes.length === 0) {
        notesEmpty.classList.remove('hidden');
    } else {
        notesEmpty.classList.add('hidden');
        
        // Sort notes by date descending
        const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));
        
        sortedNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item animate-slide-up';
            noteItem.innerHTML = `
                <div class="note-item-header">
                    <span class="note-item-date">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${note.date.split('-').reverse().join('/')}
                    </span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action btn-action-edit" title="Editar nota" onclick="openPersNoteEdit('${note.id}');">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="btn-action btn-action-delete" title="Eliminar nota" onclick="openPersDeleteModal('${note.id}', 'note');">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="note-item-content">${escapeHTML(note.text)}</div>
            `;
            notesContainer.appendChild(noteItem);
        });
    }
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* === Deletion Personalized Modals === */
function openPersDeleteModal(id, type) {
    state.deletingPersId = id;
    state.deletingPersType = type;

    const confirmTextEl = document.getElementById('pers-delete-confirm-text');
    if (confirmTextEl) {
        if (type === 'participant') {
            const student = state.persParticipants.find(p => p.id === id);
            confirmTextEl.innerHTML = `¿Seguro que deseas eliminar al alumno <strong>${student ? student.name : ''}</strong> de forma permanente? Se borrarán todas sus clases y pagos.`;
        } else if (type === 'class') {
            confirmTextEl.innerHTML = `¿Seguro que deseas eliminar esta clase? Esto desvinculará y borrará el pago si estaba marcado como pagada.`;
        } else if (type === 'payment') {
            confirmTextEl.innerHTML = `¿Seguro que deseas eliminar este registro de pago? Se desmarcará la confirmación de pago de la clase vinculada.`;
        } else if (type === 'note') {
            confirmTextEl.innerHTML = `¿Seguro que deseas eliminar esta nota de seguimiento? Esta acción no se puede deshacer.`;
        }
    }

    const modal = document.getElementById('pers-delete-confirm-modal');
    const backdrop = document.getElementById('pers-delete-confirm-backdrop');
    
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

function closePersDeleteModal() {
    const modal = document.getElementById('pers-delete-confirm-modal');
    const backdrop = document.getElementById('pers-delete-confirm-backdrop');
    
    if (modal && backdrop) {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            state.deletingPersId = null;
            state.deletingPersType = null;
        }, 300);
    }
}

function confirmPersDelete() {
    const id = state.deletingPersId;
    const type = state.deletingPersType;
    const studentId = state.selectedPersParticipantId;

    if (!id || !type) return;

    if (type === 'participant') {
        // Full delete student
        const student = state.persParticipants.find(p => p.id === id);
        const name = student ? student.name : '';

        state.persParticipants = state.persParticipants.filter(p => p.id !== id);
        delete state.persClasses[id];
        delete state.persPayments[id];
        delete state.persNotes[id];

        savePersToLocalStorage();
        closePersDeleteModal();
        
        if (state.selectedPersParticipantId === id) {
            state.selectedPersParticipantId = null;
        }
        renderPersView();
        showToast(`Registro de "${name}" eliminado permanentemente`, 'danger');
        
    } else if (type === 'class') {
        // Delete class session
        const classes = state.persClasses[studentId] || [];
        const classObj = classes.find(c => c.id === id);
        
        if (classObj) {
            // Delete linked payment if exists
            if (classObj.paymentId) {
                state.persPayments[studentId] = (state.persPayments[studentId] || []).filter(pay => pay.id !== classObj.paymentId);
            }
            // Remove class
            state.persClasses[studentId] = classes.filter(c => c.id !== id);
            
            savePersToLocalStorage();
            closePersDeleteModal();
            renderPersParticipantDetail();
            showToast('Clase eliminada del registro', 'danger');
        }
        
    } else if (type === 'payment') {
        // Delete payment registry
        const payments = state.persPayments[studentId] || [];
        const payObj = payments.find(pay => pay.id === id);

        if (payObj) {
            // Uncheck linked classes if any
            const classes = state.persClasses[studentId] || [];
            classes.forEach(c => {
                if (c.paymentId === id) {
                    c.paid = false;
                    c.paymentId = null;
                }
            });

            // Remove payment
            state.persPayments[studentId] = payments.filter(pay => pay.id !== id);

            savePersToLocalStorage();
            closePersDeleteModal();
            renderPersParticipantDetail();
            showToast('Pago eliminado correctamente', 'danger');
        }
    } else if (type === 'note') {
        // Delete note
        const notes = state.persNotes[studentId] || [];
        state.persNotes[studentId] = notes.filter(n => n.id !== id);

        savePersToLocalStorage();
        closePersDeleteModal();
        renderPersParticipantDetail();
        showToast('Nota eliminada correctamente', 'danger');
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadFromLocalStorage();
    initSelectors();
    initEventListeners();
    renderApp();
});
