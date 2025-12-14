export class Calculator {
  constructor() {
    this.resetState();
  }

  resetState() {
    this.state = {
      displayValue: '0',
      firstOperand: null,
      operator: null,
      waitingForSecondOperand: false,
      error: null,
    };
  }

  getState() {
    return { ...this.state };
  }

  clearEntry() {
    if (this.state.error) {
      this.resetState();
    } else {
      this.state.displayValue = '0';
      this.state.waitingForSecondOperand = this.state.operator !== null;
    }
  }

  inputDigit(digit) {
    if (this.state.error) this.resetState();
    if (this.state.waitingForSecondOperand) {
      this.state.displayValue = digit;
      this.state.waitingForSecondOperand = false;
    } else {
      this.state.displayValue = this.state.displayValue === '0' ? digit : this.state.displayValue + digit;
    }
  }

  inputDecimal() {
    if (this.state.error) this.resetState();
    if (this.state.waitingForSecondOperand) {
      this.state.displayValue = '0.';
      this.state.waitingForSecondOperand = false;
      return;
    }

    if (!this.state.displayValue.includes('.')) {
      this.state.displayValue += '.';
    }
  }

  toggleSign() {
    if (this.state.error) this.resetState();
    if (this.state.displayValue === '0') return;
    this.state.displayValue = this.state.displayValue.startsWith('-')
      ? this.state.displayValue.slice(1)
      : `-${this.state.displayValue}`;
  }

  applyPercent() {
    if (this.state.error) this.resetState();
    const value = parseFloat(this.state.displayValue);
    if (!Number.isFinite(value)) return;
    this.state.displayValue = String(value / 100);
  }

  #calculate() {
    const { firstOperand, operator } = this.state;
    const secondOperand = parseFloat(this.state.displayValue);

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
          this.state.error = 'ゼロで割ることはできません';
          return null;
        }
        return firstOperand / secondOperand;
      default:
        return null;
    }
  }

  handleOperator(nextOperator) {
    if (this.state.error) this.resetState();
    const inputValue = parseFloat(this.state.displayValue);

    if (this.state.operator && this.state.waitingForSecondOperand) {
      this.state.operator = nextOperator;
      return;
    }

    if (this.state.firstOperand === null && !Number.isNaN(inputValue)) {
      this.state.firstOperand = inputValue;
    } else if (this.state.operator) {
      const result = this.#calculate();
      if (result === null && this.state.error) {
        return;
      }
      this.state.displayValue = String(result ?? inputValue);
      this.state.firstOperand = result;
    }

    this.state.waitingForSecondOperand = true;
    this.state.operator = nextOperator;
  }

  handleEquals() {
    if (this.state.error) this.resetState();
    if (this.state.operator === null) return;
    const result = this.#calculate();
    if (result === null && this.state.error) {
      return;
    }

    this.state.displayValue = String(result);
    this.state.firstOperand = null;
    this.state.operator = null;
    this.state.waitingForSecondOperand = false;
  }

  handleBackspace() {
    if (this.state.error) {
      this.resetState();
      return;
    }

    if (this.state.waitingForSecondOperand) {
      this.state.displayValue = '0';
      this.state.waitingForSecondOperand = false;
      this.state.operator = null;
      this.state.firstOperand = null;
      return;
    }

    if (this.state.displayValue.length === 1 || (this.state.displayValue.length === 2 && this.state.displayValue.startsWith('-'))) {
      this.state.displayValue = '0';
    } else {
      this.state.displayValue = this.state.displayValue.slice(0, -1);
    }
  }
}

export default Calculator;
