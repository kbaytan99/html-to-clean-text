import { parseAndClean, toPlainText, toMarkdown } from './cleaner.js';
import { toJSON, estimateTokens } from './chunker.js';
// DOM Elements
const htmlInput = document.getElementById('htmlInput');
const cleanOutput = document.getElementById('cleanOutput');
const cleanBtn = document.getElementById('cleanBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearInput = document.getElementById('clearInput');
const statsEl = document.getElementById('stats');
const chunkSizeInput = document.getElementById('chunkSize');
const toast = document.getElementById('toast');
// State
let currentOutput = '';
let currentMode = 'plaintext';
let currentStats = null;
/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 2500);
}
/**
 * Get the currently selected output mode
 */
function getOutputMode() {
    const selected = document.querySelector('input[name="outputMode"]:checked');
    return selected?.value || 'plaintext';
}
/**
 * Get chunk size from input
 */
function getChunkSize() {
    const value = parseInt(chunkSizeInput.value);
    return isNaN(value) ? 1000 : Math.max(400, Math.min(2000, value));
}
/**
 * Update stats display
 */
function updateStats(stats) {
    statsEl.innerHTML = `
    <span class="stat-item">
      <span>Words:</span>
      <span class="stat-value">${stats.wordCount.toLocaleString()}</span>
    </span>
    <span class="stat-item">
      <span>Tokens:</span>
      <span class="stat-value">~${stats.estimatedTokens.toLocaleString()}</span>
    </span>
    <span class="stat-item">
      <span>Chunks:</span>
      <span class="stat-value">${stats.chunkCount}</span>
    </span>
    <span class="stat-item">
      <span>Reduction:</span>
      <span class="stat-value">${stats.reductionPercent}%</span>
    </span>
  `;
}
/**
 * Perform the cleaning operation
 */
function cleanHTML() {
    const html = htmlInput.value.trim();
    if (!html) {
        showToast('Please paste some HTML first', 'error');
        return;
    }
    try {
        // Parse and extract elements
        const elements = parseAndClean(html);
        if (elements.length === 0) {
            showToast('No meaningful content found in the HTML', 'error');
            cleanOutput.value = '';
            currentOutput = '';
            statsEl.innerHTML = '';
            return;
        }
        // Convert to plain text for stats
        const plainText = toPlainText(elements);
        const chunkSize = getChunkSize();
        const jsonOutput = toJSON(plainText, chunkSize);
        // Calculate stats
        const stats = {
            originalLength: html.length,
            cleanedLength: plainText.length,
            reductionPercent: Math.round((1 - plainText.length / html.length) * 100),
            wordCount: plainText.split(/\s+/).filter(w => w.length > 0).length,
            estimatedTokens: estimateTokens(plainText),
            chunkCount: jsonOutput.content.length
        };
        currentStats = stats;
        // Generate output based on selected mode
        currentMode = getOutputMode();
        switch (currentMode) {
            case 'plaintext':
                currentOutput = plainText;
                break;
            case 'markdown':
                currentOutput = toMarkdown(elements);
                break;
            case 'json':
                currentOutput = JSON.stringify(jsonOutput, null, 2);
                break;
        }
        cleanOutput.value = currentOutput;
        updateStats(stats);
        // Enable action buttons
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
        showToast('HTML cleaned successfully!', 'success');
    }
    catch (error) {
        console.error('Cleaning error:', error);
        showToast('Error processing HTML. Please check the input.', 'error');
    }
}
/**
 * Copy output to clipboard
 */
async function copyToClipboard() {
    if (!currentOutput)
        return;
    try {
        await navigator.clipboard.writeText(currentOutput);
        showToast('Copied to clipboard!', 'success');
    }
    catch (error) {
        // Fallback for older browsers
        cleanOutput.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    }
}
/**
 * Download output as file
 */
function downloadOutput() {
    if (!currentOutput)
        return;
    let filename;
    let mimeType;
    switch (currentMode) {
        case 'markdown':
            filename = 'cleaned-content.md';
            mimeType = 'text/markdown';
            break;
        case 'json':
            filename = 'cleaned-content.json';
            mimeType = 'application/json';
            break;
        default:
            filename = 'cleaned-content.txt';
            mimeType = 'text/plain';
    }
    const blob = new Blob([currentOutput], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
}
/**
 * Clear input field
 */
function clearInputField() {
    htmlInput.value = '';
    cleanOutput.value = '';
    currentOutput = '';
    currentStats = null;
    statsEl.innerHTML = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
}
/**
 * Handle mode change - regenerate output if there's content
 */
function handleModeChange() {
    if (currentOutput && htmlInput.value.trim()) {
        cleanHTML();
    }
}
// Event Listeners
cleanBtn.addEventListener('click', cleanHTML);
copyBtn.addEventListener('click', copyToClipboard);
downloadBtn.addEventListener('click', downloadOutput);
clearInput.addEventListener('click', clearInputField);
// Output mode change
document.querySelectorAll('input[name="outputMode"]').forEach(radio => {
    radio.addEventListener('change', handleModeChange);
});
// Chunk size change
chunkSizeInput.addEventListener('change', () => {
    if (currentOutput && currentMode === 'json') {
        cleanHTML();
    }
});
// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to clean
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        cleanHTML();
    }
    // Ctrl/Cmd + Shift + C to copy output
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyToClipboard();
    }
});
// Handle paste in input
htmlInput.addEventListener('paste', () => {
    // Small delay to ensure pasted content is in the textarea
    setTimeout(() => {
        if (htmlInput.value.trim()) {
            cleanBtn.focus();
        }
    }, 100);
});
// Initialize
console.log('HTML to Clean Text Converter initialized');
//# sourceMappingURL=app.js.map