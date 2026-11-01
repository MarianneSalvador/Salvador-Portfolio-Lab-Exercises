# Adapted from stian96/algorithm-visualizer (MIT License), https://github.com/stian96/algorithm-visualizer


class SortingAlgorithms:
    """
    Class containing different sorting algorithms:
    1. Selection sort
    2. Insertion sort
    3. Quick sort
    4. Bubble sort
    5. Merge sort
    """

    def __init__(self):
        pass

    def selection_sort(self, array):
        """
        Sorts the array in ascending order using the selection sort algorithms.
        This algorithms has a time complexity of O(n^2), where n is the length of the list.
        """
        steps = [array.copy()]
        n = len(array)

        # Iterate over all elements.
        for i in range(n):

            # Find min index in unsorted list.
            min_index = i

            # If there is a smaller element, set
            # min index equal to this.
            for j in range(i + 1, n):
                if array[j] < array[min_index]:
                    min_index = j

            # Swap elements.
            array[i], array[min_index] = array[min_index], array[i]
            steps.append(array.copy())

        return steps

    def insertion_sort(self, array):
        """
        Sorts the array in ascending order using the insertion sort algorithms.
        This algorithms has a time complexity of O(n^2), where n is the length of the list.
        Returns: list: The steps of the sorted array
        """
        steps = []
        n = len(array)

        # Iterate through array, starting from the
        # second element.
        for i in range(1, n):
            # Hold on first and second element.
            second = array[i]
            first = i - 1

            # If second element is less than first,
            # switch places of the elements.
            while first >= 0 and second < array[first]:
                array[first + 1] = array[first]
                first -= 1
            array[first + 1] = second

            # Append a copy of the current state of the array to the steps.
            steps.append(array.copy())

        return steps

    def quick_sort(self, array):
        """
        Sorts the array in ascending order using the quicksort algorithm.
        This algorithm has a time complexity of O(n log n), where n is the length of the list.
        :return: A list of steps, each step containing a copy of the array in its current state
        """
        steps = []
        self._quicksort(array, 0, len(array) - 1, steps)
        return steps

    def _quicksort(self, array, low, high, steps):
        """
        Internal recursive function executing the quicksort algorithm and saving steps.
        :param array: The array to be sorted.
        :param low: The index of the lower bound of the current partition.
        :param high: The index of the upper bound of the current partition.
        :param steps: A list to store the steps of the sorting process.
        """
        if low < high:
            partition_index = self._partition(array, low, high, steps)
            self._quicksort(array, low, partition_index - 1, steps)
            self._quicksort(array, partition_index + 1, high, steps)

    def _partition(self, array, low, high, steps):
        """
        Partitioning step of the quicksort algorithm.
        :param array: The array to be sorted.
        :param low: The index of the lower bound of the current partition.
        :param high: The index of the upper bound of the current partition.
        :param steps: A list to store the steps of the sorting process.
        :return: The final index of the pivot element after partitioning.
        """
        pivot = array[high]
        i = low - 1

        for j in range(low, high):
            if array[j] <= pivot:
                i += 1
                array[i], array[j] = array[j], array[i]

        array[i + 1], array[high] = array[high], array[i + 1]
        steps.append(array.copy())  
        return i + 1

    def bubble_sort(self, array):
        """
        Sorts the array in ascending order using the bubble sort algorithms.
        This algorithms has a time complexity of O(n^2), where n is the length of the list.
        """
        steps = [array.copy()]
        n = len(array)

        # Iterate over all elements
        for i in range(n):

            # Perform (n - i - 1) comparisons and swaps.
            for j in range(n - i - 1):

                # If the current element is greater than the next, swap them.
                if array[j] > array[j + 1]:
                    array[j], array[j + 1] = array[j + 1], array[j]
                    steps.append(array.copy())

        return steps

    def merge_sort(self, array):
        """
        Sorts the array in ascending order using the merge sort algorithm.
        This algorithm has a time complexity of O(n log n), where n is the length of the list.
        """
        steps = [array.copy()]
        array = self._merge_sort(array, steps, array.copy())
        return steps

    def _merge_sort(self, array, steps, original_array, start_index=0):
        """
        Internal recursive function executing the merge sort algorithm.
        :param array: The array to be sorted.
        :return: The sorted array.
        """
        n = len(array)

        # Base case: If array contains 0 or 1 element it is already sorted.
        if n <= 1:
            return array

        # Split the array in half
        mid = n // 2
        left = array[:mid]
        right = array[mid:]

        # Recursively sort each half
        left = self._merge_sort(left, steps, original_array, start_index)
        right = self._merge_sort(right, steps, original_array, start_index + mid)

        # Merge the sorted halves into the original array.
        self._merge(left, right, original_array, start_index)
        steps.append(original_array.copy())
        return original_array[start_index : start_index + n]

    def _merge(self, left, right, original_array, left_start):
        """
        Helper function to merge two sorted arrays into the original array, starting from left_start.
        :param left: Sorted array.
        :param right: Sorted array.
        :param original_array: The array to place the merged elements into.
        :param left_start: The starting index in the original array to place the merged elements.
        :return: Updated original_array with the merged elements.
        """
        i = j = 0
        k = left_start

        # Compare elements and insert the smallest into the result.
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                original_array[k] = left[i]
                i += 1
            else:
                original_array[k] = right[j]
                j += 1
            k += 1

        # If there are any elements left in either array, place them into the original array.
        while i < len(left):
            original_array[k] = left[i]
            i += 1
            k += 1

        while j < len(right):
            original_array[k] = right[j]
            j += 1
            k += 1

        return original_array
