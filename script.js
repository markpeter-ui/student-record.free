// ==========================================
// STUDENT RECORD SYSTEM - WITH VALIDATION
// ==========================================

// --- STATE ---
let records = [];
let isEditing = false;
let editingId = null;
let searchQuery = '';
let sortBy = 'date-desc';

const STORAGE_KEY = 'student_records_v3';

// --- INITIAL DATA ---
const initialData = [
    { id: '2026-001', name: 'Juan Dela Cruz', program: 'BSIT', date: '2026-09-26', archived: false },
    { id: '2026-002', name: 'Pedro Cruz', program: 'BSCS', date: '2026-09-26', archived: false },
    { id: '2024-004', name: 'Ana Lopez', program: 'BS Information Technology', date: '2026-09-26', archived: true },
    { id: '2024-005', name: 'Jose Ramirez', program: 'BS Computer Science', date: '2026-09-26', archived: true },
];

// --- DOM ELEMENTS ---
const form = document.getElementById('record-form');
const studentIdInput = document.getElementById('studentId');
const fullNameInput = document.getElementById('fullName');
const programInput = document.getElementById('program');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const filledCount = document.getElementById('filled-count');

const activeList = document.getElementById('active-list');
const archivedList = document.getElementById('archived-list');
const activeCount = document.getElementById('active-count');
const archivedCount = document.getElementById('archived-count');
const activeSection = document.getElementById('active-records-section');
const archivedSection = document.getElementById('archived-records-section');
const backToActiveBtn = document.getElementById('back-to-active-btn');
const archiveToggleBtn = document.getElementById('archive-toggle-btn');
const archiveToggleContainer = document.getElementById('archive-toggle-container');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInput = document.getElementById('modal-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

let modalAction = null;
let toastTimeout = null;

// ==========================================
// LOCAL STORAGE
// ==========================================
const loadRecords = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            records = JSON.parse(stored);
        } else {
            records = [...initialData];
            saveRecords();
        }
    } catch (e) {
        console.error('Load error:', e);
        records = [...initialData];
    }
};

const saveRecords = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
        console.error('Save error:', e);
    }
};

// ==========================================
// TOAST
// ==========================================
const showToast = (message, type = 'success') => {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.className = 'toast';
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toastIcon.textContent = icons[type] || icons.success;
    
    if (type === 'error') toast.classList.add('error');
    if (type === 'info') toast.classList.add('info');

    void toast.offsetWidth;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

// Student ID: Format YYYY-XXX (4 digits, dash, 3 digits)
const validateId = (value) => {
    return /^\d{4}-\d{3}$/.test(value);
};

// Full Name: Letters, spaces, dots, hyphens, apostrophes only (no numbers)
const validateName = (value) => {
    const regex = /^[a-zA-Z\s.\-']+$/;
    return value.trim().length >= 2 && regex.test(value);
};

// Program: Required, at least 2 characters
const validateProgram = (value) => {
    return value.trim().length >= 2;
};

// ==========================================
// CHECK FORM VALIDITY
// ==========================================
const checkFormValidity = () => {
    const idValue = studentIdInput.value;
    const nameValue = fullNameInput.value;
    const programValue = programInput.value;

    const isIdValid = validateId(idValue);
    const isNameValid = validateName(nameValue);
    const isProgramValid = validateProgram(programValue);

    // --- Student ID Error ---
    if (idValue.length > 0 && !isIdValid) {
        studentIdInput.classList.add('error');
        studentIdInput.classList.remove('valid');
        document.getElementById('id-error').style.display = 'block';
    } else if (isIdValid) {
        studentIdInput.classList.remove('error');
        studentIdInput.classList.add('valid');
        document.getElementById('id-error').style.display = 'none';
    } else {
        studentIdInput.classList.remove('error', 'valid');
        document.getElementById('id-error').style.display = 'none';
    }

    // --- Full Name Error ---
    if (nameValue.length > 0 && !isNameValid) {
        fullNameInput.classList.add('error');
        fullNameInput.classList.remove('valid');
        document.getElementById('name-error').style.display = 'block';
    } else if (isNameValid) {
        fullNameInput.classList.remove('error');
        fullNameInput.classList.add('valid');
        document.getElementById('name-error').style.display = 'none';
    } else {
        fullNameInput.classList.remove('error', 'valid');
        document.getElementById('name-error').style.display = 'none';
    }

    // --- Program Error ---
    if (programValue.length > 0 && !isProgramValid) {
        programInput.classList.add('error');
        programInput.classList.remove('valid');
        document.getElementById('program-error').style.display = 'block';
    } else if (isProgramValid) {
        programInput.classList.remove('error');
        programInput.classList.add('valid');
        document.getElementById('program-error').style.display = 'none';
    } else {
        programInput.classList.remove('error', 'valid');
        document.getElementById('program-error').style.display = 'none';
    }

    // --- Filled Count ---
    let filled = 0;
    if (idValue) filled++;
    if (nameValue) filled++;
    if (programValue) filled++;
    filledCount.textContent = `${filled} filled`;
    filledCount.classList.toggle('complete', filled === 3);

    // --- Save Button ---
    const allValid = isIdValid && isNameValid && isProgramValid;
    saveBtn.disabled = !allValid;

    return allValid;
};

// ==========================================
// AUTO-FORMAT STUDENT ID (YYYY-XXX)
// ==========================================
studentIdInput.addEventListener('input', (e) => {
    // Kunin ang digits lang
    let digits = e.target.value.replace(/\D/g, '');
    
    // Limit sa 7 digits
    if (digits.length > 7) digits = digits.slice(0, 7);
    
    // I-format: 4 digits + dash + 3 digits
    let formatted = digits;
    if (digits.length > 4) {
        formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    }
    
    // I-set ang value
    e.target.value = formatted;
    
    // I-validate
    checkFormValidity();
});

// ==========================================
// FULL NAME - Auto-filter invalid characters
// ==========================================
fullNameInput.addEventListener('input', (e) => {
    // Alisin ang numbers at special characters (maliban sa space, dot, hyphen, apostrophe)
    e.target.value = e.target.value.replace(/[^a-zA-Z\s.\-']/g, '');
    checkFormValidity();
});

// ==========================================
// PROGRAM - Real-time validation
// ==========================================
programInput.addEventListener('input', checkFormValidity);

// ==========================================
// FILTER & SORT
// ==========================================
const getFilteredSortedRecords = (archivedStatus) => {
    let filtered = records.filter(r => r.archived === archivedStatus);

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
            r.id.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.program.toLowerCase().includes(q)
        );
    }

    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc': return new Date(b.date) - new Date(a.date);
            case 'date-asc': return new Date(a.date) - new Date(b.date);
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });

    return filtered;
};

// ==========================================
// RENDER
// ==========================================
const formatDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

const renderEmptyState = (message, icon = '📭') => `
    <div class="empty-state">
        <span class="icon">${icon}</span>
        ${message}
    </div>
`;

const renderRecords = () => {
    const activeRecords = getFilteredSortedRecords(false);
    const archivedRecords = getFilteredSortedRecords(true);

    activeCount.textContent = records.filter(r => !r.archived).length;
    archivedCount.textContent = records.filter(r => r.archived).length;

    activeList.innerHTML = activeRecords.length === 0
        ? renderEmptyState(searchQuery ? 'No active records match your search.' : 'No active records yet. Add one above!')
        : activeRecords.map(record => `
            <div class="record-item">
                <div class="record-item-header">
                    <span class="record-id">ID: ${record.id}</span>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editRecord('${record.id}')">✎ EDIT</button>
                        <button class="btn-archive" onclick="promptArchive('${record.id}')">🗑️ ARCHIVE</button>
                    </div>
                </div>
                <div class="record-name">${record.name}</div>
                <div class="record-program">${record.program}</div>
                <div class="record-date">FILED: ${formatDate(record.date)}</div>
            </div>
        `).join('');

    archivedList.innerHTML = archivedRecords.length === 0
        ? renderEmptyState(searchQuery ? 'No archived records match your search.' : 'No archived records.', '📦')
        : archivedRecords.map(record => `
            <div class="record-item" style="opacity: 0.85;">
                <div class="record-item-header">
                    <span class="record-id">ID: ${record.id}</span>
                    <div class="action-buttons">
                        <button class="btn-restore" onclick="promptRestore('${record.id}')">↺ RESTORE</button>
                        <button class="btn-archive" onclick="promptPermanentDelete('${record.id}')">✖ DELETE</button>
                    </div>
                </div>
                <div class="record-name">${record.name}</div>
                <div class="record-program">${record.program}</div>
                <div class="record-date">FILED: ${formatDate(record.date)}</div>
            </div>
        `).join('');
};

// ==========================================
// FORM SUBMIT
// ==========================================
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!checkFormValidity()) {
        showToast('Please fill in all fields correctly.', 'error');
        return;
    }

    const newRecord = {
        id: studentIdInput.value,
        name: fullNameInput.value.trim(),
        program: programInput.value.trim(),
        date: new Date().toISOString().split('T')[0],
        archived: false
    };

    // Duplicate ID check
    const isDuplicate = records.some(r => r.id === newRecord.id && r.id !== editingId);
    if (isDuplicate) {
        showModal(
            '⚠️ Duplicate ID',
            'A record with this Student ID already exists. Please use a unique ID.',
            () => closeModal(),
            false,
            'info'
        );
        return;
    }

    if (isEditing && editingId) {
        const index = records.findIndex(r => r.id === editingId);
        if (index !== -1) {
            records[index] = { ...records[index], ...newRecord };
        }
        showToast('Record updated successfully!', 'success');
        isEditing = false;
        editingId = null;
        saveBtn.innerHTML = '💾 SAVE RECORD';
    } else {
        records.push(newRecord);
        showToast('Record saved successfully!', 'success');
    }

    saveRecords();
    renderRecords();
    resetForm();
});

// ==========================================
// RESET FORM
// ==========================================
const resetForm = () => {
    form.reset();
    isEditing = false;
    editingId = null;
    saveBtn.innerHTML = '💾 SAVE RECORD';
    
    // Alisin ang error/valid classes
    studentIdInput.classList.remove('error', 'valid');
    fullNameInput.classList.remove('error', 'valid');
    programInput.classList.remove('error', 'valid');
    
    // Itago ang error messages
    document.getElementById('id-error').style.display = 'none';
    document.getElementById('name-error').style.display = 'none';
    document.getElementById('program-error').style.display = 'none';
    
    checkFormValidity();
    studentIdInput.focus();
};

clearBtn.addEventListener('click', resetForm);

// ==========================================
// RECORD ACTIONS
// ==========================================
window.editRecord = (id) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    studentIdInput.value = record.id;
    fullNameInput.value = record.name;
    programInput.value = record.program;
    isEditing = true;
    editingId = id;
    saveBtn.innerHTML = '💾 UPDATE RECORD';
    checkFormValidity();

    document.getElementById('form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    fullNameInput.focus();
    showToast('Editing record. Make changes and click Update.', 'info');
};

window.promptArchive = (id) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    showModal(
        '📦 Archive Record',
        `Are you sure you want to archive <strong>${record.name}</strong>?<br><br>It will be moved to the Archived section. No data will be permanently deleted.`,
        () => {
            record.archived = true;
            saveRecords();
            renderRecords();
            closeModal();
            showToast('Record archived successfully!', 'info');
        }
    );
};

window.promptRestore = (id) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    showModal(
        '↺ Restore Record',
        `Are you sure you want to restore <strong>${record.name}</strong> back to the Active list?`,
        () => {
            record.archived = false;
            saveRecords();
            renderRecords();
            closeModal();
            showToast('Record restored successfully!', 'success');
        }
    );
};

window.promptPermanentDelete = (id) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    showModal(
        '⚠️ PERMANENT DELETION',
        `This action <strong>cannot be undone</strong>. All data for <strong>${record.name}</strong> will be lost forever.<br><br>To confirm, please type <strong>DELETE</strong> below.`,
        () => {
            if (modalInput.value.trim().toUpperCase() === 'DELETE') {
                records = records.filter(r => r.id !== id);
                saveRecords();
                renderRecords();
                closeModal();
                showToast('Record permanently deleted.', 'error');
            } else {
                showToast('Incorrect confirmation word. Deletion cancelled.', 'error');
            }
        },
        true
    );
};

// ==========================================
// MODAL
// ==========================================
const showModal = (title, message, onConfirm, requireInput = false, type = 'warning') => {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modalInput.style.display = requireInput ? 'block' : 'none';
    modalInput.value = '';
    modalAction = onConfirm;

    modalConfirm.style.backgroundColor = type === 'info' ? 'var(--accent-blue)' : 'var(--accent-red)';

    modalOverlay.classList.add('active');

    if (requireInput) {
        setTimeout(() => modalInput.focus(), 100);
    }
};

const closeModal = () => {
    modalOverlay.classList.remove('active');
    modalAction = null;
    modalInput.value = '';
};

modalCancel.addEventListener('click', closeModal);
modalConfirm.addEventListener('click', () => {
    if (modalAction) modalAction();
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        modalConfirm.click();
    }
});

// ==========================================
// NAVIGATION
// ==========================================
const switchView = (view) => {
    if (view === 'active') {
        activeSection.style.display = 'flex';
        archivedSection.style.display = 'none';
        archiveToggleContainer.style.display = 'flex';
    } else {
        activeSection.style.display = 'none';
        archivedSection.style.display = 'flex';
        archiveToggleContainer.style.display = 'none';
    }
};

backToActiveBtn.addEventListener('click', () => switchView('active'));
archiveToggleBtn.addEventListener('click', () => switchView('archived'));

// ==========================================
// SEARCH & SORT
// ==========================================
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderRecords();
});

sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderRecords();
});

// ==========================================
// INIT
// ==========================================
const init = () => {
    loadRecords();
    renderRecords();
    checkFormValidity();
    switchView('active');
    studentIdInput.focus();
};

init();