import { Calculator } from './calculator.js';

const display = document.getElementById('display');
const historyEl = document.getElementById('history');
const clearBtn = document.getElementById('clear');
const copyBtn = document.getElementById('copy-btn');
const feedbackEl = document.getElementById('feedback');
const tapeList = document.getElementById('tape-list');
const clearHistoryBtn = document.getElementById('clear-history');
const themeToggle = document.getElementById('theme-toggle');
const calculator = new Calculator();

const STORAGE_KEYS = {
  history: 'calculator-history',
  theme: 'calculator-theme',
};

const MAX_HISTORY = 10;
let historyItems = [];
let feedbackTimer = null;

const formatNumber = (value) => {
  const hasTrailingDot = value.endsWith('.');
  const [integer, decimal] = value.split('.');
  const formattedInt = Number(integer).toLocaleString('ja-JP');
  if (hasTrailingDot) return `${formattedInt}.`;
  return decimal ? `${formattedInt}.${decimal}` : formattedInt;
};

const buildHistory = (state) => {
  const { firstOperand, operator, waitingForSecondOperand, displayValue, error } = state;
  if (error || firstOperand === null) return '';
  if (waitingForSecondOperand) return `${formatNumber(String(firstOperand))} ${operator}`;
  return `${formatNumber(String(firstOperand))} ${operator ?? ''} ${formatNumber(displayValue)}`.trim();
};

const updateDisplay = () => {
  const state = calculator.getState();

  if (state.error) {
    display.textContent = state.error;
    display.classList.add('error');
  } else {
    display.textContent = formatNumber(state.displayValue);
    display.classList.remove('error');
  }

  historyEl.textContent = buildHistory(state);
  clearBtn.textContent = state.displayValue !== '0' || state.firstOperand !== null ? 'C' : 'AC';
};

const showFeedback = (message, isError = false) => {
  clearTimeout(feedbackTimer);
  feedbackEl.textContent = message;
  feedbackEl.style.color = isError ? 'var(--danger)' : 'var(--muted)';
  if (message) {
    feedbackTimer = setTimeout(() => {
      feedbackEl.textContent = '';
    }, 1200);
  }
};

const saveHistory = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(historyItems));
  } catch (error) {
    console.error('履歴の保存に失敗しました', error);
  }
};

const renderHistory = () => {
  tapeList.innerHTML = '';
  if (!historyItems.length) {
    const empty = document.createElement('li');
    empty.textContent = '履歴はありません';
    empty.className = 'tape__empty';
    tapeList.appendChild(empty);
    return;
  }

  historyItems.forEach(({ expression, result, displayResult }) => {
    const item = document.createElement('li');
    item.className = 'tape__item';
    item.tabIndex = 0;
    item.dataset.result = result;

    const expr = document.createElement('div');
    expr.className = 'tape__expression';
    expr.textContent = expression;

    const res = document.createElement('div');
    res.className = 'tape__result';
    res.textContent = `= ${displayResult}`;

    item.append(expr, res);
    tapeList.appendChild(item);
  });
};

const addHistoryEntry = (expression, resultValue) => {
  const entry = {
    expression,
    result: resultValue,
    displayResult: formatNumber(resultValue),
  };
  historyItems = [entry, ...historyItems].slice(0, MAX_HISTORY);
  saveHistory();
  renderHistory();
};

const clearHistory = () => {
  historyItems = [];
  saveHistory();
  renderHistory();
};

const loadHistory = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    if (saved) historyItems = JSON.parse(saved);
  } catch (error) {
    console.error('履歴の読み込みに失敗しました', error);
  }
  renderHistory();
};

const handleEqualsWithHistory = () => {
  const before = calculator.getState();
  calculator.handleEquals();
  const after = calculator.getState();

  if (before.operator && before.firstOperand !== null && !after.error) {
    const expression = `${formatNumber(String(before.firstOperand))} ${before.operator} ${formatNumber(before.displayValue)}`;
    addHistoryEntry(expression, after.displayValue);
  }
};

const handleKeydown = (event) => {
  const { key, metaKey, ctrlKey } = event;

  if (ctrlKey || metaKey) {
    if (key.toLowerCase() === 'v') return;
  }

  if (/[0-9]/.test(key)) {
    calculator.inputDigit(key);
  } else if (key === '.') {
    calculator.inputDecimal();
  } else if (['+', '-', '*', '/'].includes(key)) {
    calculator.handleOperator(key);
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleEqualsWithHistory();
  } else if (key === 'Backspace') {
    calculator.handleBackspace();
  } else if (key === 'Escape') {
    calculator.resetState();
  }

  updateDisplay();
};

const handleButtonClick = (event) => {
  const target = event.target;
  if (!target.classList.contains('key')) return;

  const digit = target.dataset.digit;
  const action = target.dataset.action;

  if (digit) {
    calculator.inputDigit(digit);
  }

  if (action === 'decimal') calculator.inputDecimal();
  if (action === 'sign') calculator.toggleSign();
  if (action === 'percent') calculator.applyPercent();
  if (action === 'operator') calculator.handleOperator(target.dataset.operator);
  if (action === 'equals') handleEqualsWithHistory();
  if (action === 'clear') {
    if (clearBtn.textContent === 'AC') {
      calculator.resetState();
    } else {
      calculator.clearEntry();
    }
  }

  updateDisplay();
};

const handleCopy = async () => {
  const value = calculator.getState().displayValue;
  if (!navigator.clipboard?.writeText) {
    showFeedback('Copy unavailable', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    showFeedback('Copied');
  } catch (error) {
    console.error('コピーに失敗しました', error);
    showFeedback('Copy failed', true);
  }
};

const sanitizePastedValue = (text) => {
  const trimmed = text.trim();
  if (!/^[-]?\d*\.?\d*$/.test(trimmed)) return null;
  if (['', '-', '.', '-.'].includes(trimmed)) return null;

  if (trimmed.endsWith('.')) return trimmed;

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return String(value);
};

const handlePaste = (event) => {
  const text = event.clipboardData?.getData('text');
  if (!text) return;

  event.preventDefault();
  const sanitized = sanitizePastedValue(text);
  if (sanitized === null) {
    showFeedback('数値のみ貼り付け可能', true);
    return;
  }

  calculator.resetState();
  calculator.state.displayValue = sanitized;
  updateDisplay();
  showFeedback('Pasted');
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'light' ? '☀️ Light' : '🌙 Dark';
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch (error) {
    console.error('テーマの保存に失敗しました', error);
  }
};

const initTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
    return;
  }

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
};

const toggleTheme = () => {
  const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
};

const handleHistoryClick = (event) => {
  const target = event.target.closest('.tape__item');
  if (!target) return;
  const { result } = target.dataset;
  if (!result) return;
  calculator.resetState();
  calculator.state.displayValue = result;
  updateDisplay();
  showFeedback('履歴を入力しました');
};

const init = () => {
  document.querySelector('.keypad').addEventListener('click', handleButtonClick);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('paste', handlePaste);
  copyBtn.addEventListener('click', handleCopy);
  tapeList.addEventListener('click', handleHistoryClick);
  tapeList.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHistoryClick(event);
    }
  });
  clearHistoryBtn.addEventListener('click', clearHistory);
  themeToggle.addEventListener('click', toggleTheme);
  initTheme();
  loadHistory();
  updateDisplay();
};

init();
