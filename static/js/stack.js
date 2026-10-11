(function () {
    const input = document.querySelector('#stack-input');
    const bin = document.querySelector('#stack-bin');
    const nodesElement = document.querySelector('#stack-nodes');
    const pointer = document.querySelector('#top-pointer');
    const emptyLabel = document.querySelector('#stack-empty');
    const statusElement = document.querySelector('#stack-status');
    const sizeElement = document.querySelector('#stack-size');
    const topElement = document.querySelector('#stack-top');
    const historyElement = document.querySelector('#stack-history');
    const stepsElement = document.querySelector('#operation-steps');
    const codeElement = document.querySelector('#method-code');
    const methodNameElement = document.querySelector('#method-name');
    const buttons = document.querySelectorAll('[data-action]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const historyLimit = 8;
    let values = [];
    let operationHistory = [];
    let busy = false;

    const methods = {
        push: {
            steps: [
                'Create a new node to hold the input data.',
                'If the stack already has a top, link the new node to it.',
                'Make the new node the top of the stack.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">push</span>(self, data):',
                '    new_node = <span class="code-function">Node</span>(data)',
                '    <span class="code-keyword">if</span> self.top:',
                '        new_node<span class="code-next">.next</span> = self.top',
                '    self.top = new_node'
            ]
        },
        pop: {
            steps: [
                'If the stack is empty, return None.',
                'Keep a reference to the current top node.',
                'Move top to the next node down.',
                'Detach the popped node, then return its data.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">pop</span>(self):',
                '    <span class="code-keyword">if</span> self.top <span class="code-keyword">is</span> <span class="code-none">None</span>:',
                '        <span class="code-keyword">return</span> <span class="code-none">None</span>',
                '    <span class="code-keyword">else</span>:',
                '        popped_node = self.top',
                '        self.top = self.top<span class="code-next">.next</span>',
                '        popped_node<span class="code-next">.next</span> = <span class="code-none">None</span>',
                '        <span class="code-keyword">return</span> popped_node.data'
            ]
        },
        peek: {
            steps: [
                'If the stack has a top node, read and return its data.',
                'Otherwise, return None. The stack does not change.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">peek</span>(self):',
                '    <span class="code-keyword">if</span> self.top:',
                '        <span class="code-keyword">return</span> self.top.data',
                '    <span class="code-keyword">else</span>:',
                '        <span class="code-keyword">return</span> <span class="code-none">None</span>'
            ]
        },
        reset: {
            steps: ['Set the top reference to None; every node is released.'],
            code: ['self.top = <span class="code-none">None</span>']
        }
    };

    // Make a small delay between highlighted lines so each operation is readable.
    function pause(milliseconds) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, reducedMotion ? 0 : milliseconds);
        });
    }

    // Call one of the JSON API routes and surface server errors in the status panel.
    async function requestJson(path, method, payload) {
        const options = { method: method || 'GET', headers: {} };
        if (payload !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }
        let response;
        try {
            response = await fetch(path, options);
        } catch {
            throw new Error('Could not reach the server. Please try again.');
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The stack request could not be completed.');
        return result;
    }

    // Show the steps and color-coded Python method for the selected operation.
    function showOperation(operation, activeStep, codeLineIndex) {
        const method = methods[operation];
        methodNameElement.textContent = operation;
        stepsElement.replaceChildren();
        method.steps.forEach(function (step, index) {
            const item = document.createElement('li');
            item.textContent = step;
            if (index === activeStep) item.classList.add('is-current');
            stepsElement.append(item);
        });
        codeElement.replaceChildren();
        const highlightedLine = codeLineIndex === undefined
            ? (activeStep < 0 ? -1 : activeStep + 1)
            : codeLineIndex;
        method.code.forEach(function (line, index) {
            const lineElement = document.createElement('span');
            lineElement.className = 'stack-code-line';
            lineElement.innerHTML = line;
            if (index === highlightedLine) {
                lineElement.classList.add('is-current');
                lineElement.setAttribute('aria-current', 'step');
            }
            codeElement.append(lineElement);
        });
    }

    // Update live metadata separately when a node is visible before links change.
    function updateMetrics(items) {
        sizeElement.textContent = String(items.length);
        topElement.textContent = items.length ? items[0] : 'None';
    }

    // Keep the latest operations visible with their return values and effects.
    function addHistoryEntry(message) {
        operationHistory.unshift(message);
        operationHistory = operationHistory.slice(0, historyLimit);
        historyElement.replaceChildren();
        operationHistory.forEach(function (entry) {
            const item = document.createElement('li');
            item.textContent = entry;
            historyElement.append(item);
        });
    }

    // Place TOP beside the selected node using its rendered position in the bin.
    function moveTopPointer(index) {
        const nodes = nodesElement.querySelectorAll('.stack-node');
        const node = nodes[index];
        pointer.hidden = !node;
        if (node) node.append(pointer);
    }

    // Keep the stack diagram and live size/top readouts in sync.
    function renderStack(items, options) {
        const settings = options || {};
        const topIndex = settings.topIndex === undefined ? 0 : settings.topIndex;
        values = items.slice();
        nodesElement.replaceChildren();
        emptyLabel.hidden = values.length > 0;
        pointer.hidden = true;
        values.forEach(function (value, index) {
            const node = document.createElement('article');
            const isPopping = settings.popping && index === 0;
            const isIncoming = settings.incoming && index === 0;
            node.className = 'stack-node';
            if (index === 0 && !settings.popping) node.classList.add('stack-node--top');
            if (isIncoming) node.classList.add('stack-node--incoming');
            if (isPopping) node.classList.add('stack-node--popping');
            node.setAttribute('aria-label', `Node ${index + 1}, data ${value}`);

            const data = document.createElement('div');
            data.className = 'node-data';
            const dataLabel = document.createElement('span');
            dataLabel.className = 'node-part-label';
            dataLabel.textContent = 'DATA';
            const dataValue = document.createElement('span');
            dataValue.className = 'node-value';
            dataValue.textContent = value;
            data.append(dataLabel, dataValue);

            const next = document.createElement('div');
            next.className = 'node-next';
            const dot = document.createElement('span');
            dot.className = 'node-dot';
            const nextLabel = document.createElement('span');
            nextLabel.className = 'node-part-label';
            nextLabel.textContent = 'NEXT';
            next.append(dot, nextLabel);
            node.append(data, next);

            if (isIncoming) {
                const tag = document.createElement('span');
                tag.className = 'node-tag';
                tag.textContent = 'new_node';
                node.append(tag);
            } else if (isPopping) {
                const tag = document.createElement('span');
                tag.className = 'node-tag';
                tag.textContent = 'popped_node';
                node.append(tag);
            }
            if (settings.reading && index === 0) {
                node.classList.add('stack-node--reading');
                const marker = document.createElement('span');
                marker.className = 'read-marker';
                marker.textContent = 'read ↓';
                node.append(marker);
            }
            nodesElement.append(node);

            const nextIsNone = (isPopping && settings.nextIsNone) || index === values.length - 1;
            const connector = document.createElement('span');
            connector.className = 'stack-connector';
            if (isIncoming && !nextIsNone) connector.classList.add('stack-connector--incoming');
            const connectorArrow = document.createElement('span');
            connectorArrow.textContent = '↓';
            if (nextIsNone) {
                connector.classList.add('stack-connector--terminal');
                const terminal = document.createElement('span');
                terminal.className = 'stack-terminal-x';
                terminal.textContent = 'X';
                connector.append(connectorArrow, terminal);
                connector.setAttribute('aria-label', 'next is None');
            } else {
                connector.append(connectorArrow);
                connector.setAttribute('aria-hidden', 'true');
            }
            nodesElement.append(connector);
        });
        moveTopPointer(topIndex);
        updateMetrics(values);
        bin.setAttribute(
            'aria-label',
            values.length ? `Stack, top to bottom: ${values.join(', ')}` : 'Stack is empty, top is None'
        );
    }

    // Highlight the Python steps while the new node links in above the old top.
    async function animatePush(before, after) {
        showOperation('push', 0);
        renderStack(after, { incoming: true, topIndex: before.length ? 1 : -1 });
        updateMetrics(before);
        const incoming = nodesElement.querySelector('.stack-node--incoming');
        await pause(40);
        if (incoming) incoming.classList.add('is-entered');
        await pause(520);
        showOperation('push', 1);
        await pause(320);
        showOperation('push', 1, 3);
        if (incoming) incoming.classList.add('is-connected');
        await pause(520);
        showOperation('push', 2, 4);
        moveTopPointer(0);
        updateMetrics(after);
        await pause(420);
        renderStack(after);
    }

    // Move TOP first, detach the old top with NEXT = None, then slide it away.
    async function animatePop(before, after) {
        showOperation('pop', 1, 4);
        renderStack(before, { popping: true, topIndex: 0 });
        await pause(420);
        showOperation('pop', 2, 5);
        moveTopPointer(after.length ? 1 : -1);
        updateMetrics(after);
        await pause(420);
        showOperation('pop', 3, 6);
        renderStack(before, { popping: true, nextIsNone: true, topIndex: after.length ? 1 : -1 });
        const popped = nodesElement.querySelector('.stack-node--popping');
        await pause(500);
        showOperation('pop', 3, 7);
        if (popped) popped.classList.add('is-exiting');
        await pause(400);
        renderStack(after);
    }

    // Briefly mark the current top node as read without changing any links.
    async function animatePeek(items) {
        showOperation('peek', items.length ? 0 : 1, items.length ? 2 : 4);
        renderStack(items, { reading: items.length > 0 });
        await pause(1150);
        renderStack(items);
    }

    // Disable controls during an animation so operations cannot overlap.
    function setBusy(isBusy) {
        busy = isBusy;
        buttons.forEach(function (button) {
            button.disabled = isBusy;
        });
        input.disabled = isBusy;
    }

    // Run the requested operation, animate the returned state, and report errors.
    async function perform(action) {
        if (busy) return;
        setBusy(true);
        statusElement.classList.remove('is-error');
        try {
            if (action === 'push') {
                const value = input.value;
                if (!value.trim()) throw new Error('Please enter a value before pushing.');
                const before = values.slice();
                const result = await requestJson('/api/push', 'POST', { value: value });
                statusElement.textContent = `push() returned None. ${value} was added to the stack.`;
                addHistoryEntry(`push(${value}) returned None. ${value} was added to the stack.`);
                input.value = '';
                await animatePush(before, result.stack);
            } else if (action === 'pop') {
                const before = values.slice();
                const result = await requestJson('/api/pop', 'POST');
                if (result.popped === null) {
                    statusElement.textContent = 'pop() returned None. The stack is empty.';
                    addHistoryEntry('pop() returned None. The stack was unchanged.');
                    showOperation('pop', 0);
                    renderStack(result.stack);
                } else {
                    statusElement.textContent = `pop() returned ${result.popped}. It was removed from the stack.`;
                    addHistoryEntry(`pop() returned ${result.popped}. It was removed from the stack.`);
                    await animatePop(before, result.stack);
                }
            } else if (action === 'peek') {
                const result = await requestJson('/api/peek', 'GET');
                statusElement.textContent = result.peek === null
                    ? 'peek() returned None. The stack is empty.'
                    : `peek() returned ${result.peek}. It is still in the stack.`;
                addHistoryEntry(result.peek === null
                    ? 'peek() returned None. The stack was unchanged.'
                    : `peek() returned ${result.peek}. It is still in the stack.`);
                await animatePeek(values.slice());
            } else {
                const result = await requestJson('/api/reset', 'POST');
                renderStack(result.stack);
                showOperation('reset', 0, 0);
                statusElement.textContent = 'reset returned None. The stack was cleared.';
                addHistoryEntry('reset returned None. The stack was cleared.');
            }
        } catch (error) {
            statusElement.textContent = error.message;
            statusElement.classList.add('is-error');
        } finally {
            setBusy(false);
        }
    }

    // Load the server's current stack when the page opens.
    async function initialize() {
        try {
            const result = await requestJson('/api/state', 'GET');
            renderStack(result.stack);
            showOperation('push', -1);
            statusElement.textContent = result.stack.length
                ? 'Stack ready.'
                : 'Stack is empty. Push a value to get started.';
        } catch (error) {
            statusElement.textContent = error.message;
            statusElement.classList.add('is-error');
        }
    }

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            perform(button.dataset.action);
        });
    });
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') perform('push');
    });
    initialize();
})();
