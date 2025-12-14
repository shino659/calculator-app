import { strict as assert } from 'node:assert';
import test from 'node:test';
import { Calculator } from '../calculator.js';

const runSequence = (steps) => {
  const calculator = new Calculator();
  steps(calculator);
  return calculator.getState();
};

test('1 + 2 = 3', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('1');
    calc.handleOperator('+');
    calc.inputDigit('2');
    calc.handleEquals();
  });

  assert.equal(state.displayValue, '3');
});

test('supports decimal input', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('1');
    calc.inputDecimal();
    calc.inputDigit('5');
  });

  assert.equal(state.displayValue, '1.5');
});

test('percent converts to fraction', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('5');
    calc.inputDigit('0');
    calc.applyPercent();
  });

  assert.equal(state.displayValue, '0.5');
});

test('toggle sign flips the current value', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('3');
    calc.toggleSign();
    calc.toggleSign();
  });

  assert.equal(state.displayValue, '3');
});

test('supports continuous calculations', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('5');
    calc.handleOperator('+');
    calc.inputDigit('5');
    calc.handleEquals();
    calc.handleOperator('+');
    calc.inputDigit('2');
    calc.handleEquals();
  });

  assert.equal(state.displayValue, '12');
});

test('division by zero sets error message', () => {
  const state = runSequence((calc) => {
    calc.inputDigit('8');
    calc.handleOperator('/');
    calc.inputDigit('0');
    calc.handleEquals();
  });

  assert.equal(state.error, 'ゼロで割ることはできません');
});
