import unittest

from app import app


class LinkedListRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_all_pages_include_shared_navigation(self):
        paths = (
            '/',
            '/profile',
            '/contact',
            '/works',
            '/experiences',
            '/works/uppercase',
            '/works/linked-list',
            '/works/area/circle',
            '/works/area/triangle',
        )
        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                for label in (b'Home', b'Profile', b'Works', b'Experiences', b'Contact'):
                    self.assertIn(label, response.data)

    def test_experiences_page_renders_data_images_and_navigation(self):
        response = self.client.get('/experiences')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'04 / Experiences', response.data)
        self.assertEqual(response.data.count(b'class="experience-card work-card"'), 5)
        self.assertEqual(response.data.count(b'loading="lazy"'), 5)
        self.assertEqual(response.data.count(b'class="experience-tag">Host</span>'), 5)
        titles = (
            b'Computer Engineering Department Intramurals (CPE Trials)',
            b'CPE Hard Hatting Ceremony',
            b'ACCESS - Junior Access Officer (JAO) Seminar Series',
            b'ACCESS - Freshman Orientation of the Computer Engineering Department',
            b'Cisco NetConnect PUP-Manila General Onboarding',
        )
        title_positions = [response.data.index(title) for title in titles]
        self.assertEqual(title_positions, sorted(title_positions))
        self.assertEqual(response.data.count(b'class="experience-tag">ACCESS</span>'), 2)
        self.assertIn(b'aria-current="page">Experiences</a>', response.data)
        self.assertIn(b'Go to previous page: Works', response.data)
        self.assertIn(b'Go to next page: Contact', response.data)
        for image in (
            '/static/images/experiences/cpe%20trials.jpg',
            '/static/images/experiences/hardhatting.jpg',
            '/static/images/experiences/seminar%20series%20pic.jpg',
            '/static/images/experiences/fo.jpg',
            '/static/images/experiences/cisco.jpg',
        ):
            image_response = self.client.get(image)
            self.assertEqual(image_response.status_code, 200)
            self.assertEqual(image_response.mimetype, 'image/jpeg')
            image_response.close()

    def test_primary_page_navigation_follows_updated_order(self):
        cases = (
            ('/works', b'Go to next page: Experiences', b'/experiences'),
            ('/contact', b'Go to previous page: Experiences', b'/experiences'),
        )
        for path, label, destination in cases:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertIn(b'aria-label="' + label + b'"', response.data)
                self.assertIn(b'href="' + destination + b'"', response.data)

    def test_linked_list_page_exists(self):
        response = self.client.get('/works/linked-list')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Linked List', response.data)
        for label in (
            b'Add head',
            b'Add tail',
            b'Remove head',
            b'Remove tail',
            b'Search value',
            b'Remove value',
        ):
            self.assertIn(label, response.data)

    def test_homepage_links_to_linked_list(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'/works/linked-list', response.data)

    def test_linked_list_operations_persist_for_the_session(self):
        response = self.client.post(
            '/works/linked-list', data={'operation': 'add_tail', 'value': '40'}
        )
        self.assertIn(b'[10]', response.data)
        self.assertIn(b'[20]', response.data)
        self.assertIn(b'[30]', response.data)
        self.assertIn(b'[40]', response.data)

        response = self.client.post(
            '/works/linked-list', data={'operation': 'add_head', 'value': '5'}
        )
        self.assertIn(b'[5]', response.data)
        self.assertIn(b'[40]', response.data)

        response = self.client.post(
            '/works/linked-list', data={'operation': 'search', 'value': '20'}
        )
        self.assertIn(b'Found 20 at position 3.', response.data)
        self.assertIn(b'[20]', response.data)

        response = self.client.post(
            '/works/linked-list', data={'operation': 'remove_head'}
        )
        self.assertIn(b'Removed head value 5.', response.data)
        self.assertNotIn(b'[5]', response.data)

        response = self.client.post(
            '/works/linked-list', data={'operation': 'remove_tail'}
        )
        self.assertIn(b'Removed tail value 40.', response.data)
        self.assertNotIn(b'[40]', response.data)

        response = self.client.post(
            '/works/linked-list', data={'operation': 'remove_value', 'value': '20'}
        )
        self.assertNotIn(b'[5]', response.data)
        self.assertNotIn(b'[20]', response.data)
        self.assertIn(b'[30]', response.data)

    def test_linked_list_session_is_isolated_between_clients(self):
        self.client.post(
            '/works/linked-list', data={'operation': 'add_tail', 'value': '40'}
        )
        other_client_response = app.test_client().get('/works/linked-list')
        self.assertIn(b'[10]', other_client_response.data)
        self.assertIn(b'[20]', other_client_response.data)
        self.assertIn(b'[30]', other_client_response.data)
        self.assertNotIn(b'[40]', other_client_response.data)

    def test_linked_list_can_remove_a_matching_value(self):
        response = self.client.post(
            '/works/linked-list', data={'operation': 'remove_value', 'value': '10'}
        )
        self.assertNotIn(b'[10]', response.data)
        self.assertIn(b'[20]', response.data)
        self.assertIn(b'[30]', response.data)

    def test_linked_list_handles_missing_values_and_empty_ends(self):
        not_found = self.client.post(
            '/works/linked-list', data={'operation': 'search', 'value': '99'}
        )
        self.assertIn(b'99 was not found in the linked list.', not_found.data)

        empty_list_client = app.test_client()
        for _ in range(3):
            empty_list_client.post(
                '/works/linked-list',
                data={'operation': 'remove_head'},
            )
        empty_head = empty_list_client.post(
            '/works/linked-list', data={'operation': 'remove_head'}
        )
        empty_tail = empty_list_client.post(
            '/works/linked-list', data={'operation': 'remove_tail'}
        )
        self.assertIn(
            b'Cannot remove the head: the linked list is empty.', empty_head.data
        )
        self.assertIn(
            b'Cannot remove the tail: the linked list is empty.', empty_tail.data
        )

    def test_linked_list_rejects_missing_required_values(self):
        for operation in ('add_head', 'add_tail', 'search', 'remove_value'):
            with self.subTest(operation=operation):
                response = self.client.post(
                    '/works/linked-list',
                    data={'operation': operation, 'value': ''},
                )
                self.assertIn(
                    b'Please enter a value before performing this operation.',
                    response.data,
                )

    def test_circle_area_calculation(self):
        response = self.client.post('/works/area/circle', data={'radius': '5'})
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'78.54', response.data)

    def test_triangle_area_calculation(self):
        response = self.client.post(
            '/works/area/triangle', data={'base': '10', 'height': '4'}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'20.00', response.data)

    def test_area_calculators_reject_invalid_values(self):
        circle = self.client.post(
            '/works/area/circle', data={'radius': '-2'}
        )
        triangle = self.client.post(
            '/works/area/triangle', data={'base': '10', 'height': 'nan'}
        )
        self.assertIn(b'Please enter a valid radius', circle.data)
        self.assertIn(b'Please enter a valid base and height', triangle.data)


if __name__ == '__main__':
    unittest.main()
