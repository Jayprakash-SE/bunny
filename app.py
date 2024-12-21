#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, send_from_directory, session, jsonify, render_template, redirect
from flask_mwoauth import MWOAuth
from flask_migrate import Migrate
from flask_cors import CORS
import requests_oauthlib
import requests
import os
import yaml
from model import db, User, Project
from utils import getHeader


app = Flask(__name__)

# Load configuration from YAML file
__dir__ = os.path.dirname(__file__)
app.config.update(yaml.safe_load(open(os.path.join(__dir__, 'config.yaml'))))

# Get variables
ENV = app.config['ENV']
BASE_URL = app.config['OAUTH_MWURI']
API_ENDPOINT = BASE_URL + '/api.php'
CONSUMER_KEY = app.config['CONSUMER_KEY']
CONSUMER_SECRET = app.config['CONSUMER_SECRET']

# Enable CORS and Debugging in Dev mode
if ENV == 'dev':
    app.config['DEBUG'] = True

CORS(app, supports_credentials=True)

# Create Database and Migration Object
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprint to app
MW_OAUTH = MWOAuth(
    base_url=BASE_URL,
    consumer_key=CONSUMER_KEY,
    consumer_secret=CONSUMER_SECRET,
    user_agent= getHeader()['User-Agent']
)
app.register_blueprint(MW_OAUTH.bp)


@app.before_request
def handle_catch_all():
    excluded_routes = [ '/assets', '/api/', '/login', '/logout', '/oauth-callback']

    # Check if the request path starts with any excluded route
    # And then let Flask handle these routes normally
    if any(request.path.startswith(route) for route in excluded_routes):
        return None

    # Redirect for development environment
    if app.config['ENV'] == 'dev':
        return redirect(f"http://localhost:5173")

    # Serve index.html for all unmatched routes in production
    return render_template('index.html')


@app.after_request
def add_user_to_db(response):
    if request.endpoint == "mwoauth.oauth_authorized":
        username = MW_OAUTH.get_current_user(True)

        if username:
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User( username=username)
                db.session.add(user)
                db.session.commit()

    return response


@app.route('/', methods=['GET'])
def index():
    return "Bunny backend is running"


@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory('static/assets', path)


@app.route('/api/project', methods=['GET'])
def list_projects():
    user = db_user()
    if not user:
        return jsonify({"error": "User must be logged in"}), 401

    projects = Project.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": project.id,
        "title": project.title,
        "video_url": project.video_url,
        "language": project.language,
        "created_at": project.created_at
    } for project in projects]), 200


@app.route('/api/project', methods=['POST'])
def create_project():
    user = db_user()
    if not user:
        return jsonify({"error": "User must be logged in"}), 401

    data = request.json
    if not data or 'title' not in data or 'commons_url' not in data or 'language' not in data:
        return jsonify({"error": "Title, commons_url, and language are required"}), 400


    project = Project(
        title=data['title'],
        video_url=data['commons_url'],
        language=data['language'],
        user_id=user.id
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({"message": "Project created", "project_id": project.id}), 201


@app.route('/api/project/<int:project_id>', methods=['PUT'])
def edit_project(project_id):
    user = db_user()
    if not user:
        return jsonify({"error": "User must be logged in"}), 401

    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found or not owned by user"}), 404

    data = request.json
    if 'title' in data:
        project.title = data['title']
    if 'video_url' in data:
        project.video_url = data['video_url']
    if 'language' in data:
        project.language = data['language']

    db.session.commit()
    return jsonify({"message": "Project updated"}), 200


@app.route('/api/project/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    user = db_user()
    if not user:
        return jsonify({"error": "User must be logged in"}), 401

    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found or not owned by user"}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200


@app.route('/api/user-language', methods=['GET'])
def get_user_preference():
    user = db_user()

    # Default to "en" if the language is not set
    language = user.language if user else "en"

    return jsonify({
        "language": language
    }), 200


@app.route('/api/user-language', methods=['PUT'])
def update_user_preference():
    user = db_user()
    if not user:
        return jsonify({"error": "User must be logged in"}), 401

    data = request.json
    if not data or 'language' not in data:
        return jsonify({"error": "Language is required"}), 400

    user.language = data['language']
    db.session.commit()

    return jsonify({"message": "Language preference updated", "language": user.language}), 200


@app.route('/api/user', methods=['GET'])
def get_user_info():
    return jsonify({
        "logged": logged() is not None,
        "username": MW_OAUTH.get_current_user(True)
    }), 200


def authenticated_session():
    if 'mwoauth_access_token' in session:
        auth = requests_oauthlib.OAuth1(
            client_key=CONSUMER_KEY,
            client_secret=CONSUMER_SECRET,
            resource_owner_key=session['mwoauth_access_token']['key'],
            resource_owner_secret=session['mwoauth_access_token']['secret']
        )
        return auth

    return None


def db_user():
    if logged():
        user = User.query.filter_by(username=MW_OAUTH.get_current_user(True)).first()
        return user
    else:
        return None


def logged():
    if MW_OAUTH.get_current_user(True) is not None:
        return MW_OAUTH.get_current_user(True)
    else:
        return None


if __name__ == "__main__":
    app.run(port=5001)