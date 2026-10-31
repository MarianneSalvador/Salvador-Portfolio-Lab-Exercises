// Adapted from stian96/algorithm-visualizer (MIT License), https://github.com/stian96/algorithm-visualizer
const ALGORITHMS = ['bubble-sort', 'selection-sort', 'insertion-sort', 'quick-sort', 'merge-sort', 'heap-sort'];
const CONTAINER = document.querySelector('.sv-page .bar-container');
let originalOrder;

async function visualizeSorting(algorithmType, values) {
    try {
        const steps = await getSortingSteps(algorithmType, values);
        for (const step of steps) {
            clearBars();
            renderSteps(step);
            await new Promise(resolve => setTimeout(resolve, getDelay()));
        }
    } catch (error) {
        logError('A problem occurred while visualizing the sorting', error);
    }
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
    step.forEach((number, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${number * 2.5}px`;
        bar.style.left = `${index * 40}px`;
        CONTAINER.appendChild(bar);
    });
}

function clearBars() {
    CONTAINER.innerHTML = '';
}

async function getDiagramValues(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Diagram values response must be an array.');
    }
    return data;
}

async function initializeBars() {
    try {
        const initialValues = await getDiagramValues('/diagram-values');
        originalOrder = [...initialValues];
        renderSteps(initialValues);
        bindAlgorithms(originalOrder);
    } catch (error) {
        logError('There was a problem in fetching the data for the diagram:', error);
    }
}

function bindAlgorithms(values) {
    ALGORITHMS.forEach(element => {
        SORTING_PAGE.querySelector(`#${element}`).addEventListener('click', () => {
            visualizeSorting(element.replace(/-/g, '_'), values);
        });
    });
}

function resetBars() {
    clearBars();
    renderSteps(originalOrder);
}

function getDelay() {
    return Number(SORTING_PAGE.querySelector('#speed').value);
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
    initializeBars();
    adjustSliderColor();
    SORTING_PAGE.querySelector('#reset').addEventListener('click', resetBars);
});
