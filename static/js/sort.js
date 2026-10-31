// Adapted from stian96/algorithm-visualizer (MIT License), https://github.com/stian96/algorithm-visualizer
let slideIndex = 0;
const SORTING_PAGE = document.querySelector('.sv-page');

function bindSliderButton(buttonId) {
    SORTING_PAGE.querySelector(`#${buttonId}`).addEventListener('click', () => {
        slideIndex += buttonId === 'next' ? 1 : -1;
        updateSlider();
    });
}

function updateSlider() {
    const list = SORTING_PAGE.querySelector('.nav-list');
    const items = SORTING_PAGE.querySelectorAll('.nav-items');
    const visibleItems = window.matchMedia('(max-width: 640px)').matches ? 2 : 3;
    const maxSlideIndex = Math.max(0, items.length - visibleItems);
    slideIndex = Math.max(0, Math.min(slideIndex, maxSlideIndex));
    list.style.transform = `translateX(-${slideIndex * (100 / items.length)}%)`;
}

function toggleInfoSidebar(elementId) {
    const sidebar = SORTING_PAGE.querySelector('#info-sidebar');
    const helpButton = SORTING_PAGE.querySelector('#help-icon');
    const closeButton = SORTING_PAGE.querySelector('#close-icon');
    const setOpen = isOpen => {
        sidebar.hidden = !isOpen;
        helpButton.setAttribute('aria-expanded', String(isOpen));
    };

    SORTING_PAGE.querySelector(`#${elementId}`).addEventListener('click', () => {
        setOpen(sidebar.hidden);
    });
    closeButton.addEventListener('click', () => setOpen(false));
}

bindSliderButton('next');
bindSliderButton('prev');
toggleInfoSidebar('help-icon');
