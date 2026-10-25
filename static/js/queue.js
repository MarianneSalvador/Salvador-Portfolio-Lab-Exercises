(function () {
    const input = document.querySelector('#queue-input');
    const tube = document.querySelector('#queue-tube');
    const nodesElement = document.querySelector('#queue-nodes');
    const emptyLabel = document.querySelector('#queue-empty');
    const statusElement = document.querySelector('#queue-status');
    const sizeElement = document.querySelector('#queue-size');
    const frontElement = document.querySelector('#queue-front');
    const rearElement = document.querySelector('#queue-rear');
    const historyElement = document.querySelector('#queue-history');
    const stepsElement = document.querySelector('#queue-operation-steps');
    const codeElement = document.querySelector('#queue-method-code');
    const methodNameElement = document.querySelector('#queue-method-name');
    const buttons = document.querySelectorAll('[data-action]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const historyLimit = 8;
    const queueLimit = 10;
    let values = [];
    let operationHistory = [];
    let busy = false;

    const methods = {
        enqueue: {
            steps: [
                'Create new_node.',
                'If empty, front and rear both point to it.',
                'Otherwise rear.next = new_node, then rear = new_node.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">enqueue</span>(self, data):',
                '    new_node = <span class="code-function">Node</span>(data)',
                '    <span class="code-keyword">if</span> self.is_empty():',
                '        self.front = new_node',
                '        self.rear = new_node',
                '    <span class="code-keyword">else</span>:',
                '        self.rear<span class="code-next">.next</span> = new_node',
                '        self.rear = new_node'
            ]
        },
        dequeue: {
            steps: [
                'If the queue is empty, return None.',
                'Keep a reference to the front node.',
                'Move front to front.next.',
                'Detach removed_node by setting its next to None.',
                'If the queue is now empty, set rear to None.',
                'Return removed_node.data.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">dequeue</span>(self):',
                '    <span class="code-keyword">if</span> self.is_empty():',
                '        <span class="code-keyword">return</span> <span class="code-none">None</span>',
                '    removed_node = self.front',
                '    self.front = self.front<span class="code-next">.next</span>',
                '    removed_node<span class="code-next">.next</span> = <span class="code-none">None</span>',
                '    <span class="code-keyword">if</span> self.front <span class="code-keyword">is</span> <span class="code-none">None</span>:',
                '        self.rear = <span class="code-none">None</span>',
                '    <span class="code-keyword">return</span> removed_node.data'
            ]
        },
        peek: {
            steps: [
                'If the queue has a front node, read and return its data.',
                'Otherwise, return None. The queue does not change.'
            ],
            code: [
                '<span class="code-keyword">def</span> <span class="code-function">peek</span>(self):',
                '    <span class="code-keyword">if</span> self.is_empty():',
                '        <span class="code-keyword">return</span> <span class="code-none">None</span>',
                '    <span class="code-keyword">return</span> self.front.data'
            ]
        },
        reset: {
            steps: ['Set front and rear to None; the queue is cleared.'],
            code: ['self.front = self.rear = <span class="code-none">None</span>']
        }
    };

    function pause(milliseconds) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, reducedMotion ? 0 : milliseconds);
        });
    }

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
        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error('The server returned an invalid response. Please try again.');
        }
        if (!response.ok) throw new Error(result.error || 'The queue request could not be completed.');
        return result;
    }

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

    function updateMetrics(items) {
        sizeElement.textContent = String(items.length);
        frontElement.textContent = items.length ? items[0] : 'None';
        rearElement.textContent = items.length ? items[items.length - 1] : 'None';
    }

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

    function renderQueue(items, options) {
        const settings = options || {};
        values = items.slice();
        emptyLabel.hidden = values.length > 0;
        nodesElement.replaceChildren();
        values.forEach(function (value, index) {
            const slot = document.createElement('div');
            const isIncoming = settings.incoming && index === values.length - 1;
            const isRemoved = settings.removing && index === 0;
            slot.className = 'queue-slot';
            if (isIncoming) slot.classList.add('queue-slot--incoming');
            if (isRemoved) slot.classList.add('queue-slot--removed');

            const pointerRow = document.createElement('div');
            pointerRow.className = 'queue-pointer-row';
            if (index === settings.frontIndex || (settings.frontIndex === undefined && index === 0)) {
                const label = document.createElement('span');
                label.className = 'queue-pointer-label';
                label.textContent = 'FRONT';
                pointerRow.append(label);
            }
            if (index === settings.rearIndex || (settings.rearIndex === undefined && index === values.length - 1)) {
                const label = document.createElement('span');
                label.className = 'queue-pointer-label';
                label.textContent = 'REAR';
                pointerRow.append(label);
            }
            slot.append(pointerRow);

            const node = document.createElement('article');
            node.className = 'stack-node queue-node';
            if (index === settings.frontIndex || (settings.frontIndex === undefined && index === 0)) {
                node.classList.add('stack-node--top');
            }
            if (settings.reading && index === 0) node.classList.add('queue-node--reading');
            node.setAttribute('aria-label', `Node ${index + 1}, data ${value}`);

            const data = document.createElement('div');
            data.className = 'node-data';
            const dataLabel = document.createElement('span');
            dataLabel.className = 'node-part-label';
            dataLabel.textContent = 'DATA';
            const dataValue = document.createElement('span');
            dataValue.className = 'node-value';
            dataValue.textContent = value;
            data.append(dataLabel);
            if (isIncoming) {
                const tag = document.createElement('span');
                tag.className = 'queue-op-tag';
                tag.textContent = 'new_node';
                data.append(tag);
            } else if (isRemoved) {
                const tag = document.createElement('span');
                tag.className = 'queue-op-tag';
                tag.textContent = 'removed_node';
                data.append(tag);
            } else if (settings.reading && index === 0) {
                const tag = document.createElement('span');
                tag.className = 'queue-op-tag';
                tag.textContent = 'read';
                data.append(tag);
            }
            data.append(dataValue);

            const next = document.createElement('div');
            next.className = 'node-next';
            const dot = document.createElement('span');
            dot.className = 'node-dot';
            const nextLabel = document.createElement('span');
            nextLabel.className = 'node-part-label';
            nextLabel.textContent = 'NEXT';
            next.append(dot, nextLabel);
            node.append(data, next);
            slot.append(node);
            nodesElement.append(slot);

            const connector = document.createElement('span');
            connector.className = 'queue-connector';
            const isLast = index === values.length - 1;
            const linksToIncoming = settings.incoming && index === values.length - 2;
            if (isRemoved && settings.detached) {
                connector.className = 'queue-connector queue-terminal';
                const terminalX = document.createElement('span');
                terminalX.className = 'queue-terminal-x';
                terminalX.textContent = 'X';
                const terminalLabel = document.createElement('span');
                terminalLabel.className = 'queue-terminal-label';
                terminalLabel.textContent = 'next = None';
                connector.append(terminalX, terminalLabel);
            } else if (isLast) {
                connector.className = 'queue-connector queue-terminal';
                const terminalX = document.createElement('span');
                terminalX.className = 'queue-terminal-x';
                terminalX.textContent = 'X';
                connector.append(terminalX);
            } else {
                connector.textContent = '→';
                connector.setAttribute('aria-label', 'next node');
            }
            if (linksToIncoming) connector.classList.add('queue-connector--incoming');
            nodesElement.append(connector);
        });
        updateMetrics(values);
        tube.setAttribute(
            'aria-label',
            values.length ? `Queue, front to rear: ${values.join(', ')}` : 'Queue is empty, front and rear are None'
        );
    }

    async function animateEnqueue(before, after) {
        const oldRearIndex = before.length ? before.length - 1 : -1;
        showOperation('enqueue', 0, 1);
        renderQueue(after, {
            incoming: true,
            frontIndex: 0,
            rearIndex: before.length ? oldRearIndex : 0
        });
        updateMetrics(before);
        const incoming = nodesElement.querySelector('.queue-slot--incoming');
        await pause(40);
        if (incoming) incoming.classList.add('is-entered');
        await pause(420);
        if (before.length) {
            showOperation('enqueue', 2, 6);
            const connector = nodesElement.querySelector('.queue-connector--incoming');
            if (connector) connector.classList.add('is-connected');
            await pause(340);
            renderQueue(after);
            showOperation('enqueue', 2, 7);
        } else {
            showOperation('enqueue', 1, 3);
            await pause(340);
            showOperation('enqueue', 1, 4);
            renderQueue(after);
        }
    }

    async function animateDequeue(before, after) {
        showOperation('dequeue', 1, 3);
        renderQueue(before, { removing: true, frontIndex: 0 });
        await pause(360);
        showOperation('dequeue', 2, 4);
        renderQueue(before, {
            removing: true,
            detached: true,
            frontIndex: after.length ? 1 : -1,
            rearIndex: after.length ? after.length : -1
        });
        updateMetrics(after);
        await pause(420);
        showOperation('dequeue', 3, 5);
        const removed = nodesElement.querySelector('.queue-slot--removed');
        if (removed) removed.classList.add('is-exiting');
        await pause(380);
        showOperation('dequeue', after.length ? 5 : 4, after.length ? 8 : 7);
        renderQueue(after);
    }

    async function animatePeek(items) {
        showOperation('peek', items.length ? 0 : 1, items.length ? 3 : 2);
        renderQueue(items, { reading: items.length > 0 });
        await pause(1150);
        renderQueue(items);
    }

    function setBusy(isBusy) {
        busy = isBusy;
        buttons.forEach(function (button) {
            button.disabled = isBusy;
        });
        input.disabled = isBusy;
    }

    async function perform(action) {
        if (busy) return;
        setBusy(true);
        statusElement.classList.remove('is-error');
        try {
            if (action === 'enqueue') {
                const value = input.value.trim();
                if (!value) throw new Error('Please enter a value before enqueueing.');
                if (value.length > 12) throw new Error('Please use a value no longer than 12 characters.');
                if (values.length >= queueLimit) throw new Error('The queue is full (10 items maximum). Dequeue an item before enqueueing again.');
                const before = values.slice();
                const result = await requestJson('/api/queue/enqueue', 'POST', { value: value });
                statusElement.textContent = `enqueue() returned None. ${value} was added to the rear of the queue.`;
                addHistoryEntry(`enqueue(${value}) returned None.`);
                input.value = '';
                await animateEnqueue(before, result.queue);
            } else if (action === 'dequeue') {
                const before = values.slice();
                const result = await requestJson('/api/queue/dequeue', 'POST');
                if (result.dequeued === null) {
                    statusElement.textContent = 'dequeue() returned None: the queue is empty.';
                    addHistoryEntry('dequeue() returned None. The queue was unchanged.');
                    showOperation('dequeue', 0, 1);
                    renderQueue(result.queue);
                } else {
                    statusElement.textContent = `dequeue() returned ${result.dequeued}. It was removed from the front of the queue.`;
                    addHistoryEntry(`dequeue() returned ${result.dequeued}.`);
                    await animateDequeue(before, result.queue);
                }
            } else if (action === 'peek') {
                const result = await requestJson('/api/queue/peek', 'GET');
                statusElement.textContent = result.peek === null
                    ? 'peek() returned None. The queue is empty.'
                    : `peek() returned ${result.peek}. It is still in the queue.`;
                addHistoryEntry(result.peek === null
                    ? 'peek() returned None. The queue was unchanged.'
                    : `peek() returned ${result.peek}.`);
                await animatePeek(values.slice());
            } else {
                const result = await requestJson('/api/queue/reset', 'POST');
                renderQueue(result.queue);
                showOperation('reset', 0, 0);
                statusElement.textContent = 'reset returned None. The queue was cleared.';
                addHistoryEntry('reset returned None. The queue was cleared.');
            }
        } catch (error) {
            statusElement.textContent = error.message;
            statusElement.classList.add('is-error');
        } finally {
            setBusy(false);
        }
    }

    async function initialize() {
        try {
            const result = await requestJson('/api/queue/state', 'GET');
            renderQueue(result.queue);
            showOperation('enqueue', -1);
            statusElement.textContent = result.queue.length
                ? 'Queue ready.'
                : 'Queue is empty. Enqueue a value to get started.';
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
        if (event.key === 'Enter') {
            event.preventDefault();
            perform('enqueue');
        }
    });
    initialize();
}());
