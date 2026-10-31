import math
import os
import secrets

from flask import Flask, jsonify, render_template, request, session
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


@app.route('/sorting')
def sorting_visualizer():
    return render_template('sorting_visualizer.html')


@app.route('/diagram-values')
def sorting_diagram_values():
    return jsonify([115, 42, 15, 88, 75, 23, 93, 30, 10, 55, 100, 70, 48, 63, 37, 82])


@app.route('/sort/<algorithm_type>', methods=['POST'])
def sorting_steps(algorithm_type):
    allowed_algorithms = {
        'bubble_sort',
        'insertion_sort',
        'selection_sort',
        'quick_sort',
        'merge_sort',
        'heap_sort',
    }
    if algorithm_type not in allowed_algorithms:
        return jsonify(error='Invalid algorithm type'), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error='Request body must be a JSON object.'), 400

    values = payload.get('values')
    if not isinstance(values, list) or not 1 <= len(values) <= 50:
        return jsonify(error='Values must be a list containing 1 to 50 numbers.'), 400
    if any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or (isinstance(value, float) and not math.isfinite(value))
        for value in values
    ):
        return jsonify(error='Each value must be a finite number (integer or float).'), 400

    sorter = SortingAlgorithms()
    steps = getattr(sorter, algorithm_type)(list(values))
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
