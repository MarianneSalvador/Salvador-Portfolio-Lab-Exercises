// Adapted from stian96/algorithm-visualizer (MIT License), https://github.com/stian96/algorithm-visualizer
const ALGORITHMS = ['bubble-sort', 'selection-sort', 'insertion-sort', 'quick-sort', 'merge-sort'];
const EXAMPLE_VALUES = [115, 42, 15, 88, 75, 23, 93, 30, 10, 55, 100, 70];
const CONTAINER = document.querySelector('.sv-page .bar-container');
let currentValues = [];
let selectedAlgorithm = null;
let isSorting = false;

async function visualizeSorting(algorithmType, values) {
    if (isSorting) {
        return;
    }

    isSorting = true;
    setSortingControlsDisabled(true);
    try {
        const steps = await getSortingSteps(algorithmType, values);
        for (const step of steps) {
            renderSteps(step);
            await new Promise(resolve => setTimeout(resolve, getDelay()));
        }
    } catch (error) {
        logError('A problem occurred while visualizing the sorting', error);
    } finally {
        isSorting = false;
        setSortingControlsDisabled(false);
    }
}

function setSortingControlsDisabled(disabled) {
    SORTING_PAGE.querySelector('#custom-values').disabled = disabled;
    SORTING_PAGE.querySelector('#apply-values').disabled = disabled;
    SORTING_PAGE.querySelector('#load-example').disabled = disabled;
    SORTING_PAGE.querySelector('#reset').disabled = disabled;
    ALGORITHMS.forEach(id => {
        SORTING_PAGE.querySelector(`#${id}`).disabled = disabled;
    });
}

async function getSortingSteps(algorithmType, values) {
    const response = await fetch(`/sort/${algorithmType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Object.prototype.hasOwnProperty.call(data, 'steps')) {
        throw new Error("Missing 'steps' key in response.");
    }
    return data.steps;
}

function renderSteps(step) {
    clearBars();
    SORTING_PAGE.querySelector('#bars-placeholder').hidden = true;
    const largestValue = Math.max(...step);
    const slotWidth = Math.min(40, CONTAINER.clientWidth / step.length);
    const groupWidth = slotWidth * step.length;
    const startX = (CONTAINER.clientWidth - groupWidth) / 2;
    const maxBarHeight = Math.max(1, CONTAINER.clientHeight - 30);

    step.forEach((number, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${Math.max(4, number / largestValue * maxBarHeight)}px`;
        bar.style.left = `${startX + index * slotWidth}px`;
        bar.style.width = `${Math.min(24, slotWidth * 0.65)}px`;
        const label = document.createElement('span');
        label.className = 'bar-value';
        label.textContent = number;
        bar.appendChild(label);
        CONTAINER.appendChild(bar);
    });

    SORTING_PAGE.querySelector('#values-output').textContent = `Values: [${step.join(', ')}]`;
}

function clearBars() {
    CONTAINER.querySelectorAll('.bar').forEach(bar => bar.remove());
}

function bindAlgorithms() {
    ALGORITHMS.forEach(element => {
       const button = SORTING_PAGE.querySelector(`#${element}`);
       button.addEventListener('click', () => {
           if (isSorting) {
               return;
           }
           ALGORITHMS.forEach(id => {
               const algorithmButton = SORTING_PAGE.querySelector(`#${id}`);
               const isSelected = id === element;
               algorithmButton.classList.toggle('is-selected', isSelected);
               algorithmButton.setAttribute('aria-pressed', String(isSelected));
           });
           selectedAlgorithm = element.replace(/-/g, '_');
       });
    });
}

function resetBars() {
    SORTING_PAGE.querySelector('#custom-values').value = '';
    SORTING_PAGE.querySelector('#values-message').textContent = '';
    currentValues = [];
    clearBars();
    SORTING_PAGE.querySelector('#bars-placeholder').hidden = false;
    SORTING_PAGE.querySelector('#values-output').textContent = '';
}

function loadExampleValues() {
    const input = SORTING_PAGE.querySelector('#custom-values');
    input.value = EXAMPLE_VALUES.join(', ');
    SORTING_PAGE.querySelector('#values-message').textContent = '';
    currentValues = [...EXAMPLE_VALUES];
    renderSteps(currentValues);
}

async function applyCustomValues(event) {
    event.preventDefault();
    if (isSorting) {
       return;
    }

    const message = SORTING_PAGE.querySelector('#values-message');
    if (!selectedAlgorithm) {
       message.textContent = 'Choose an algorithm first.';
       return;
    }

    const input = SORTING_PAGE.querySelector('#custom-values').value;
    const parts = input.split(/[,;\s]+/).filter(Boolean);
    if (parts.length === 0) {
        message.textContent = 'Enter some numbers first, like 5, 3, 8.';
        return;
    }
    const values = [];
    for (const part of parts) {
        if (part.includes('.')) {
            message.textContent = /\d\.\d/.test(part)
                ? `“${part}” has a decimal. Use whole numbers only.`
                : `“${part}” has a period. Use commas to separate numbers, like 5, 3, 8.`;
            return;
        }
        if (part.startsWith('-')) {
            message.textContent = `“${part}” is negative. Use numbers from 1 to 999.`;
            return;
        }
        if (!/^\d+$/.test(part)) {
            message.textContent = `“${part}” isn't a number. Use digits only, like 5, 3, 8.`;
            return;
        }
        values.push(Number(part));
    }

    if (values.length < 2) {
        message.textContent = 'Enter at least 2 numbers.';
        return;
    }
    if (values.length > 12) {
        message.textContent = 'Use up to 12 numbers.';
        return;
    }

    if (values.some(value => value < 1 || value > 999)) {
        message.textContent = 'Numbers must be between 1 and 999.';
        return;
    }

    currentValues = values;
    message.textContent = '';
    renderSteps(currentValues);
    await visualizeSorting(selectedAlgorithm, [...currentValues]);
}

function getDelay() {
    const slider = SORTING_PAGE.querySelector('#speed');
    return Number(slider.max) + Number(slider.min) - Number(slider.value);
}

function logError(message, error) {
    console.error(message, error);
}

function adjustSliderColor() {
    const slider = SORTING_PAGE.querySelector('#speed');
    slider.addEventListener('input', () => {
        const value = calculateSliderValue(slider);
        slider.style.background = `linear-gradient(to right, var(--accent) ${value}%, var(--line) ${value}%)`;
    });
}

function calculateSliderValue(slider) {
    return ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
}

document.addEventListener('DOMContentLoaded', () => {
    adjustSliderColor();
    bindAlgorithms();
    SORTING_PAGE.querySelector('#reset').addEventListener('click', resetBars);
    SORTING_PAGE.querySelector('#load-example').addEventListener('click', loadExampleValues);
    SORTING_PAGE.querySelector('#values-form').addEventListener('submit', applyCustomValues);
});
