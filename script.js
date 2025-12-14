import { Calculator } from './calculator.js';

const display = document.getElementById('display');
const historyEl = document.getElementById('history');
const clearBtn = document.getElementById('clear');
const calculator = new Calculator();

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

const handleKeydown = (event) => {
  const { key } = event;

  if (/[0-9]/.test(key)) {
    calculator.inputDigit(key);
  } else if (key === '.') {
    calculator.inputDecimal();
  } else if (['+', '-', '*', '/'].includes(key)) {
    calculator.handleOperator(key);
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    calculator.handleEquals();
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
  if (action === 'equals') calculator.handleEquals();
  if (action === 'clear') {
    if (clearBtn.textContent === 'AC') {
      calculator.resetState();
    } else {
      calculator.clearEntry();
    }
  }

  updateDisplay();
};

const init = () => {
  document.querySelector('.keypad').addEventListener('click', handleButtonClick);
  document.addEventListener('keydown', handleKeydown);
  updateDisplay();
};

init();
