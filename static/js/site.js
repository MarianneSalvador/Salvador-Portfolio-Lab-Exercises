(function () {
    const storageKey = 'portfolio-theme';
    let savedTheme = null;
    try { savedTheme = localStorage.getItem(storageKey); } catch (error) { savedTheme = null; }
    document.documentElement.dataset.theme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    document.addEventListener('DOMContentLoaded', function () {
        const themeButton = document.querySelector('.theme-toggle');
        const themeIcon = document.querySelector('.theme-icon');
        const menuButton = document.querySelector('.menu-toggle');
        const navigation = document.querySelector('.primary-nav');

        function updateThemeControl(theme) {
            const isDark = theme === 'dark';
            if (themeIcon) themeIcon.textContent = isDark ? '☼' : '◐';
            if (themeButton) {
                themeButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
                themeButton.setAttribute('aria-pressed', String(isDark));
                themeButton.title = `Switch to ${isDark ? 'light' : 'dark'} theme`;
            }
        }
        updateThemeControl(document.documentElement.dataset.theme);

        if (themeButton) themeButton.addEventListener('click', function () {
            const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = theme;
            updateThemeControl(theme);
            try { localStorage.setItem(storageKey, theme); } catch (error) { /* Current-page theme still works. */ }
        });

        if (menuButton && navigation) {
            menuButton.addEventListener('click', function () {
                const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
                menuButton.setAttribute('aria-expanded', String(!isOpen));
                menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
                navigation.classList.toggle('is-open', !isOpen);
            });
            navigation.addEventListener('click', function (event) {
                if (event.target.closest('a')) {
                    menuButton.setAttribute('aria-expanded', 'false');
                    menuButton.setAttribute('aria-label', 'Open navigation');
                    navigation.classList.remove('is-open');
                }
            });
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
                    menuButton.setAttribute('aria-expanded', 'false');
                    menuButton.setAttribute('aria-label', 'Open navigation');
                    navigation.classList.remove('is-open');
                    menuButton.focus();
                }
            });
        }

        document.querySelectorAll('[data-preserve-form]').forEach(function (form) {
            const key = `portfolio-form:${window.location.pathname}`;
            try {
                const savedValues = JSON.parse(sessionStorage.getItem(key) || 'null');
                if (savedValues) {
                    form.querySelectorAll('input:not([type="hidden"])').forEach(function (input) {
                        if (Object.prototype.hasOwnProperty.call(savedValues, input.name)) input.value = savedValues[input.name];
                    });
                    sessionStorage.removeItem(key);
                }
            } catch (error) { /* Server-rendered values remain usable without storage. */ }
            form.addEventListener('submit', function () {
                const values = {};
                form.querySelectorAll('input:not([type="hidden"])').forEach(function (input) { values[input.name] = input.value; });
                try { sessionStorage.setItem(key, JSON.stringify(values)); } catch (error) { /* Form submission does not depend on storage. */ }
            });
        });

        const contactForm = document.querySelector('#contact-form');
        if (contactForm) contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const fields = new FormData(contactForm);
            const subject = encodeURIComponent(`Portfolio message from ${fields.get('name')}`);
            const body = encodeURIComponent(`${fields.get('message')}\n\nFrom: ${fields.get('name')} (${fields.get('email')})`);
            window.location.href = `mailto:${contactForm.dataset.mailto}?subject=${subject}&body=${body}`;
            document.querySelector('#contact-status').textContent = 'Your email app should open with your message ready to send.';
        });

        const revealItems = document.querySelectorAll('[data-reveal]');
        if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
                });
            }, { threshold: 0.12 });
            revealItems.forEach(function (item) { observer.observe(item); });
        } else revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    });
})();