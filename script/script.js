const CONFIG = {
    defaultSearchTemplate: 'https://duckduckgo.com/?q={}',
    openLinksInNewTab: false,
    shortcuts: {
        ],
        'r': [
            { name: 'Reddit', url: 'https://www.reddit.com' },
            { name: 'r/archlinux', url: 'https://www.reddit.com/r/archlinux' },
            { name: 'r/kde', url: 'https://www.reddit.com/r/kde' },
            { name: 'r/neovim', url: 'https://www.reddit.com/r/neovim' }
        ],
        't': [
            { name: 'DeepL', url: 'https://www.deepl.com/translator' }
        ],
        'y': [
            { name: 'YouTube', url: 'https://youtube.com/feed/subscriptions' }
        ],
        '?': [
            { name: 'Help', url: 'https://github.com/results-may-vary-org/surf' }
        ],
        'st': [
            { name: 'Settings', url: 'settings://', special: true }
        ]
    }
};

// Elements
const commands = document.getElementById('commands');
const selectedInfo = document.getElementById('selectedInfo');
const settingsOverlay = document.getElementById('settingsOverlay');
const themeList = document.getElementById('themeList');
const realInput = document.getElementById('realInput');
const multipleChoicesList = document.getElementById('multipleChoicesList');

let currentQuery = '';
let activeSuggestionIndex = -1;
let currentCommandIndex = -1;
let commandKeys = [];
let isInputMode = false;

// Settings management
const SETTINGS_KEY = 'surf-navigator-settings';
let settings = {
    theme: 'drake'
};

// Load settings from localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Could not load settings:', e);
    }
    applyTheme(settings.theme);
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Could not save settings:', e);
    }
}

// Apply theme with animation
function applyTheme(theme, fromUserSelection = false) {
    if (fromUserSelection) {
        // First close the modal
        closeSettings();

        // Then animate the theme change after modal closes
        setTimeout(() => {
            // Add flash animation class
            document.body.classList.add('theme-changing');

            // Apply the new theme
            document.body.setAttribute('data-theme', theme);
            settings.theme = theme;
            updateThemeButtons();
            saveSettings();

            // Remove animation class after animation completes
            setTimeout(() => {
                document.body.classList.remove('theme-changing');
            }, 800);
        }, 300); // Wait for modal close animation
    } else {
        // Direct theme application for initial load
        document.body.setAttribute('data-theme', theme);
        settings.theme = theme;
        updateThemeButtons();
        saveSettings();
    }
}

// Update theme buttons visual state
function updateThemeButtons() {
    themeList.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
}

// Render only primary commands by default
function renderCommands() {
    commands.innerHTML = '';
    commandKeys = [];
    Object.entries(CONFIG.shortcuts).forEach(([key, shortcuts]) => {
        // Show only the first (primary) shortcut for each key
        const primaryShortcut = shortcuts[0];
        const cmd = document.createElement('div');
        cmd.className = 'command';
        cmd.innerHTML = `<span class="key">${key}</span><span class="name">${primaryShortcut.name}</span>`;
        cmd.dataset.key = key;
        cmd.dataset.index = 0;
        cmd.tabIndex = 0; // Make focusable
        cmd.setAttribute('role', 'button');
        cmd.setAttribute('aria-label', `Navigate to ${primaryShortcut.name}`);

        // Add keyboard support for accessibility
        cmd.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const shortcuts = CONFIG.shortcuts[key];
                if (shortcuts.length === 1) {
                    execute(shortcuts[0].url);
                } else {
                    currentQuery = key;
                    enterInputMode();
                    const parsed = parseQuery(key);
                    if (parsed && parsed.type === 'command') {
                        highlightCommands(key);
                        renderMultipleChoices(shortcuts, key);
                    }
                }
            }
        });

        commands.appendChild(cmd);
        commandKeys.push(key);
    });
}

// Update selected info display
function updateSelectedInfo(key = null) {
    if (key && CONFIG.shortcuts[key]) {
        const shortcut = CONFIG.shortcuts[key][0];
        selectedInfo.innerHTML = `<div class="selected-url">${shortcut.url}</div>`;
        selectedInfo.className = 'selected-url';
    } else {
        selectedInfo.innerHTML = 'Select a command with Tab or type to search';
        selectedInfo.className = 'no-selection';
    }
}

// Parse query like in the old code
function parseQuery(query) {
    const trimmed = query.trim();

    if (!trimmed) return null;

    // Check if it's a single command key
    if (CONFIG.shortcuts[trimmed]) {
        return { type: 'command', key: trimmed, shortcuts: CONFIG.shortcuts[trimmed] };
    }

    // Otherwise it's a search
    return { type: 'search', query: trimmed };
}

// Execute URL or special commands
function execute(url) {
    if (url === 'settings://') {
        openSettings();
        return;
    }

    if (CONFIG.openLinksInNewTab) {
        window.open(url, '_blank', 'noopener noreferrer');
    } else {
        window.location.href = url;
    }
}

// Settings popup control
function openSettings() {
    settingsOverlay.classList.add('open');
    updateThemeButtons();
    // Focus the first theme option for keyboard navigation
    const firstTheme = themeList.querySelector('.theme-option');
    if (firstTheme) {
        setTimeout(() => firstTheme.focus(), 100);
    }
}

function closeSettings() {
    settingsOverlay.classList.remove('open');
}


// Input display control - now always visible
function enterInputMode() {
    isInputMode = true;
    // Focus input immediately so it can receive the keystroke
    if (!realInput.matches(':focus')) {
        realInput.focus();
    }
    updateInputDisplay();
}

function exitInputMode() {
    isInputMode = false;
    currentQuery = '';
    activeSuggestionIndex = -1;
    multipleChoicesList.innerHTML = '';
    multipleChoicesList.style.display = 'none';
    clearHighlights();

    // Clear the input and blur it
    realInput.value = '';
    realInput.blur();

    clearFocus();
    currentCommandIndex = -1;

    updateInputDisplay();
}

function updateInputDisplay() {
    // Don't modify input value here - let the input handle its own value
    // Only sync if there's a mismatch (like when programmatically clearing)
    if (realInput.value !== currentQuery) {
        realInput.value = currentQuery || '';
    }

    const parsed = parseQuery(currentQuery);
    if (parsed && parsed.type === 'command' && parsed.shortcuts.length > 1) {
        highlightCommands(parsed.key);
        renderMultipleChoices(parsed.shortcuts, parsed.key);
        multipleChoicesList.style.display = 'flex';
        selectedInfo.textContent = `Multiple options for '${parsed.key}' - use hjkl/tab to navigate, Enter to select`;
    } else if (parsed && parsed.type === 'search') {
        clearHighlights();
        multipleChoicesList.innerHTML = '';
        multipleChoicesList.style.display = 'none';
        selectedInfo.textContent = `Search: "${parsed.query}" - press Enter to search`;
    } else {
        clearHighlights();
        multipleChoicesList.innerHTML = '';
        multipleChoicesList.style.display = 'none';
        if (currentQuery) {
            selectedInfo.textContent = 'Type more or press Enter to search';
        } else {
            selectedInfo.textContent = 'Select a command with hjkl/tab or type to search';
        }
    }
}

function renderMultipleChoices(shortcuts, key) {
    multipleChoicesList.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        const choice = document.createElement('div');
        choice.className = 'choice-line';
        choice.innerHTML = `<span class="key-item">${key}${index + 1}:</span> ${shortcut.name}`;
        if (index !== shortcuts.length-1) choice.innerHTML += ' / ';
        choice.dataset.tabindex = index;
        choice.dataset.index = index;
        choice.dataset.url = shortcut.url;
        choice.tabIndex = 0;
        choice.setAttribute('role', 'button');
        choice.setAttribute('aria-label', `Navigate to ${shortcut.name}`);

        choice.addEventListener('click', () => {
            execute(shortcut.url);
            exitInputMode();
        });

        // Add keyboard support for accessibility
        choice.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                execute(shortcut.url);
                exitInputMode();
            }
        });
        multipleChoicesList.appendChild(choice);
    });

    // Set first option as selected if none is selected
    if (activeSuggestionIndex < 0) {
        activeSuggestionIndex = 0;
    }

    // Clear focus from main commands when multiple choices appear
    clearFocus();
    currentCommandIndex = -1;

    updateActiveChoice();

    // Don't auto-focus choices - keep input focused so user can continue typing
}

function updateActiveChoice() {
    multipleChoicesList.querySelectorAll('.choice-line').forEach((choice, index) => {
        choice.classList.toggle('selected', index === activeSuggestionIndex);
    });
}

// Legacy functions for compatibility
function openSearch() {
    enterInputMode();
}

function closeSearch() {
    exitInputMode();
}

function clearHighlights() {
    document.querySelectorAll('.command').forEach(cmd => {
        cmd.classList.remove('highlight');
    });
}

function highlightCommands(key) {
    clearHighlights();
    document.querySelectorAll(`[data-key="${key}"]`).forEach(cmd => {
        cmd.classList.add('highlight');
    });
}

// Navigation functions
function focusCommand(index) {
    clearFocus();
    if (index >= 0 && index < commandKeys.length) {
        currentCommandIndex = index;
        const key = commandKeys[index];
        const cmd = document.querySelector(`[data-key="${key}"]`);
        if (cmd) {
            cmd.classList.add('focused');
            cmd.focus();
            updateSelectedInfo(key);
        }
    }
}

function clearFocus() {
    document.querySelectorAll('.command').forEach(cmd => {
        cmd.classList.remove('focused');
    });
    updateSelectedInfo(); // Clear selection display
}

function navigateCommands(direction) {
    if (currentCommandIndex === -1) {
        focusCommand(0);
    } else {
        let newIndex = currentCommandIndex + direction;
        if (newIndex < 0) {
            newIndex = commandKeys.length - 1;
        } else if (newIndex >= commandKeys.length) {
            newIndex = 0;
        }
        focusCommand(newIndex);
    }
}

function executeCurrentCommand() {
    if (currentCommandIndex >= 0) {
        const key = commandKeys[currentCommandIndex];
        const shortcuts = CONFIG.shortcuts[key];

        if (shortcuts.length === 1) {
            // Single shortcut, execute directly
            execute(shortcuts[0].url);
        } else {
            // Multiple shortcuts, enter input mode
            currentQuery = key;
            enterInputMode();
            const parsed = parseQuery(key);
            if (parsed && parsed.type === 'command') {
                highlightCommands(key);
                renderMultipleChoices(shortcuts, key);
            }
        }
    }
}

// Real input event listeners
realInput.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    activeSuggestionIndex = -1; // Reset selection

    // Enter input mode if not already in it (for when user clicks and types)
    if (!isInputMode) {
        isInputMode = true;
    }

    updateInputDisplay();

    // Exit input mode if the input becomes empty
    if (currentQuery === '') {
        setTimeout(() => {
            if (currentQuery === '' && !realInput.matches(':focus')) {
                exitInputMode();
            }
        }, 100);
    }
});

realInput.addEventListener('focus', () => {
    isInputMode = true;
});

realInput.addEventListener('blur', () => {
    // Don't exit input mode on blur if multiple choices are showing
    // This allows Tab navigation between choices
    const hasMultipleChoices = multipleChoicesList.style.display !== 'none' &&
                              multipleChoicesList.querySelectorAll('.choice-line').length > 0;
    if (!hasMultipleChoices && currentQuery === '') {
        isInputMode = false;
        updateInputDisplay();
    }
});

// Special handling for navigation keys in the input
realInput.addEventListener('keydown', (e) => {
    // Handle Enter key in input
    if (e.key === 'Enter') {
        e.preventDefault();
        // This will be handled by the main keydown handler
        return;
    }

    // hjkl and arrow keys work normally for text editing when input is focused
});

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (settingsOverlay.classList.contains('open')) {
            closeSettings();
        } else if (isInputMode) {
            closeSearch();
            clearFocus();
            currentCommandIndex = -1;
        } else {
            clearFocus();
            currentCommandIndex = -1;
        }
        return;
    }

    if (!isInputMode && !settingsOverlay.classList.contains('open')) {
        // Navigation on main interface
        if (e.key === 'j' || e.key === 'k') {
            e.preventDefault();
            navigateCommands(e.key === 'k' ? -1 : 1);
            return;
        } else if (e.key === 'h' || e.key === 'l') {
            e.preventDefault();
            navigateCommands(e.key === 'h' ? -1 : 1);
            return;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            executeCurrentCommand();
            return;
        }

        // Open input mode on any character key - let the input handle the typing
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault(); // Prevent default to avoid double input
            clearFocus();
            currentCommandIndex = -1;
            enterInputMode();
            // Manually add the character since we prevented default
            realInput.value = e.key;
            currentQuery = e.key;
            updateInputDisplay();
        }
    } else if (isInputMode) {
        // Handle input mode - most typing is handled by the real input
        if (e.key === 'Enter') {
            e.preventDefault();
            const parsed = parseQuery(currentQuery);
            if (parsed) {
                if (parsed.type === 'command' && parsed.shortcuts.length > 1) {
                    // Execute selected choice or first one
                    const choiceIndex = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
                    execute(parsed.shortcuts[choiceIndex].url);
                } else if (parsed.type === 'command') {
                    execute(parsed.shortcuts[0].url);
                } else {
                    // Search query
                    const searchUrl = CONFIG.defaultSearchTemplate.replace('{}', encodeURIComponent(parsed.query));
                    execute(searchUrl);
                }
            }
            exitInputMode();
        } else if (e.key === 'j' || e.key === 'k' || e.key === 'h' || e.key === 'l') {
            // Only use hjkl for navigation if input is not focused
            if (document.activeElement === realInput) {
                // Let hjkl work as normal text input
                return;
            }

            e.preventDefault();
            const choices = multipleChoicesList.querySelectorAll('.choice-line');
            if (choices.length > 0) {
                const isUpOrLeft = e.key === 'k' || e.key === 'h';
                activeSuggestionIndex = isUpOrLeft ?
                    (activeSuggestionIndex <= 0 ? choices.length - 1 : activeSuggestionIndex - 1) :
                    (activeSuggestionIndex + 1) % choices.length;

                // Move focus from input to the selected choice
                const selectedChoice = choices[activeSuggestionIndex];
                if (selectedChoice) {
                    selectedChoice.focus();
                }
                updateActiveChoice();
            }
        } else if (e.key === 'Tab') {
            // Only handle Tab within multiple choice context
            const choices = multipleChoicesList.querySelectorAll('.choice-line');
            if (choices.length > 0 && multipleChoicesList.style.display !== 'none') {
                // Don't prevent default - let Tab work normally for accessibility
                // Update the visual selection to match the focused element after Tab navigation
                setTimeout(() => {
                    const focusedChoice = document.activeElement;
                    if (focusedChoice && focusedChoice.classList.contains('choice-line')) {
                        const focusedIndex = Array.from(choices).indexOf(focusedChoice);
                        if (focusedIndex !== -1) {
                            activeSuggestionIndex = focusedIndex;
                            // Don't call updateActiveChoice here to avoid focus conflicts
                            choices.forEach((choice, index) => {
                                choice.classList.toggle('selected', index === activeSuggestionIndex);
                            });
                        }
                    }
                }, 0);
            }
        }
        // Note: Text input is now handled by the real input element's 'input' event
    } else if (settingsOverlay.classList.contains('open')) {
        // Handle navigation in settings
        if (e.key === 'Tab') {
            e.preventDefault();
            const themeOptions = Array.from(themeList.querySelectorAll('.theme-option'));
            const focused = document.activeElement;
            const currentIndex = themeOptions.indexOf(focused);

            let nextIndex;
            if (e.shiftKey) {
                nextIndex = currentIndex <= 0 ? themeOptions.length - 1 : currentIndex - 1;
            } else {
                nextIndex = currentIndex >= themeOptions.length - 1 ? 0 : currentIndex + 1;
            }

            if (themeOptions[nextIndex]) {
                themeOptions[nextIndex].focus();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const focusedBtn = document.activeElement;
            if (focusedBtn && focusedBtn.classList.contains('theme-option')) {
                applyTheme(focusedBtn.dataset.theme, true);
            }
        } else if (e.key === 'j' || e.key === 'k' || e.key === 'h' || e.key === 'l') {
            e.preventDefault();
            const themeOptions = Array.from(themeList.querySelectorAll('.theme-option'));
            const focused = document.activeElement;
            const currentIndex = themeOptions.indexOf(focused);

            let nextIndex;
            const isUpOrLeft = e.key === 'k' || e.key === 'h';
            if (isUpOrLeft) {
                nextIndex = currentIndex <= 0 ? themeOptions.length - 1 : currentIndex - 1;
            } else {
                nextIndex = currentIndex >= themeOptions.length - 1 ? 0 : currentIndex + 1;
            }

            if (themeOptions[nextIndex]) {
                themeOptions[nextIndex].focus();
            }
        }
    }
});


// Theme button event listeners
themeList.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('.theme-option');
    if (themeBtn && themeBtn.dataset.theme) {
        applyTheme(themeBtn.dataset.theme, true);
    }
});

// Command click listeners
commands.addEventListener('click', (e) => {
    const cmd = e.target.closest('.command');
    if (cmd && cmd.dataset.key) {
        const key = cmd.dataset.key;
        const shortcuts = CONFIG.shortcuts[key];

        if (shortcuts.length === 1) {
            // Single shortcut, execute directly
            execute(shortcuts[0].url);
        } else {
            // Multiple shortcuts, execute first one
            execute(shortcuts[0].url);
        }
    }
});

// Initialize
loadSettings();
renderCommands();
updateInputDisplay();

// Initialize the input as empty and not focused
realInput.value = '';
isInputMode = false;
