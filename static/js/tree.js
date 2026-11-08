(function () {
    const diagram = document.querySelector('#tree-diagram');
    const diagramWrap = document.querySelector('#tree-diagram-wrap');
    const emptyState = document.querySelector('#tree-empty');
    const operationControls = document.querySelector('#tree-operation-controls');
    const selectedLabel = document.querySelector('#tree-selected');
    const message = document.querySelector('#tree-message');
    const hint = document.querySelector('#tree-hint');
    const stepMessage = document.querySelector('#tree-step-message');
    const errorPanel = document.querySelector('#tree-error');
    const nextButton = document.querySelector('#tree-next');
    const autoButton = document.querySelector('#tree-auto');
    const showResultButton = document.querySelector('#tree-show-result');
    const resultPanel = document.querySelector('#tree-result');
    const resultValue = document.querySelector('#tree-result-value');
    const sourceSelect = document.querySelector('#tree-source-method');
    const sourceCode = document.querySelector('#tree-source-code');
    const source = JSON.parse(document.querySelector('#tree-source-data').textContent);
    let tree = JSON.parse(document.querySelector('#tree-initial-data').textContent);
    let selectedPath = null;
    let run = null;
    let stepIndex = -1;
    let autoTimer = null;
    let actionLocked = false;
    let hintMode = 'state';

    function showError(text) {
        errorPanel.querySelector('p').textContent = text;
        errorPanel.hidden = false;
    }

    function clearError() {
        errorPanel.hidden = true;
        errorPanel.querySelector('p').textContent = '';
    }

    async function postJson(url, payload) {
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload || {})
            });
        } catch {
            throw new Error('Could not reach the server. Please try again.');
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
        return result;
    }

    function stopAutoPlay() {
        if (autoTimer !== null) window.clearInterval(autoTimer);
        autoTimer = null;
        autoButton.textContent = 'Auto Play';
        document.querySelectorAll('.tree-page button, .tree-page input, .tree-page select').forEach(function (control) {
            control.disabled = false;
        });
        updateSelectionControls();
        updatePlaybackControls();
    }

    function setSource(method) {
        sourceSelect.value = method;
        sourceCode.textContent = source[method];
    }

    function updateHint() {
        if (hintMode === 'steps') {
            hint.textContent = 'Press Next Step, Auto Play or Show Result.';
            return;
        }
        const selected = tree.nodes.find(function (node) {
            return node.path === selectedPath;
        });
        if (!tree.nodes.length) {
            hint.textContent = 'Type a root value and click Create tree.';
        } else if (selected) {
            hint.textContent = `Selected: ${selected.value}. Type a new value, then click Insert left or Insert right.`;
        } else {
            hint.textContent = 'Click a circle in the tree to choose where to insert.';
        }
    }

    function updateSelectionControls() {
        const hasTree = tree.nodes.length > 0;
        const hasSelection = selectedPath !== null && tree.nodes.some(function (node) {
            return node.path === selectedPath;
        });
        document.querySelector('#tree-new-value').disabled = !hasSelection;
        document.querySelectorAll('[data-insert-side]').forEach(function (button) {
            button.disabled = !hasSelection;
        });
        document.querySelectorAll('[data-traversal]').forEach(function (button) {
            button.disabled = !hasTree;
        });
        document.querySelector('#tree-search-value').disabled = !hasTree;
        document.querySelector('#tree-search').disabled = !hasTree;
        document.querySelector('#tree-delete').disabled = !hasTree;
        if (!hasSelection) {
            selectedPath = null;
            selectedLabel.hidden = true;
            selectedLabel.textContent = '';
        } else {
            const node = tree.nodes.find(function (item) { return item.path === selectedPath; });
            selectedLabel.hidden = false;
            selectedLabel.textContent = `Selected: ${node.value}`;
        }
        updateHint();
        if (actionLocked) {
            operationControls.querySelectorAll('button, input').forEach(function (control) {
                control.disabled = true;
            });
        }
    }

    function renderTree(data, highlights) {
        tree = data;
        diagram.replaceChildren();
        if (!data.nodes.length) {
            diagramWrap.hidden = true;
            emptyState.hidden = false;
            emptyState.textContent = 'Create a tree or load the example';
            updateSelectionControls();
            return;
        }
        emptyState.hidden = true;
        diagramWrap.hidden = false;
        const nodeGap = 110;
        const levelGap = 94;
        const radius = 27;
        const width = Math.max(640, (data.nodes.length - 1) * nodeGap + radius * 2 + 28);
        const depth = data.nodes.reduce(function (max, node) { return Math.max(max, node.y); }, 0);
        const height = Math.max(120, depth * levelGap + radius * 2 + 30);
        diagram.setAttribute('viewBox', `0 0 ${width} ${height}`);
        diagram.setAttribute('width', String(width));
        diagram.setAttribute('height', String(height));
        const positions = new Map();
        data.nodes.forEach(function (node) {
            positions.set(node.path, {
                x: radius + 14 + node.x * nodeGap,
                y: radius + 14 + node.y * levelGap
            });
        });
        data.edges.forEach(function (edge) {
            const parent = positions.get(edge[0]);
            const child = positions.get(edge[1]);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'tree-edge');
            line.setAttribute('x1', String(parent.x));
            line.setAttribute('y1', String(parent.y));
            line.setAttribute('x2', String(child.x));
            line.setAttribute('y2', String(child.y));
            diagram.append(line);
        });
        data.nodes.forEach(function (node) {
            const point = positions.get(node.path);
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'tree-node');
            group.setAttribute('transform', `translate(${point.x} ${point.y})`);
            group.setAttribute('tabindex', '0');
            group.setAttribute('role', 'button');
            group.setAttribute('aria-label', `Select node ${node.value}`);
            group.dataset.path = node.path;
            if (node.path === selectedPath) group.classList.add('is-selected');
            if ((highlights || []).includes(node.path)) group.classList.add('is-highlighted');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', String(radius));
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.textContent = node.value;
            group.append(circle, label);
            group.addEventListener('click', function () { selectNode(node.path); });
            group.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectNode(node.path);
                }
            });
            diagram.append(group);
        });
        updateSelectionControls();
    }

    function selectNode(path) {
        if (autoTimer !== null || actionLocked) return;
        selectedPath = path;
        hintMode = 'state';
        renderTree(tree, []);
    }

    function updatePlaybackControls() {
        const hasRun = Boolean(run);
        if (autoTimer !== null) {
            nextButton.disabled = true;
            autoButton.disabled = false;
            showResultButton.disabled = false;
            return;
        }
        const complete = hasRun && (
            run.steps.length
                ? stepIndex >= run.steps.length - 1
                : run.completed
        );
        nextButton.disabled = !hasRun || run.steps.length === 0 || complete;
        autoButton.disabled = !hasRun || run.steps.length === 0 || complete;
        showResultButton.disabled = !hasRun || complete;
    }

    function showFinalResult() {
        if (!run) return;
        actionLocked = false;
        run.completed = true;
        if (run.steps.length) {
            stepIndex = run.steps.length - 1;
            const lastStep = run.steps[stepIndex];
            renderTree(lastStep.tree || run.finalTree, lastStep.highlight);
            stepMessage.textContent = lastStep.message;
        } else {
            renderTree(run.finalTree, []);
            stepMessage.textContent = run.message;
        }
        resultValue.textContent = run.result;
        resultPanel.hidden = false;
        stopAutoPlay();
        updatePlaybackControls();
    }

    function renderStep() {
        if (!run || stepIndex < 0) {
            actionLocked = Boolean(run && run.lockUntilComplete && run.steps.length);
            resultPanel.hidden = true;
            resultValue.textContent = '';
            renderTree(run ? run.originalTree : tree, []);
            updateSelectionControls();
            stepMessage.textContent = run ? 'Ready. Choose Next Step, Auto Play, or Show Result.' : '';
            updatePlaybackControls();
            return;
        }
        const step = run.steps[stepIndex];
        const stepTree = step.tree || run.originalTree;
        actionLocked = Boolean(run.lockUntilComplete && stepIndex < run.steps.length - 1);
        renderTree(stepTree, step.highlight);
        stepMessage.textContent = step.message;
        resultPanel.hidden = true;
        if (stepIndex === run.steps.length - 1) {
            run.completed = true;
            resultValue.textContent = run.result;
            resultPanel.hidden = false;
            stopAutoPlay();
        }
        updatePlaybackControls();
    }

    function prepareRun(response, options) {
        stopAutoPlay();
        clearError();
        hintMode = 'steps';
        message.textContent = options.readyMessage || 'Steps prepared. Choose Next Step, Auto Play, or Show Result.';
        const originalTree = tree;
        const finalTree = response.tree;
        run = {
            steps: response.steps,
            message: response.message,
            result: options.result === undefined ? response.message : options.result,
            originalTree: originalTree,
            finalTree: finalTree,
            lockUntilComplete: Boolean(options.lockUntilComplete),
            completed: false
        };
        stepIndex = -1;
        resultPanel.hidden = true;
        renderStep();
    }

    async function perform(url, payload, options) {
        clearError();
        try {
            const response = await postJson(url, payload);
            if (options && options.commitImmediately) {
                if (options.selectRoot && response.tree.nodes.length) {
                    selectedPath = '';
                } else if (!options.keepSelection) {
                    selectedPath = null;
                }
                hintMode = 'state';
                renderTree(response.tree, []);
                message.textContent = response.message;
                stepMessage.textContent = '';
                resultPanel.hidden = true;
                run = null;
                updatePlaybackControls();
            } else {
                prepareRun(response, options || {});
            }
            return response;
        } catch (error) {
            showError(error.message);
            return null;
        }
    }

    function nextStep() {
        if (!run) return;
        if (autoTimer !== null) stopAutoPlay();
        if (stepIndex < run.steps.length - 1) {
            stepIndex += 1;
            renderStep();
        }
    }

    function toggleAutoPlay() {
        if (autoTimer !== null) {
            stopAutoPlay();
            return;
        }
        if (!run || stepIndex >= run.steps.length - 1) return;
        autoButton.textContent = 'Pause Auto Play';
        document.querySelectorAll('.tree-page button, .tree-page input, .tree-page select').forEach(function (control) {
            control.disabled = true;
        });
        nextButton.disabled = true;
        autoButton.disabled = false;
        showResultButton.disabled = false;
        autoTimer = window.setInterval(function () {
            if (stepIndex >= run.steps.length - 1) {
                stopAutoPlay();
                return;
            }
            stepIndex += 1;
            renderStep();
        }, 750);
    }

    document.querySelector('#tree-create-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const value = document.querySelector('#tree-root-value').value;
        perform('/api/tree/create', { value: value }, {
            commitImmediately: true,
            selectRoot: true
        });
    });

    document.querySelector('#tree-example').addEventListener('click', function () {
        perform('/api/tree/example', {}, {
            commitImmediately: true,
            selectRoot: true
        });
    });

    document.querySelectorAll('[data-insert-side]').forEach(function (button) {
        button.addEventListener('click', function () {
            const side = button.dataset.insertSide;
            setSource(`insert_${side}`);
            perform('/api/tree/insert', {
                path: selectedPath,
                side: side,
                value: document.querySelector('#tree-new-value').value
            }, {
                commitImmediately: true,
                keepSelection: true
            });
        });
    });

    document.querySelectorAll('[data-traversal]').forEach(function (button) {
        button.addEventListener('click', function () {
            const type = button.dataset.traversal;
            setSource(`${type}_traversal`);
            perform('/api/tree/traverse', { type: type }, { result: undefined });
        });
    });

    document.querySelector('#tree-search').addEventListener('click', function () {
        setSource('search');
        perform('/api/tree/search', {
            value: document.querySelector('#tree-search-value').value
        });
    });

    document.querySelector('#tree-delete').addEventListener('click', function () {
        setSource('delete_node');
        perform('/api/tree/delete', {
            value: document.querySelector('#tree-search-value').value
        }, { lockUntilComplete: true });
    });

    nextButton.addEventListener('click', nextStep);
    autoButton.addEventListener('click', toggleAutoPlay);
    showResultButton.addEventListener('click', showFinalResult);
    sourceSelect.addEventListener('change', function () { setSource(sourceSelect.value); });

    document.querySelector('#tree-reset').addEventListener('click', function () {
        actionLocked = false;
        stopAutoPlay();
        clearError();
        postJson('/api/tree/reset', {}).then(function (response) {
            selectedPath = null;
            run = null;
            stepIndex = -1;
            actionLocked = false;
            hintMode = 'state';
            renderTree(response.tree, []);
            message.textContent = 'Create a tree or load the example';
            stepMessage.textContent = '';
            resultValue.textContent = '';
            resultPanel.hidden = true;
            document.querySelector('#tree-root-value').value = '';
            document.querySelector('#tree-new-value').value = '';
            document.querySelector('#tree-search-value').value = '';
            updatePlaybackControls();
        }).catch(function (error) {
            showError(error.message);
        });
    });

    renderTree(tree, []);
})();
