class Node:
    def __init__(self, data):
        self.data = data
        self.next = None


class Queue:
    def __init__(self):
        self.front = None
        self.rear = None

    def enqueue(self, data):
        new_node = Node(data)
        if self.is_empty():
            self.front = new_node
            self.rear = new_node
        else:
            self.rear.next = new_node
            self.rear = new_node

    def dequeue(self):
        if self.is_empty():
            return None

        removed_node = self.front
        self.front = self.front.next
        removed_node.next = None
        if self.front is None:
            self.rear = None
        return removed_node.data

    def peek(self):
        return None if self.is_empty() else self.front.data

    def is_empty(self):
        return self.front is None

    def size(self):
        count = 0
        current = self.front
        while current is not None:
            count += 1
            current = current.next
        return count

    def to_list(self):
        items = []
        current = self.front
        while current is not None:
            items.append(current.data)
            current = current.next
        return items
