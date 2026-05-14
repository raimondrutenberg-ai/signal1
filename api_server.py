#!/usr/bin/env python3
"""SIGNAL landing backend.

Stores editable landing-page copy in SQLite and exposes a small admin API.
"""

import json
import os
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data.db"
ADMIN_PASSWORD = os.environ.get("SIGNAL_ADMIN_PASSWORD", "SGX2026")

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/<path:_path>", methods=["OPTIONS"])
def options(_path):
    return ("", 204)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
    )
    return conn


def read_config():
    conn = db()
    try:
        row = conn.execute("SELECT value FROM settings WHERE key = 'content'").fetchone()
        if not row:
            return {}
        return json.loads(row[0])
    finally:
        conn.close()


def write_config(content):
    conn = db()
    try:
        conn.execute(
            "INSERT INTO settings(key, value) VALUES('content', ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [json.dumps(content, ensure_ascii=False)],
        )
        conn.commit()
    finally:
        conn.close()


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/api/config")
def get_config():
    return jsonify({"content": read_config()})


@app.post("/api/admin/login")
def admin_login():
    data = request.get_json(silent=True) or {}
    return jsonify({"ok": data.get("password") == ADMIN_PASSWORD})


@app.post("/api/admin/config")
def save_config():
    data = request.get_json(silent=True) or {}
    if data.get("password") != ADMIN_PASSWORD:
        return jsonify({"ok": False, "error": "Неверный пароль"}), 403

    content = data.get("content")
    if not isinstance(content, dict):
        return jsonify({"ok": False, "error": "Некорректный формат данных"}), 400

    write_config(content)
    return jsonify({"ok": True, "content": content})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
