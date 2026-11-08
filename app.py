import inspect
import math
import os
import re
import secrets

from flask import Flask, jsonify, render_template, request, session
from binary_tree import BinaryTree, Node as TreeNode
from queue_ll import Queue
from sorting_algorithms import SortingAlgorithms
from stack import Stack

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32)

EXPERIENCES = [
    {
        "title": "Computer Engineering Department Intramurals (CPE Trials)",
        "date": "2025 - 2026",
        "image": "images/experiences/cpe trials.jpg",
        "role": "Host",
        "bullets": [
            "Co-hosted the event and maintained a lively atmosphere.",
            "Engaged the audience throughout the program.",
            "Guided the event flow and helped ensure its success.",
        ],
    },
    {
        "title": "CPE Hard Hatting Ceremony",
        "date": "2025 - 2026",
        "image": "images/experiences/hardhatting.jpg",
        "role": "Host",
        "bullets": [
            "Co-hosted the ceremony while maintaining its formal tone.",
            "Welcomed future computer engineers as they prepared for their internships.",
            "Guided the program flow from opening to closing.",
        ],
    },
    {
        "title": "ACCESS - Junior Access Officer (JAO) Seminar Series",
        "date": "2025 - 2026",
        "image": "images/experiences/seminar series pic.jpg",
        "organization": "ACCESS",
        "role": "Host",
        "bullets": [
            "Served as both host and speaker for the seminar series.",
            "Shared insights on the roles and responsibilities of Junior ACCESS Officers.",
            "Guided the session and engaged fellow participants.",
        ],
    },
    {
        "title": "ACCESS - Freshman Orientation of the Computer Engineering Department",
        "date": "2026 - 2027",
        "image": "images/experiences/fo.jpg",
        "organization": "ACCESS",
        "role": "Host",
        "bullets": [
            "Co-hosted the morning orientation for incoming CPE students.",
            "Welcomed freshmen to the Computer Engineering Department.",
            "Guided the onboarding program and its activities.",
        ],
    },
    {
        "title": "Cisco NetConnect PUP-Manila General Onboarding",
        "date": "2026 - 2027",
        "image": "images/experiences/cisco.jpg",
        "organization": "CISCO",
        "role": "Host",
        "bullets": [
            "Co-hosted the program and maintained a lively atmosphere.",
            "Introduced speakers and responsible persons throughout the event.",
            "Managed the program flow from opening to closing.",
        ],
    },
]


class Node:
    def __init__(self, data):
        self.data = data
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def add_tail(self, data):
        new_node = Node(data)
        if self.head is None:
            self.head = new_node
            return

        current = self.head
        while current.next is not None:
            current = current.next
        current.next = new_node

    def add_head(self, data):
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node

    def remove_head(self):
        if self.head is None:
            return None

        value = self.head.data
        self.head = self.head.next
        return value

    def remove_tail(self):
        if self.head is None:
            return None

        if self.head.next is None:
            value = self.head.data
            self.head = None
            return value

        previous = None
        current = self.head
        while current.next is not None:
            previous = current
            current = current.next

        previous.next = None
        return current.data

    def search(self, data):
        current = self.head
        position = 1
        while current is not None:
            if current.data == data:
                return position
            current = current.next
            position += 1
        return None

    def remove_value(self, data):
        if self.head is None:
            return False

        if self.head.data == data:
            self.head = self.head.next
            return True

        current = self.head
        while current.next is not None:
            if current.next.data == data:
                current.next = current.next.next
                return True
            current = current.next

        return False

    def to_list(self):
        items = []
        current = self.head
        while current is not None:
            items.append(current.data)
            current = current.next
        return items


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/works')
def works():
    return render_template('works.html')


@app.route('/works/stack')
def stack_visualization():
    return render_template('stack.html')


@app.route('/works/stack-tools')
def stack_tools():
    return render_template('stack_tools.html')


@app.route('/works/queue')
def queue_visualization():
    return render_template('queue_visualizer.html')


def _tree_from_session():
    def build_node(data):
        if data is None:
            return None
        node = TreeNode(data['value'])
        node.left = build_node(data.get('left'))
        node.right = build_node(data.get('right'))
        return node

    tree = BinaryTree()
    tree.root = build_node(session.get('binary_tree'))
    return tree


def _tree_to_session(node):
    if node is None:
        return None
    return {
        'value': str(node.data),
        'left': _tree_to_session(node.left),
        'right': _tree_to_session(node.right),
    }


def _tree_paths(root):
    paths = {}

    def visit(node, path):
        if node is None:
            return
        paths[path] = node
        visit(node.left, path + 'l')
        visit(node.right, path + 'r')

    visit(root, '')
    return paths


def _tree_layout(root):
    nodes = []
    edges = []

    def inorder(node, path, depth):
        if node is None:
            return
        inorder(node.left, path + 'l', depth + 1)
        nodes.append({
            'path': path,
            'value': str(node.data),
            'x': len(nodes),
            'y': depth,
        })
        inorder(node.right, path + 'r', depth + 1)

    inorder(root, '', 0)

    def add_edges(node, path):
        if node is None:
            return
        if node.left is not None:
            edges.append([path, path + 'l'])
            add_edges(node.left, path + 'l')
        if node.right is not None:
            edges.append([path, path + 'r'])
            add_edges(node.right, path + 'r')

    add_edges(root, '')
    return {'nodes': nodes, 'edges': edges}


def _tree_api_response(root, message='', steps=None, status=200):
    return jsonify(
        tree=_tree_layout(root),
        message=message,
        steps=steps or [],
    ), status


def _tree_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, 'Request body must be a JSON object.'
    return payload, None


def _tree_value(raw_value):
    if isinstance(raw_value, bool) or not isinstance(raw_value, (str, int)):
        return None, 'Enter a value that is 1 to 6 characters long.'
    value = str(raw_value).strip()
    if not 1 <= len(value) <= 6:
        return None, 'Enter a value that is 1 to 6 characters long.'
    return value, None


def _tree_node_at_path(root, path):
    if not isinstance(path, str) or any(direction not in 'lr' for direction in path):
        return None
    node = root
    for direction in path:
        if node is None:
            return None
        node = node.left if direction == 'l' else node.right
    return node


def _tree_max_depth(root):
    if root is None:
        return 0
    return 1 + max(_tree_max_depth(root.left), _tree_max_depth(root.right))


def _tree_size(root):
    if root is None:
        return 0
    return 1 + _tree_size(root.left) + _tree_size(root.right)


def _tree_preorder_nodes(root):
    result = []

    def visit(node, path):
        if node is None:
            return
        result.append((path, node))
        visit(node.left, path + 'l')
        visit(node.right, path + 'r')

    visit(root, '')
    return result


@app.route('/tree')
def binary_tree_visualizer():
    tree = _tree_from_session()
    initial_tree = _tree_layout(tree.root)
    method_names = (
        'insert_left',
        'insert_right',
        'preorder_traversal',
        'inorder_traversal',
        'postorder_traversal',
        'search',
        'delete_node',
    )
    source = {
        name: inspect.getsource(getattr(BinaryTree, name))
        for name in method_names
    }
    return render_template(
        'binary_tree_visualizer.html',
        initial_tree=initial_tree,
        initial_message=(
            'Tree restored from your session.'
            if initial_tree['nodes']
            else 'Create a tree or load the example'
        ),
        source=source,
    )


@app.route('/api/tree/create', methods=['POST'])
def binary_tree_create():
    payload, error = _tree_payload()
    if error:
        tree = _tree_from_session()
        return _tree_api_response(tree.root, error, status=400)
    value, error = _tree_value(payload.get('value'))
    if error:
        tree = _tree_from_session()
        return _tree_api_response(tree.root, error, status=400)
    tree = BinaryTree()
    tree.root = TreeNode(value)
    session['binary_tree'] = _tree_to_session(tree.root)
    return _tree_api_response(tree.root, f'Created a tree with root {value}.')


@app.route('/api/tree/example', methods=['POST'])
def binary_tree_example():
    tree = BinaryTree()
    tree.root = TreeNode('R')
    node_a = tree.insert_left(tree.root, 'A')
    node_b = tree.insert_right(tree.root, 'B')
    tree.insert_left(node_a, 'C')
    tree.insert_right(node_a, 'D')
    tree.insert_left(node_b, 'E')
    node_f = tree.insert_right(node_b, 'F')
    tree.insert_left(node_f, 'G')
    session['binary_tree'] = _tree_to_session(tree.root)
    return _tree_api_response(tree.root, 'Loaded the lecture example tree.')


@app.route('/api/tree/insert', methods=['POST'])
def binary_tree_insert():
    tree = _tree_from_session()
    payload, error = _tree_payload()
    if error:
        return _tree_api_response(tree.root, error, status=400)
    value, error = _tree_value(payload.get('value'))
    if error:
        return _tree_api_response(tree.root, error, status=400)
    path = payload.get('path')
    parent = _tree_node_at_path(tree.root, path)
    if parent is None:
        return _tree_api_response(tree.root, 'Select a node before inserting.', status=400)
    side = payload.get('side')
    if not isinstance(side, str) or side not in {'left', 'right'}:
        return _tree_api_response(tree.root, 'Choose left or right for the insertion side.', status=400)
    if _tree_size(tree.root) >= 15:
        return _tree_api_response(tree.root, 'Tree is full (maximum 15 nodes and 5 levels).', status=400)

    current_child = parent.left if side == 'left' else parent.right
    branch_levels = len(path) + 2
    if current_child is not None:
        branch_levels += _tree_max_depth(current_child)
    if max(_tree_max_depth(tree.root), branch_levels) > 5:
        return _tree_api_response(tree.root, 'Tree is full (maximum 15 nodes and 5 levels).', status=400)

    if side == 'left':
        tree.insert_left(parent, value)
    else:
        tree.insert_right(parent, value)
    session['binary_tree'] = _tree_to_session(tree.root)
    message = f'Inserted {value} to the {side} of the selected node.'
    if current_child is not None:
        message += f' The new node is between the selected node and its old child; the old child moves under the new node on the same side.'
    return _tree_api_response(tree.root, message)


@app.route('/api/tree/traverse', methods=['POST'])
def binary_tree_traverse():
    tree = _tree_from_session()
    payload, error = _tree_payload()
    if error:
        return _tree_api_response(tree.root, error, status=400)
    traversal_type = payload.get('type')
    method_names = {
        'preorder': 'preorder_traversal',
        'inorder': 'inorder_traversal',
        'postorder': 'postorder_traversal',
    }
    if not isinstance(traversal_type, str) or traversal_type not in method_names:
        return _tree_api_response(tree.root, 'Choose preorder, inorder, or postorder traversal.', status=400)

    method = getattr(tree, method_names[traversal_type])
    method_result = method(tree.root, '')
    visits = {
        'preorder': _tree_preorder_nodes(tree.root),
        'inorder': [],
        'postorder': [],
    }

    def collect_order(node, path, order):
        if node is None:
            return
        if traversal_type == 'inorder':
            collect_order(node.left, path + 'l', order)
            order.append((path, node))
            collect_order(node.right, path + 'r', order)
        elif traversal_type == 'postorder':
            collect_order(node.left, path + 'l', order)
            collect_order(node.right, path + 'r', order)
            order.append((path, node))

    if traversal_type != 'preorder':
        collect_order(tree.root, '', visits[traversal_type])
    ordered_nodes = visits[traversal_type]
    steps = [
        {'highlight': [path], 'message': f'Visit {node.data}'}
        for path, node in ordered_nodes
    ]
    result = ' '.join(str(node.data) for _, node in ordered_nodes)
    if method_result.rstrip() != result:
        return _tree_api_response(tree.root, 'Traversal result did not match the recorded visits.', status=500)
    return _tree_api_response(tree.root, result, steps)


@app.route('/api/tree/search', methods=['POST'])
def binary_tree_search():
    tree = _tree_from_session()
    payload, error = _tree_payload()
    if error:
        return _tree_api_response(tree.root, error, status=400)
    value, error = _tree_value(payload.get('value'))
    if error:
        return _tree_api_response(tree.root, error, status=400)
    target = tree.search(tree.root, value)
    steps = []
    for path, node in _tree_preorder_nodes(tree.root):
        steps.append({'highlight': [path], 'message': f'Visit {node.data}'})
        if node is target:
            steps[-1]['message'] = f'Found {value}'
            break
    message = f'Found {value}' if target is not None else f'{value} was not found'
    return _tree_api_response(tree.root, message, steps)


@app.route('/api/tree/delete', methods=['POST'])
def binary_tree_delete():
    tree = _tree_from_session()
    payload, error = _tree_payload()
    if error:
        return _tree_api_response(tree.root, error, status=400)
    value, error = _tree_value(payload.get('value'))
    if error:
        return _tree_api_response(tree.root, error, status=400)

    target = tree.search(tree.root, value)
    if target is None:
        return _tree_api_response(tree.root, f'{value} was not found')
    paths = _tree_paths(tree.root)
    target_path = next(path for path, node in paths.items() if node is target)
    queue = [(tree.root, '')]
    deepest_path = ''
    while queue:
        node, path = queue.pop(0)
        deepest_path = path
        if node.left is not None:
            queue.append((node.left, path + 'l'))
        if node.right is not None:
            queue.append((node.right, path + 'r'))
    deepest_node = paths[deepest_path]
    steps = [
        {'highlight': [target_path], 'message': f'Delete {target.data}'},
        {'highlight': [deepest_path], 'message': f'The deepest rightmost node is {deepest_node.data}'},
    ]
    replacement = deepest_node.data
    tree.root = tree.delete_node(tree.root, value)
    session['binary_tree'] = _tree_to_session(tree.root)
    message = (
        f'Removed {value}.'
        if target_path == deepest_path
        else f'Replaced {value} with {replacement} and removed the deepest rightmost node.'
    )
    steps.append({
        'highlight': [],
        'message': message,
        'tree': _tree_layout(tree.root),
    })
    return _tree_api_response(tree.root, message, steps)


@app.route('/api/tree/reset', methods=['POST'])
def binary_tree_reset():
    session['binary_tree'] = None
    return _tree_api_response(None, 'Tree reset.')


@app.route('/sorting')
def sorting_visualizer():
    return render_template('sorting_visualizer.html')


@app.route('/diagram-values')
def sorting_diagram_values():
    return jsonify([115, 42, 15, 88, 75, 23, 93, 30, 10, 55, 100, 70])


def _parse_sort_values(raw_values):
    if isinstance(raw_values, str):
        pieces = [piece for piece in re.split(r'[,;\s]+', raw_values) if piece]
    elif isinstance(raw_values, list):
        pieces = [str(value) for value in raw_values]
    elif raw_values is None:
        pieces = []
    else:
        return None, 'Values must be a comma-separated string or a list.'

    if not pieces:
        return None, 'Enter some numbers first, like 5, 3, 8.'

    values = []
    for piece in pieces:
        if '.' in piece:
            if re.search(r'[0-9]\.[0-9]', piece):
                return None, f'“{piece}” has a decimal. Use whole numbers only.'
            return None, f'“{piece}” has a period. Use commas to separate numbers, like 5, 3, 8.'
        if piece.startswith('-'):
            return None, f'“{piece}” is negative. Use numbers from 1 to 999.'
        if not re.fullmatch(r'[0-9]+', piece):
            return None, f'“{piece}” isn\'t a number. Use digits only, like 5, 3, 8.'
        normalized = piece.lstrip('0') or '0'
        values.append(int(normalized) if len(normalized) <= 3 else 1000)

    if len(values) < 2:
        return None, 'Enter at least 2 numbers.'
    if len(values) > 12:
        return None, 'Use up to 12 numbers.'
    if any(value < 1 or value > 999 for value in values):
        return None, 'Numbers must be between 1 and 999.'
    return values, None


@app.route('/sort/<algorithm_type>', methods=['POST'])
def sorting_steps(algorithm_type):
    allowed_algorithms = {
        'bubble_sort',
        'insertion_sort',
        'selection_sort',
        'quick_sort',
        'merge_sort',
    }
    if algorithm_type not in allowed_algorithms:
        return jsonify(error='Invalid algorithm type'), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error='Request body must be a JSON object.'), 400

    values, error = _parse_sort_values(payload.get('values'))
    if error:
        return jsonify(error=error), 400

    sorter = SortingAlgorithms()
    steps = getattr(sorter, algorithm_type)(values)
    return jsonify(steps=steps)


def _session_stack():
    result = Stack()
    for value in reversed(session.get('stack_items', [])):
        result.push(value)
    return result


def _save_session_stack(current_stack):
    session['stack_items'] = current_stack.to_list()


@app.route('/api/state')
def stack_state():
    return jsonify(stack=_session_stack().to_list())


@app.route('/api/push', methods=['POST'])
def stack_push():
    current_stack = _session_stack()
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('value'), str):
        return jsonify(error='Please provide a string value.', stack=current_stack.to_list()), 400

    value = payload['value']
    if not value.strip():
        return jsonify(error='Please enter a value before pushing.', stack=current_stack.to_list()), 400

    current_stack.push(value)
    _save_session_stack(current_stack)
    return jsonify(stack=current_stack.to_list())


@app.route('/api/pop', methods=['POST'])
def stack_pop():
    current_stack = _session_stack()
    popped = current_stack.pop()
    _save_session_stack(current_stack)
    return jsonify(popped=popped, stack=current_stack.to_list())


@app.route('/api/peek')
def stack_peek():
    return jsonify(peek=_session_stack().peek())


@app.route('/api/reset', methods=['POST'])
def stack_reset():
    session['stack_items'] = []
    return jsonify(stack=[])


def _session_queue():
    result = Queue()
    for value in session.get('queue_items', []):
        result.enqueue(value)
    return result


def _save_session_queue(current_queue):
    session['queue_items'] = current_queue.to_list()


@app.route('/api/queue/state')
def queue_state():
    return jsonify(queue=_session_queue().to_list())


@app.route('/api/queue/enqueue', methods=['POST'])
def queue_enqueue():
    current_queue = _session_queue()
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('value'), str):
        return jsonify(error='Please provide a string value.', queue=current_queue.to_list()), 400

    value = payload['value'].strip()
    if not value:
        return jsonify(error='Please enter a value before enqueueing.', queue=current_queue.to_list()), 400
    if len(value) > 12:
        return jsonify(error='Please use a value no longer than 12 characters.', queue=current_queue.to_list()), 400
    if current_queue.size() >= 10:
        return jsonify(error='The queue is full (10 items maximum). Dequeue an item before enqueueing again.', queue=current_queue.to_list()), 400

    current_queue.enqueue(value)
    _save_session_queue(current_queue)
    return jsonify(queue=current_queue.to_list())


@app.route('/api/queue/dequeue', methods=['POST'])
def queue_dequeue():
    current_queue = _session_queue()
    dequeued = current_queue.dequeue()
    _save_session_queue(current_queue)
    return jsonify(dequeued=dequeued, queue=current_queue.to_list())


@app.route('/api/queue/peek')
def queue_peek():
    return jsonify(peek=_session_queue().peek())


@app.route('/api/queue/reset', methods=['POST'])
def queue_reset():
    session['queue_items'] = []
    return jsonify(queue=[])


def _infix_postfix_steps(expression):
    tokens = [character for character in expression if not character.isspace()]
    if not tokens:
        raise ValueError('Please enter an infix expression.')

    precedence = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}
    depth = 0
    expects_operand = True
    for token in tokens:
        if token.isascii() and token.isalnum() and len(token) == 1:
            if not expects_operand:
                raise ValueError('Please separate operands with an operator.')
            expects_operand = False
        elif token == '(':
            if not expects_operand:
                raise ValueError('Please add an operator before the opening parenthesis.')
            depth += 1
        elif token == ')':
            if depth == 0:
                raise ValueError('The parentheses are unbalanced.')
            if expects_operand:
                raise ValueError('Please add an operand before the closing parenthesis.')
            depth -= 1
            expects_operand = False
        elif token in precedence:
            if expects_operand:
                raise ValueError('Please add an operand before each operator.')
            expects_operand = True
        else:
            raise ValueError(f'Unsupported character: {token}')

    if depth:
        raise ValueError('The parentheses are unbalanced.')
    if expects_operand:
        raise ValueError('Please finish the expression with an operand.')

    ops = Stack()
    output = []
    steps = []

    def record(token, action, token_index=None):
        steps.append({
            'token': token,
            'token_index': token_index,
            'action': action,
            'ops': ops.to_list(),
            'output': ' '.join(output),
        })

    for token_index, token in enumerate(tokens):
        if token.isascii() and token.isalnum() and len(token) == 1:
            output.append(token)
            record(token, f"'{token}' is an operand; append it to output.", token_index)
        elif token == '(':
            ops.push(token)
            record(token, "'(' is pushed to the ops stack.", token_index)
        elif token == ')':
            while ops.peek() != '(':
                popped = ops.pop()
                output.append(popped)
                record(token, f"')' found: pop {popped} to output.", token_index)
            ops.pop()
            record(token, "')' found: discard '(' from the ops stack.", token_index)
        else:
            while ops.peek() in precedence and (
                precedence[ops.peek()] > precedence[token]
                or (
                    precedence[ops.peek()] == precedence[token]
                    and token != '^'
                )
            ):
                popped = ops.pop()
                output.append(popped)
                record(token, f"Pop {popped} to output before pushing '{token}'.", token_index)
            ops.push(token)
            record(token, f"'{token}' is pushed to the ops stack.", token_index)

    while ops.peek() is not None:
        popped = ops.pop()
        output.append(popped)
        record('END', f"Pop {popped} from ops to output.")

    return steps, ' '.join(output)


@app.route('/api/infix-postfix', methods=['POST'])
def infix_postfix():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('expression'), str):
        return jsonify(error='Please provide an infix expression.'), 400
    try:
        steps, result = _infix_postfix_steps(payload['expression'])
    except ValueError as error:
        return jsonify(error=str(error)), 400
    return jsonify(steps=steps, result=result)


@app.route('/api/convert', methods=['POST'])
def decimal_convert():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error='Please provide a decimal number and base.'), 400

    raw_number = payload.get('number')
    if isinstance(raw_number, bool) or not (
        isinstance(raw_number, int)
        or (isinstance(raw_number, str) and raw_number.isdigit())
    ):
        return jsonify(error='Enter a non-negative whole number.'), 400
    try:
        number = int(raw_number)
    except ValueError:
        return jsonify(error='Enter a valid non-negative whole number.'), 400
    if number < 0:
        return jsonify(error='Enter a non-negative whole number.'), 400

    raw_base = payload.get('base')
    if isinstance(raw_base, bool) or str(raw_base) not in {'2', '8', '16'}:
        return jsonify(error='Choose base 2, 8, or 16.'), 400
    base = int(raw_base)
    digits = '0123456789ABCDEF'
    remainder_stack = Stack()
    steps = []

    def push_remainder(remainder, dividend, quotient):
        remainder_stack.push(digits[remainder])
        steps.append({
            'phase': 'push',
            'division': f'{dividend} / {base} = {quotient}  remainder {remainder}',
            'remainder': digits[remainder],
            'stack': remainder_stack.to_list(),
            'output': '',
            'explanation': f'Push remainder {digits[remainder]}.',
        })

    remaining = number
    if remaining == 0:
        push_remainder(0, 0, 0)
    else:
        while remaining:
            quotient, remainder = divmod(remaining, base)
            push_remainder(remainder, remaining, quotient)
            remaining = quotient

    result_digits = []
    pop_sequence = []
    while remainder_stack.peek() is not None:
        digit = remainder_stack.pop()
        result_digits.append(digit)
        result_so_far = ''.join(result_digits)
        pop_step = {
            'phase': 'pop',
            'division': '',
            'popped': digit,
            'stack': remainder_stack.to_list(),
            'output': result_so_far,
            'explanation': f'Pop {digit} → result so far: {result_so_far}.',
        }
        steps.append(pop_step)
        pop_sequence.append(pop_step)

    return jsonify(
        steps=steps,
        pop_sequence=pop_sequence,
        result=''.join(result_digits),
        base=base,
    )


@app.route('/api/reverse', methods=['POST'])
def reverse_text():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('text'), str):
        return jsonify(error='Please provide text to reverse.'), 400

    text = payload['text']
    if not text.strip():
        return jsonify(error='Please enter text to reverse.'), 400
    if len(text) > 12:
        return jsonify(error='Please use 12 characters or fewer.'), 400

    character_stack = Stack()
    steps = []
    for index, character in enumerate(text):
        character_stack.push(character)
        steps.append({
            'phase': 'push',
            'character': character,
            'character_index': index,
            'stack': character_stack.to_list(),
            'output': '',
            'explanation': f"Push '{character}' onto the stack.",
        })

    reversed_characters = []
    pop_sequence = []
    while character_stack.peek() is not None:
        character = character_stack.pop()
        reversed_characters.append(character)
        output = ''.join(reversed_characters)
        pop_step = {
            'phase': 'pop',
            'character': character,
            'character_index': len(text) - len(reversed_characters),
            'stack': character_stack.to_list(),
            'output': output,
            'explanation': f"Pop '{character}' → output so far: {output}.",
        }
        steps.append(pop_step)
        pop_sequence.append(pop_step)

    return jsonify(
        steps=steps,
        pop_sequence=pop_sequence,
        result=''.join(reversed_characters),
    )


@app.route('/experiences')
def experiences():
    return render_template('experiences.html', experiences=EXPERIENCES)


@app.route('/works/uppercase', methods=['GET', 'POST'])
def uppercase_work():
    result = None
    if request.method == 'POST':
        input_string = request.form.get('inputString', '')
        result = input_string.upper()
    return render_template('touppercase.html', result=result)


@app.route('/works/linked-list', methods=['GET', 'POST'])
def linked_list():
    linked = LinkedList()
    items = session.get('linked_list_items', ['10', '20', '30'])
    for value in items:
        linked.add_tail(value)

    message = None
    if request.method == 'POST':
        operation = request.form.get('operation', '')
        value = request.form.get('value', '').strip()
        value_operations = {'add_head', 'add_tail', 'search', 'remove_value'}

        if operation not in {
            'add_head', 'add_tail', 'remove_head', 'remove_tail', 'search',
            'remove_value',
        }:
            message = 'Please choose a valid linked-list operation.'
        elif operation in value_operations and value == '':
            message = 'Please enter a value before performing this operation.'
        elif operation == 'add_head':
            linked.add_head(value)
            message = f'Added {value} at the head of the linked list.'
        elif operation == 'add_tail':
            linked.add_tail(value)
            message = f'Added {value} at the tail of the linked list.'
        elif operation == 'remove_head':
            removed = linked.remove_head()
            message = (
                f'Removed head value {removed}.'
                if removed is not None
                else 'Cannot remove the head: the linked list is empty.'
            )
        elif operation == 'remove_tail':
            removed = linked.remove_tail()
            message = (
                f'Removed tail value {removed}.'
                if removed is not None
                else 'Cannot remove the tail: the linked list is empty.'
            )
        elif operation == 'search':
            position = linked.search(value)
            message = (
                f'Found {value} at position {position}.'
                if position is not None
                else f'{value} was not found in the linked list.'
            )
        elif operation == 'remove_value':
            if linked.remove_value(value):
                message = f'Removed {value} from the linked list.'
            else:
                message = f'{value} was not found in the linked list.'

    session['linked_list_items'] = linked.to_list()
    return render_template('linkedlist.html', items=linked.to_list(), message=message)


@app.route('/works/area/circle', methods=['GET', 'POST'])
def acircle():
    result = None
    error = None
    radius = ''
    if request.method == 'POST':
        radius = request.form.get('radius', '').strip()
        try:
            radius_value = float(radius)
            if not math.isfinite(radius_value) or radius_value <= 0:
                raise ValueError
            result = math.pi * radius_value ** 2
            if not math.isfinite(result):
                raise ValueError
        except ValueError:
            error = 'Please enter a valid radius greater than zero.'
    return render_template('circle.html', result=result, error=error, radius=radius)

@app.route('/works/area/triangle', methods=['GET', 'POST'])
def atriangle():
    result = None
    error = None
    base = ''
    height = ''
    if request.method == 'POST':
        base = request.form.get('base', '').strip()
        height = request.form.get('height', '').strip()
        try:
            base_value = float(base)
            height_value = float(height)
            if (not math.isfinite(base_value) or base_value <= 0 or
                    not math.isfinite(height_value) or height_value <= 0):
                raise ValueError
            result = base_value * height_value / 2
            if not math.isfinite(result):
                raise ValueError
        except ValueError:
            error = 'Please enter a valid base and height greater than zero.'
    return render_template(
        'triangle.html', result=result, error=error, base=base, height=height
    )

if __name__ == "__main__":
    app.run(debug=True)
