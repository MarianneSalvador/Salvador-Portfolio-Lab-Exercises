from collections import deque


class Node:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None


class BinaryTree:
    def __init__(self):
        self.root = None

    def insert_left(self, parent, data):
        new_node = Node(data)
        if parent.left is None:
            parent.left = new_node
        else:
            new_node.left = parent.left
            parent.left = new_node
        return new_node

    def insert_right(self, parent, data):
        new_node = Node(data)
        if parent.right is None:
            parent.right = new_node
        else:
            new_node.right = parent.right
            parent.right = new_node
        return new_node

    def preorder_traversal(self, start, traversal):
        if start:
            traversal += str(start.data) + " "
            traversal = self.preorder_traversal(start.left, traversal)
            traversal = self.preorder_traversal(start.right, traversal)
        return traversal

    def inorder_traversal(self, start, traversal):
        if start:
            traversal = self.inorder_traversal(start.left, traversal)
            traversal += str(start.data) + " "
            traversal = self.inorder_traversal(start.right, traversal)
        return traversal

    def postorder_traversal(self, start, traversal):
        if start:
            traversal = self.postorder_traversal(start.left, traversal)
            traversal = self.postorder_traversal(start.right, traversal)
            traversal += str(start.data) + " "
        return traversal

    def search(self, root, key):
        if root is None:
            return None
        if root.data == key:
            return root
        found = self.search(root.left, key)
        if found is not None:
            return found
        return self.search(root.right, key)

    def delete_node(self, root, key):
        if root is None:
            return None

        target = self.search(root, key)
        if target is None:
            return root

        queue = deque([(root, None, None)])
        deepest = None
        deepest_parent = None
        deepest_side = None

        while queue:
            node, parent, side = queue.popleft()
            deepest = node
            deepest_parent = parent
            deepest_side = side
            if node.left is not None:
                queue.append((node.left, node, "left"))
            if node.right is not None:
                queue.append((node.right, node, "right"))

        if deepest is target:
            if deepest_parent is None:
                return None
            setattr(deepest_parent, deepest_side, None)
            return root

        target.data = deepest.data
        if deepest_parent is None:
            return None
        setattr(deepest_parent, deepest_side, None)
        return root


if __name__ == "__main__":
    tree = BinaryTree()
    tree.root = Node("R")
    node_a = tree.insert_left(tree.root, "A")
    node_b = tree.insert_right(tree.root, "B")
    tree.insert_left(node_a, "C")
    tree.insert_right(node_a, "D")
    tree.insert_left(node_b, "E")
    node_f = tree.insert_right(node_b, "F")
    tree.insert_left(node_f, "G")
