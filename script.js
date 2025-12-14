const display = document.getElementById('display');
const historyEl = document.getElementById('history');
const clearBtn = document.getElementById('clear');

const state = {
  displayValue: '0',
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
  error: null,
};

const formatNumber = (value) => {
  const hasTrailingDot = value.endsWith('.');
  const [integer, decimal] = value.split('.');
  const formattedInt = Number(integer).toLocaleString('ja-JP');
  if (hasTrailingDot) return `${formattedInt}.`;
  return decimal ? `${formattedInt}.${decimal}` : formattedInt;
};

const updateDisplay = () => {
  if (state.error) {
    display.textContent = state.error;
    display.classList.add('error');
  } else {
    display.textContent = formatNumber(state.displayValue);
    display.classList.remove('error');
  }

  historyEl.textContent = buildHistory();
  clearBtn.textContent = state.displayValue !== '0' || state.firstOperand !== null ? 'C' : 'AC';
};

const buildHistory = () => {
  const { firstOperand, operator, waitingForSecondOperand, displayValue } = state;
  if (state.error) return '';
  if (firstOperand === null) return '';
  if (waitingForSecondOperand) return `${formatNumber(String(firstOperand))} ${operator}`;
  return `${formatNumber(String(firstOperand))} ${operator ?? ''} ${formatNumber(displayValue)}`.trim();
};

const resetState = () => {
  state.displayValue = '0';
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.error = null;
};

const clearEntry = () => {
  if (state.error) {
    resetState();
  } else {
    state.displayValue = '0';
    state.waitingForSecondOperand = state.operator !== null;
  }
};

const inputDigit = (digit) => {
  if (state.error) resetState();
  if (state.waitingForSecondOperand) {
    state.displayValue = digit;
    state.waitingForSecondOperand = false;
  } else {
    state.displayValue = state.displayValue === '0' ? digit : state.displayValue + digit;
  }
};

const inputDecimal = () => {
  if (state.error) resetState();
  if (state.waitingForSecondOperand) {
    state.displayValue = '0.';
    state.waitingForSecondOperand = false;
    return;
  }
  if (!state.displayValue.includes('.')) {
    state.displayValue += '.';
  }
};

const toggleSign = () => {
  if (state.error) resetState();
  if (state.displayValue === '0') return;
  state.displayValue = state.displayValue.startsWith('-')
    ? state.displayValue.slice(1)
    : `-${state.displayValue}`;
};

const applyPercent = () => {
  if (state.error) resetState();
  const value = parseFloat(state.displayValue);
  if (!Number.isFinite(value)) return;
  state.displayValue = String(value / 100);
};

const calculate = () => {
  const { firstOperand, operator } = state;
  const secondOperand = parseFloat(state.displayValue);

  if (firstOperand === null || operator === null || Number.isNaN(secondOperand)) return null;

  switch (operator) {
    case '+':
      return firstOperand + secondOperand;
    case '-':
      return firstOperand - secondOperand;
    case '*':
      return firstOperand * secondOperand;
    case '/':
      if (secondOperand === 0) {
        state.error = 'ゼロで割ることはできません';
        return null;
      }
      return firstOperand / secondOperand;
    default:
      return null;
  }
};

const handleOperator = (nextOperator) => {
  if (state.error) resetState();
  const inputValue = parseFloat(state.displayValue);

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator;
    return;
  }

  if (state.firstOperand === null && !Number.isNaN(inputValue)) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = calculate();
    if (result === null && state.error) {
      updateDisplay();
      return;
    }
    state.displayValue = String(result ?? inputValue);
    state.firstOperand = result;
  }

  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
};

const handleEquals = () => {
  if (state.error) resetState();
  if (state.operator === null) return;
  const result = calculate();
  if (result === null && state.error) {
    updateDisplay();
    return;
  }

  state.displayValue = String(result);
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
};

const handleBackspace = () => {
  if (state.error) {
    resetState();
    return;
  }

  if (state.waitingForSecondOperand) {
    state.displayValue = '0';
    state.waitingForSecondOperand = false;
    state.operator = null;
    state.firstOperand = null;
    return;
  }

  if (state.displayValue.length === 1 || (state.displayValue.length === 2 && state.displayValue.startsWith('-'))) {
    state.displayValue = '0';
  } else {
    state.displayValue = state.displayValue.slice(0, -1);
  }
};

const handleKeydown = (event) => {
  const { key } = event;

  if (/[0-9]/.test(key)) {
    inputDigit(key);
  } else if (key === '.') {
    inputDecimal();
  } else if (['+', '-', '*', '/'].includes(key)) {
    handleOperator(key);
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleEquals();
  } else if (key === 'Backspace') {
    handleBackspace();
  } else if (key === 'Escape') {
    resetState();
  }

  updateDisplay();
};

const handleButtonClick = (event) => {
  const target = event.target;
  if (!target.classList.contains('key')) return;

  const digit = target.dataset.digit;
  const action = target.dataset.action;

  if (digit) {
    inputDigit(digit);
  }

  if (action === 'decimal') inputDecimal();
  if (action === 'sign') toggleSign();
  if (action === 'percent') applyPercent();
  if (action === 'operator') handleOperator(target.dataset.operator);
  if (action === 'equals') handleEquals();
  if (action === 'clear') {
    if (clearBtn.textContent === 'AC') {
      resetState();
    } else {
      clearEntry();
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
