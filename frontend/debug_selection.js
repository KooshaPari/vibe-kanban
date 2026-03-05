const { JSDOM } = require('jsdom');

const dom = new JSDOM('<\!DOCTYPE html><html><body><input value="Hello"></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const input = document.querySelector('input');
input.focus();

// Simulate end then shift+left+left
input.setSelectionRange(5, 5); // End position
console.log('After End:', input.selectionStart, input.selectionEnd);

// In real browser, Shift+Arrow creates selection
input.setSelectionRange(3, 5); // Simulating Shift+Left+Left selection
console.log('After Shift+Arrow:', input.selectionStart, input.selectionEnd);
