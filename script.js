// Auto-save functionality
const AUTO_SAVE_KEY = 'supportCallFormData';
const AUTO_SAVE_INTERVAL = 2000; // Save every 2 seconds

function saveFormData() {
    const formData = {
        callerType: document.getElementById('callerType').value,
        otherUserName: document.getElementById('otherUserName').value,
        callbackNumber: document.getElementById('callbackNumber').value,
        callReason: document.getElementById('callReason').value,
        agentNotes: document.getElementById('agentNotes').value,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
}

function loadFormData() {
    const savedData = localStorage.getItem(AUTO_SAVE_KEY);
    if (savedData) {
        const formData = JSON.parse(savedData);

        // Check if data is less than 24 hours old
        const now = new Date().getTime();
        const isExpired = now - formData.timestamp > 24 * 60 * 60 * 1000;

        if (!isExpired) {
            document.getElementById('callerType').value = formData.callerType;
            document.getElementById('otherUserName').value = formData.otherUserName;
            document.getElementById('callbackNumber').value = formData.callbackNumber;
            document.getElementById('callReason').value = formData.callReason;
            document.getElementById('agentNotes').value = formData.agentNotes;

            // Show other user fields if needed
            if (formData.callerType === 'Other User') {
                document.getElementById('otherUserFields').classList.remove('hidden');
            }

            // Update character count
            const currentLength = formData.agentNotes.length;
            document.getElementById('currentCount').textContent = currentLength;

            // Validate form
            validateForm();

            showNotification('Form data restored from auto-save', 'success');
        } else {
            localStorage.removeItem(AUTO_SAVE_KEY);
        }
    }
}

// Start auto-save interval
let autoSaveInterval = setInterval(saveFormData, AUTO_SAVE_INTERVAL);

// Form validation state
let formState = {
    otherUserName: true,
    callbackNumber: true,
    agentNotes: true
};

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Validate phone number
function isValidPhoneNumber(phone) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Autocomplete functionality
const commonPhrases = [
    "called to report",
    "called to complaint ",
    "issue Resolved",
    "escalated to ",
    "escalated to Shared Services ",
    "escalated to Local Supervisor ",
    "escalated to Live Supervisor ",
    "Xfer to ",
    "xfer to Retention ",
    "xfer to Sales ",
    "xfer to Mobile Sales ",
    "xfer to Billing ",
    "xfer to Spanish ",
];

let currentPhrases = [];
let selectedIndex = -1;

// Handle autocomplete input
function handleAutocomplete(e) {
    const textarea = e.target;
    const container = document.querySelector('.autocomplete-container');
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    const lastWord = text.slice(0, cursorPosition).split(' ').pop();

    if (lastWord.length >= 3) {
        currentPhrases = commonPhrases.filter(phrase =>
            phrase.toLowerCase().includes(lastWord.toLowerCase())
        );

        if (currentPhrases.length > 0) {
            container.innerHTML = currentPhrases
                .map(phrase => `<div class="autocomplete-item">${phrase}</div>`)
                .join('');
            container.style.display = 'block';
            selectedIndex = -1;

            container.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                item.addEventListener('click', () => insertPhrase(index));
            });
        } else {
            container.style.display = 'none';
        }
    } else {
        container.style.display = 'none';
    }
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    const container = document.querySelector('.autocomplete-container');
    const items = container.querySelectorAll('.autocomplete-item');

    if (container.style.display === 'block') {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    insertPhrase(selectedIndex);
                }
                break;
            case 'Escape':
                container.style.display = 'none';
                selectedIndex = -1;
                break;
        }
    }
}

// Update selection highlight
function updateSelection() {
    const items = document.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
        if (index === selectedIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

// Insert selected phrase
function insertPhrase(index) {
    const textarea = document.getElementById('agentNotes');
    const phrase = currentPhrases[index];
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    const words = text.slice(0, cursorPos).split(' ');
    words.pop(); // Remove partial word
    const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + phrase;

    textarea.value = newText + text.slice(cursorPos);
    textarea.focus();
    document.querySelector('.autocomplete-container').style.display = 'none';
    validateForm();
}

// Character count for notes
document.getElementById('agentNotes').addEventListener('input', function () {
    const maxLength = this.getAttribute('maxlength');
    const currentLength = this.value.length;
    document.getElementById('currentCount').textContent = currentLength;
    document.getElementById('maxCount').textContent = maxLength;
});

// Handle caller type changes
document.getElementById('callerType').addEventListener('change', function () {
    const otherUserFields = document.getElementById('otherUserFields');
    if (this.value === 'Other User') {
        otherUserFields.classList.remove('hidden');
    } else {
        otherUserFields.classList.add('hidden');
        document.getElementById('otherUserName').value = '';
    }
    validateForm();
});

// Form validation
function validateForm() {
    const callerType = document.getElementById('callerType').value;
    const callbackNumber = document.getElementById('callbackNumber').value;
    const agentNotes = document.getElementById('agentNotes').value;

    formState = {
        otherUserName: true,
        callbackNumber: true,
        agentNotes: true
    };

    if (callerType === 'Other User') {
        const otherUserName = document.getElementById('otherUserName').value;
        formState.otherUserName = otherUserName.trim() !== '';
        document.getElementById('otherUserFields').classList.toggle('error', !formState.otherUserName);
    }

    formState.callbackNumber = isValidPhoneNumber(callbackNumber);
    document.getElementById('callbackNumber').parentElement.classList.toggle('error', !formState.callbackNumber);

    formState.agentNotes = agentNotes.trim() !== '';
    document.getElementById('agentNotes').parentElement.classList.toggle('error', !formState.agentNotes);

    return Object.values(formState).every(value => value === true);
}

// Generate template
function generateTemplate() {
    if (!validateForm()) {
        showNotification('Please fill in all required fields correctly', 'error');
        return;
    }

    const callerType = document.getElementById('callerType').value;
    const callbackNumber = document.getElementById('callbackNumber').value;
    const callReason = document.getElementById('callReason').value;
    const agentNotes = document.getElementById('agentNotes').value;

    let template = `__TECHNICAL_SUPPORT__`;
    if (callerType === 'Other User') {
        const otherUserName = document.getElementById('otherUserName').value;
        template += `\n#CALLER_NAME: ${otherUserName}`;
    }

    template += `\n#CALLER_TYPE: ${callerType}
#BEST_CB#: ${callbackNumber}
#CALL_REASON: ${callReason}
#AGENT_NOTES:- ${agentNotes}`;

    document.getElementById('outputTemplate').textContent = template;
    document.getElementById('copyButton').disabled = false;
    showNotification('Template generated successfully', 'success');
}

// Copy to clipboard
function copyToClipboard() {
    const outputText = document.getElementById('outputTemplate').textContent;
    if (!outputText) {
        showNotification('Please generate the template first', 'error');
        return;
    }

    navigator.clipboard.writeText(outputText)
        .then(() => showNotification('Template copied to clipboard', 'success'))
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy to clipboard', 'error');
        });
}

// Reset form confirmation
function showResetConfirmation() {
    const modal = document.getElementById('resetConfirmationModal');
    modal.classList.add('show');
    // Focus the Yes button
    document.querySelector('#resetConfirmationModal .primary-btn').focus();
}

function handleResetConfirmation(confirmed) {
    const modal = document.getElementById('resetConfirmationModal');
    modal.classList.remove('show');
    if (confirmed) resetForm();
}

// Reset form
function resetForm() {
    // Clear localStorage
    localStorage.removeItem(AUTO_SAVE_KEY);

    document.getElementById('callerType').selectedIndex = 0;
    document.getElementById('otherUserName').value = '';
    document.getElementById('callbackNumber').value = '';
    document.getElementById('callReason').selectedIndex = 0;
    document.getElementById('agentNotes').value = '';
    document.getElementById('currentCount').textContent = '0';
    document.getElementById('otherUserFields').classList.add('hidden');
    document.getElementById('outputTemplate').textContent = '';
    document.getElementById('copyButton').disabled = true;

    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    formState = {
        otherUserName: true,
        callbackNumber: true,
        agentNotes: true
    };

    showNotification('Form has been reset', 'success');
}

// Theme handling
function initTheme() {
    document.documentElement.className = 'dark';
}

function toggleTheme() {
    const html = document.documentElement;
    html.className = html.className === 'dark' ? 'light' : 'dark';
}

// Event listeners
document.getElementById('agentNotes').addEventListener('input', handleAutocomplete);
document.getElementById('agentNotes').addEventListener('keydown', handleKeyboardNavigation);

document.addEventListener('click', function (e) {
    if (!e.target.closest('.textarea-container')) {
        document.querySelector('.autocomplete-container').style.display = 'none';
    }
    if (e.target === document.getElementById('resetConfirmationModal')) {
        e.target.classList.remove('show');
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.getElementById('resetConfirmationModal').classList.remove('show');
    }
});

// Handle modal keyboard events
function handleModalKeyPress(e) {
    if (!document.getElementById('resetConfirmationModal').classList.contains('show')) {
        return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleResetConfirmation(true);
    } else if (e.key === 'Escape') {
        handleResetConfirmation(false);
    }
}

document.addEventListener('keydown', handleModalKeyPress);

// Form field input listeners
['otherUserName', 'callbackNumber', 'agentNotes'].forEach(id => {
    document.getElementById(id).addEventListener('input', validateForm);
});

// Form field change listeners for immediate save
['callerType', 'otherUserName', 'callbackNumber', 'callReason', 'agentNotes'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveFormData);
    document.getElementById(id).addEventListener('input', saveFormData);
});

// Initialize theme and load saved data
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    loadFormData();
    
    const agentNotes = document.getElementById('agentNotes');
    agentNotes.spellcheck = true;
    agentNotes.lang = 'en';
});
