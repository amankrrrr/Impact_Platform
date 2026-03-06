from backend.app import create_app


def main() -> None:
    """
    Entry point for running the full web stack (backend API + frontend SPA)
    with a single command:

        python main.py

    The Flask app defined in backend.app is responsible for serving both
    the JSON API under /api/... and the React frontend from /.
    """

    app = create_app()
    app.run(debug=True, port=5000)


if __name__ == "__main__":
    main()
