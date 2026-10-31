# DSA Portfolio

A Flask-based portfolio that presents data-structure and algorithm visualizations alongside small interactive tools. Explore stack operations, convert expressions and numbers, reverse text, and calculate circle area through a browser-based interface.

## Tools

- **Stack Visualizer** — push, pop, and peek at values in a linked-list-backed stack.
- **Infix to Postfix** — convert arithmetic expressions using operator precedence.
- **Circle Area** — calculate a circle's area from its radius using `π × radius²`.
- **Decimal to Other Number System** — convert a non-negative decimal integer to binary, octal, or hexadecimal.
- **Reverse a String** — reverse text using stack operations.
- **Sorting Algorithms** — visualize Bubble, Insertion, Selection, Quick, Merge, and Heap sort.

The Infix to Postfix, Decimal Conversion, and Reverse a String tools support **Next Step**, **Auto Play**, and **Show Result** to explore or complete their recorded steps. The Stack Visualizer presents individual stack operations and their effects.

## Credits

The sorting algorithms visualizer is adapted from [stian96/algorithm-visualizer](https://github.com/stian96/algorithm-visualizer), distributed under the MIT License. The license text is included in `licenses/stian96-algorithm-visualizer-LICENSE.txt`.

## Run locally

Create and activate a virtual environment, install the dependencies, and start the Flask app:

```text
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Or on macOS/Linux:

```sh
source .venv/bin/activate
```

Then install and run:

```text
pip install -r requirements.txt
python app.py
```

Alternatively, start the app with `flask run`. Open <http://127.0.0.1:5000/> in a browser. Stop the development server with Ctrl+C.

## Project structure

```text
.
├── app.py
├── stack.py
├── requirements.txt
├── README.md
├── test_linked_list.py
├── Flask_HTML.ipynb
├── templates/
│   ├── base.html
│   ├── circle.html
│   ├── stack.html
│   ├── stack_tools.html
│   └── other portfolio page templates
└── static/
    ├── css/
    ├── images/
    └── js/
```

## Technology

- Python and Flask for the application and routes
- HTML templates, CSS, and JavaScript for the browser interface
- A linked-list `Stack` class in `stack.py`

For local development, the app generates a session secret when `FLASK_SECRET_KEY` is not set. Set that environment variable if a stable session secret is needed. Do not commit real secrets or `.env` files. The built-in Flask server is for development, not public production deployment.
