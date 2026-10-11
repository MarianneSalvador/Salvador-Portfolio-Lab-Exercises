(function () {
    const chooser = document.querySelector('#stack-tool-chooser');
    const panels = document.querySelectorAll('[data-tool-panel]');
    const runs = {};
    let autoTimer = null;
    let autoButton = null;
    const requestPending = { infix: false, convert: false, reverse: false };

    // Send a JSON request and return the response or a useful validation error.
    async function postJson(url, payload) {
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch {
            throw new Error('Could not reach the server. Please try again.');
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
        return result;
    }

    // Stop autoplay when changing tools, resetting, or reaching the final step.
    function stopAutoPlay() {
        if (autoTimer !== null) window.clearInterval(autoTimer);
        autoTimer = null;
        if (autoButton) autoButton.textContent = 'Auto Play';
        autoButton = null;
    }

    // Show only the selected tool panel; the visualizer remains its own page.
    function openTool(key) {
        stopAutoPlay();
        chooser.hidden = true;
        panels.forEach(function (panel) {
            panel.hidden = panel.dataset.toolPanel !== key;
        });
    }

    // Return from an algorithm view to the stack tool chooser.
    function returnToChooser() {
        stopAutoPlay();
        panels.forEach(function (panel) {
            panel.hidden = true;
        });
        chooser.hidden = false;
    }

    // Display API validation errors beside the associated form.
    function showError(key, message) {
        const errorPanel = document.querySelector(`[data-error="${key}"]`);
        errorPanel.querySelector('p').textContent = message;
        errorPanel.hidden = false;
    }

    // Clear the error state before starting another conversion.
    function clearError(key) {
        const errorPanel = document.querySelector(`[data-error="${key}"]`);
        errorPanel.hidden = true;
        errorPanel.querySelector('p').textContent = '';
    }

    // Render a top-to-bottom stack snapshot as simple open-bin node boxes.
    function renderStack(container, items) {
        container.replaceChildren();
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'algorithm-stack-empty';
            empty.textContent = 'empty';
            container.append(empty);
            return;
        }
        items.forEach(function (value) {
            const item = document.createElement('span');
            item.className = 'algorithm-stack-item';
            item.textContent = value;
            container.append(item);
        });
    }

    // Reveal the final result after the last recorded algorithm step.
    function updateFinalResult(key, run) {
        const panel = document.querySelector(`[data-result="${key}"]`);
        const complete = run.index >= run.steps.length - 1 && run.steps.length > 0;
        if (key === 'infix') {
            const nextButton = document.querySelector('[data-next="infix"]');
            const playButton = document.querySelector('[data-auto="infix"]');
            const resultButton = document.querySelector('[data-show-result="infix"]');
            panel.hidden = !complete;
            if (complete) panel.querySelector('.output-value').textContent = run.result;
            nextButton.disabled = complete;
            playButton.disabled = complete;
            resultButton.disabled = complete;
            if (complete) {
                document.querySelector('#infix-explanation').textContent =
                    `Done. Postfix: ${run.result}`;
                stopAutoPlay();
            }
            return;
        }
        panel.hidden = !complete;
        if (complete) panel.querySelector('.output-value').textContent = run.result;
        const nextButton = document.querySelector(`[data-next="${key}"]`);
        const playButton = document.querySelector(`[data-auto="${key}"]`);
        const resultButton = document.querySelector(`[data-show-result="${key}"]`);
        nextButton.disabled = complete;
        playButton.disabled = complete;
        resultButton.disabled = complete;
        if (complete) {
            const status = key === 'convert'
                ? `Done. Converted value: ${run.result}`
                : `Done. Reversed string: ${run.result}`;
            document.querySelector(`#${key}-explanation`).textContent = status;
            stopAutoPlay();
        }
    }

    // Render the selected step for the chosen stack algorithm.
    function renderRun(key) {
        const run = runs[key];
        const visual = document.querySelector(`[data-visual="${key}"]`);
        const explanation = document.querySelector(`#${key}-explanation`);
        if (!run) {
            visual.hidden = true;
            explanation.textContent = '';
            return;
        }
        if (run.index < 0) {
            if (key === 'infix') {
                visual.hidden = false;
                const tokens = document.querySelector('#infix-tokens');
                tokens.replaceChildren();
                run.tokens.forEach(function (token) {
                    const chip = document.createElement('span');
                    chip.className = 'token-chip';
                    chip.textContent = token;
                    tokens.append(chip);
                });
                renderStack(document.querySelector('#infix-ops'), []);
                document.querySelector('#infix-output').textContent = '';
                document.querySelector('[data-result="infix"]').hidden = true;
            } else if (key === 'convert') {
                visual.hidden = false;
                document.querySelector('#division-steps').replaceChildren();
                renderStack(document.querySelector('#remainder-stack'), []);
                document.querySelector('#conversion-output').textContent = '';
                document.querySelector('[data-result="convert"]').hidden = true;
            } else {
                visual.hidden = false;
                const characters = document.querySelector('#reverse-characters');
                characters.replaceChildren();
                run.characters.forEach(function (character) {
                    const chip = document.createElement('span');
                    chip.className = 'token-chip';
                    chip.textContent = character === ' ' ? '␠' : character;
                    characters.append(chip);
                });
                renderStack(document.querySelector('#reverse-stack'), []);
                document.querySelector('#reverse-output').textContent = '';
                document.querySelector('[data-result="reverse"]').hidden = true;
            }
            explanation.textContent = run.readyText;
            return;
        }

        visual.hidden = false;
        const step = run.steps[run.index];
        explanation.textContent = step.explanation || step.action;

        if (key === 'infix') {
            const tokens = document.querySelector('#infix-tokens');
            tokens.replaceChildren();
            run.tokens.forEach(function (token, index) {
                const chip = document.createElement('span');
                chip.className = 'token-chip';
                chip.textContent = token;
                if (step.token_index === null || step.token_index === undefined) {
                    chip.classList.add('is-current');
                } else if (index <= step.token_index) {
                    chip.classList.add('is-current');
                }
                tokens.append(chip);
            });
            renderStack(document.querySelector('#infix-ops'), step.ops);
            document.querySelector('#infix-output').textContent = step.output;
        } else if (key === 'convert') {
            const divisions = document.querySelector('#division-steps');
            divisions.replaceChildren();
            run.steps.forEach(function (entry, index) {
                if (entry.phase !== 'push' || index > run.index) return;
                const line = document.createElement('li');
                line.textContent = entry.division;
                if (index === run.index) line.classList.add('is-current');
                divisions.append(line);
            });
            if (step.phase === 'pop') {
                divisions.querySelectorAll('li').forEach(function (line) {
                    line.classList.remove('is-current');
                    line.classList.add('is-pop');
                });
            }
            renderStack(document.querySelector('#remainder-stack'), step.stack);
            document.querySelector('#conversion-output').textContent = step.output;
        } else {
            const characters = document.querySelector('#reverse-characters');
            characters.replaceChildren();
            run.characters.forEach(function (character, index) {
                const chip = document.createElement('span');
                chip.className = 'token-chip';
                chip.textContent = character === ' ' ? '␠' : character;
                if (
                    step.phase === 'pop'
                    ? index >= step.character_index
                    : index <= step.character_index
                ) chip.classList.add('is-current');
                characters.append(chip);
            });
            renderStack(document.querySelector('#reverse-stack'), step.stack);
            document.querySelector('#reverse-output').textContent = step.output;
        }
        updateFinalResult(key, run);
    }

    // Advance one step and stop autoplay when the algorithm is complete.
    function nextStep(key, isAutoPlay) {
        const run = runs[key];
        if (!isAutoPlay && autoTimer !== null) stopAutoPlay();
        if (!run || run.index >= run.steps.length - 1) {
            if (key === 'infix' && run) {
                document.querySelector('#infix-explanation').textContent =
                    `Done. Postfix: ${run.result}`;
            }
            stopAutoPlay();
            return;
        }
        run.index += 1;
        renderRun(key);
    }

    // Reset playback while keeping the user's input available for another run.
    function resetRun(key) {
        stopAutoPlay();
        if (key === 'infix' || key === 'convert' || key === 'reverse') {
            runs[key] = null;
            if (key === 'convert') {
                document.querySelector('#decimal-number').value = '';
                document.querySelector('#number-base').value = '2';
                document.querySelector('#division-steps').replaceChildren();
                document.querySelector('#remainder-stack').replaceChildren();
                document.querySelector('#conversion-output').textContent = '';
                document.querySelector('#convert-explanation').textContent =
                    'Enter a non-negative decimal integer and choose a base.';
            } else if (key === 'reverse') {
                document.querySelector('#reverse-text').value = '';
                document.querySelector('#reverse-characters').replaceChildren();
                document.querySelector('#reverse-stack').replaceChildren();
                document.querySelector('#reverse-output').textContent = '';
                document.querySelector('#reverse-explanation').textContent =
                    'Enter up to 12 characters to begin.';
            }
            if (key === 'infix') {
                document.querySelector('#infix-expression').value = '';
                document.querySelector('#infix-tokens').replaceChildren();
                document.querySelector('#infix-ops').replaceChildren();
                document.querySelector('#infix-output').textContent = '';
                document.querySelector('#infix-explanation').textContent =
                    'Enter an expression and press Convert.';
            }
            document.querySelector(`[data-result="${key}"]`).hidden = true;
            document.querySelector(`[data-result="${key}"] .output-value`).textContent = '';
            document.querySelector(`[data-controls="${key}"]`).hidden = false;
            document.querySelector(`[data-next="${key}"]`).disabled = true;
            document.querySelector(`[data-auto="${key}"]`).disabled = true;
            document.querySelector(`[data-show-result="${key}"]`).disabled = true;
            clearError(key);
            document.querySelector(`[data-visual="${key}"]`).hidden = true;
            return;
        }
        const run = runs[key];
        if (run) run.index = -1;
        document.querySelector(`[data-result="${key}"]`).hidden = true;
        document.querySelector(`[data-next="${key}"]`).disabled = false;
        document.querySelector(`[data-auto="${key}"]`).disabled = false;
        renderRun(key);
    }

    // Start or stop automatic playback for the active algorithm.
    function toggleAutoPlay(key, button) {
        if (autoTimer !== null) {
            stopAutoPlay();
            return;
        }
        if (!runs[key] || runs[key].index >= runs[key].steps.length - 1) return;
        autoButton = button;
        button.textContent = 'Pause Auto Play';
        autoTimer = window.setInterval(function () {
            nextStep(key, true);
        }, 750);
    }

    // Install the API response and prepare its visual step-by-step playback.
    function startRun(key, result, readyText, extra) {
        stopAutoPlay();
        runs[key] = Object.assign({
            steps: result.steps,
            result: result.result,
            index: -1,
            readyText: readyText
        }, extra || {});
        document.querySelector(`[data-controls="${key}"]`).hidden = false;
        document.querySelector(`[data-result="${key}"]`).hidden = true;
        document.querySelector(`[data-result="${key}"] .output-value`).textContent = '';
        document.querySelector(`[data-next="${key}"]`).disabled = false;
        document.querySelector(`[data-auto="${key}"]`).disabled = false;
        const resultButton = document.querySelector(`[data-show-result="${key}"]`);
        if (resultButton) resultButton.disabled = false;
        renderRun(key);
    }

    // Convert infix text and preserve every operator-stack/output snapshot.
    async function convertInfix(expression) {
        if (requestPending.infix) return;
        requestPending.infix = true;
        document.querySelectorAll('[data-tool-form="infix"] button[type="submit"]').forEach(function (button) {
            button.disabled = true;
        });
        document.querySelector('[data-reset="infix"]').disabled = true;
        clearError('infix');
        stopAutoPlay();
        runs.infix = null;
        document.querySelector('[data-result="infix"]').hidden = true;
        document.querySelector('[data-next="infix"]').disabled = true;
        document.querySelector('[data-auto="infix"]').disabled = true;
        document.querySelector('[data-show-result="infix"]').disabled = true;
        document.querySelector('#infix-explanation').textContent = 'Preparing steps...';
        try {
            const result = await postJson('/api/infix-postfix', { expression: expression });
            const tokens = Array.from(expression.replace(/\s/g, ''));
            runs.infix = Object.assign({
                steps: result.steps,
                result: result.result,
                index: -1,
                readyText: 'Ready. Choose Next Step, Auto Play, or Show Result.'
            }, { tokens: tokens });
            document.querySelector('[data-controls="infix"]').hidden = false;
            document.querySelector('[data-next="infix"]').disabled = false;
            document.querySelector('[data-auto="infix"]').disabled = false;
            document.querySelector('[data-show-result="infix"]').disabled = false;
            renderRun('infix');
        } catch (error) {
            document.querySelector('[data-visual="infix"]').hidden = true;
            showError('infix', error.message);
            document.querySelector('#infix-explanation').textContent = error.message;
        } finally {
            requestPending.infix = false;
            document.querySelector('[data-reset="infix"]').disabled = false;
            document.querySelectorAll('[data-tool-form="infix"] button[type="submit"]').forEach(function (button) {
                button.disabled = false;
            });
        }
    }

    // Convert a decimal integer and play division, remainder-push, and pop steps.
    async function convertNumber(event) {
        event.preventDefault();
        if (requestPending.convert) return;
        requestPending.convert = true;
        const submitButton = document.querySelector('[data-tool-form="convert"] button[type="submit"]');
        const resetButton = document.querySelector('[data-reset="convert"]');
        submitButton.disabled = true;
        resetButton.disabled = true;
        clearError('convert');
        stopAutoPlay();
        runs.convert = null;
        document.querySelector('[data-result="convert"]').hidden = true;
        document.querySelector('[data-result="convert"] .output-value').textContent = '';
        document.querySelector('[data-next="convert"]').disabled = true;
        document.querySelector('[data-auto="convert"]').disabled = true;
        document.querySelector('[data-show-result="convert"]').disabled = true;
        document.querySelector('#convert-explanation').textContent = 'Preparing steps...';
        try {
            const number = document.querySelector('#decimal-number').value;
            const base = Number(document.querySelector('#number-base').value);
            const result = await postJson('/api/convert', { number: number, base: base });
            startRun(
                'convert',
                result,
                'Ready. Choose Next Step, Auto Play, or Show Result.'
            );
        } catch (error) {
            document.querySelector('[data-visual="convert"]').hidden = true;
            showError('convert', error.message);
            document.querySelector('#convert-explanation').textContent = error.message;
        } finally {
            requestPending.convert = false;
            submitButton.disabled = false;
            resetButton.disabled = false;
        }
    }

    // Reverse text by playing the recorded character pushes and pops.
    async function reverseText(event) {
        event.preventDefault();
        if (requestPending.reverse) return;
        requestPending.reverse = true;
        const submitButton = document.querySelector('[data-tool-form="reverse"] button[type="submit"]');
        const resetButton = document.querySelector('[data-reset="reverse"]');
        submitButton.disabled = true;
        resetButton.disabled = true;
        clearError('reverse');
        stopAutoPlay();
        runs.reverse = null;
        document.querySelector('[data-result="reverse"]').hidden = true;
        document.querySelector('[data-result="reverse"] .output-value').textContent = '';
        document.querySelector('[data-next="reverse"]').disabled = true;
        document.querySelector('[data-auto="reverse"]').disabled = true;
        document.querySelector('[data-show-result="reverse"]').disabled = true;
        document.querySelector('#reverse-explanation').textContent = 'Preparing steps...';
        try {
            const text = document.querySelector('#reverse-text').value;
            const result = await postJson('/api/reverse', { text: text });
            startRun(
                'reverse',
                result,
                'Ready. Choose Next Step, Auto Play, or Show Result.',
                { characters: Array.from(text) }
            );
        } catch (error) {
            document.querySelector('[data-visual="reverse"]').hidden = true;
            showError('reverse', error.message);
            document.querySelector('#reverse-explanation').textContent = error.message;
        } finally {
            requestPending.reverse = false;
            submitButton.disabled = false;
            resetButton.disabled = false;
        }
    }

    document.querySelectorAll('[data-open-tool]').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            openTool(button.dataset.openTool);
        });
    });
    document.querySelectorAll('[data-back-to-chooser]').forEach(function (button) {
        button.addEventListener('click', returnToChooser);
    });
    document.querySelectorAll('[data-tool-form="infix"]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            convertInfix(document.querySelector('#infix-expression').value);
        });
    });
    document.querySelectorAll('[data-example="infix"]').forEach(function (button) {
        button.addEventListener('click', function () {
            if (requestPending.infix) return;
            const expression = button.dataset.expression;
            document.querySelector('#infix-expression').value = expression;
            convertInfix(expression);
        });
    });
    document.querySelector('[data-tool-form="convert"]').addEventListener('submit', convertNumber);
    document.querySelector('[data-tool-form="reverse"]').addEventListener('submit', reverseText);
    document.querySelectorAll('[data-next]').forEach(function (button) {
        button.addEventListener('click', function () {
            nextStep(button.dataset.next);
        });
    });
    document.querySelectorAll('[data-auto]').forEach(function (button) {
        button.addEventListener('click', function () {
            toggleAutoPlay(button.dataset.auto, button);
        });
    });
    document.querySelectorAll('[data-show-result]').forEach(function (button) {
        button.addEventListener('click', function () {
            const run = runs[button.dataset.showResult];
            if (!run || !run.steps.length) return;
            stopAutoPlay();
            run.index = run.steps.length - 1;
            renderRun(button.dataset.showResult);
        });
    });
    document.querySelectorAll('[data-reset]').forEach(function (button) {
        button.addEventListener('click', function () {
            resetRun(button.dataset.reset);
        });
    });
})();
