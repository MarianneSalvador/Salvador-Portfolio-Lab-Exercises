# Marianne Salvador - Portfolio

A Flask portfolio with a profile, contact details, work samples, and an
experiences page. The works section includes an uppercase converter, a linked
list, and circle and triangle area calculators.

## Requirements

- Python 3.10 or newer
- pip

## Run locally on Windows

From PowerShell, change to the project folder and create a virtual environment:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Open <http://127.0.0.1:5000/> in your browser. Stop the development server with
Ctrl+C.

To run the tests:

```powershell
.\.venv\Scripts\python.exe -m unittest test_linked_list.py -v
```

## Project contents

- `app.py` - Flask routes, calculator logic, linked-list operations, and the
  editable `EXPERIENCES` data list.
- `templates/` - Jinja page templates.
- `static/css/` and `static/js/` - site styling and browser interactions.
- `static/images/` - profile and experience photos.
- `test_linked_list.py` - route and behavior tests.
- `Flask_HTML.ipynb` - optional course notes; it is not needed to run the site.

Update experience titles, dates, organizations, image paths, and bullet points
in `EXPERIENCES` in `app.py`. Store image files under `static/images/` and use
their paths relative to that directory.

## Session secret

For local development, the app generates a random Flask session secret when
`FLASK_SECRET_KEY` is not set. This means signed sessions (including linked-list
state) will reset when the app restarts. For a stable secret, set
`FLASK_SECRET_KEY` in the environment before starting the app. Never commit a
real secret or `.env` file.

The built-in Flask server runs with debug mode enabled in `app.py` for local
development only. Do not expose that development server to the public internet.

