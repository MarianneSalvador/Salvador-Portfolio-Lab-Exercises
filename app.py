import math
import os
import secrets

from flask import Flask, render_template, request, session

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
