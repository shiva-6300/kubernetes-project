from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
import datetime
import hashlib
import uuid

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

SECRET_KEY = "blog_secret_key_change_in_production"

# In-memory data store (replace with DB in production)
users = {
    "admin": {
        "id": "1",
        "username": "admin",
        "password": hashlib.sha256("admin123".encode()).hexdigest(),
        "email": "admin@blog.com"
    }
}

posts = [
    {
        "id": "1",
        "title": "Welcome to the Blog",
        "content": "This is your first blog post. Start creating amazing content!",
        "author": "admin",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
        "tags": ["welcome", "intro"]
    }
]


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users.get(data["username"])
            if not current_user:
                return jsonify({"error": "Invalid token"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(current_user, *args, **kwargs)
    return decorated


# ─── Auth Routes ───────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    email = data.get("email", "").strip()

    if not username or not password or not email:
        return jsonify({"error": "All fields are required"}), 400
    if username in users:
        return jsonify({"error": "Username already exists"}), 409

    users[username] = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password": hashlib.sha256(password.encode()).hexdigest(),
        "email": email
    }
    return jsonify({"message": "User registered successfully"}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    user = users.get(username)
    if not user or user["password"] != hashlib.sha256(password.encode()).hexdigest():
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"]
    }), 200


# ─── Blog Post Routes ──────────────────────────────────────────────────────────

@app.route("/api/posts", methods=["GET"])
def get_posts():
    return jsonify({"posts": posts, "total": len(posts)}), 200


@app.route("/api/posts/<post_id>", methods=["GET"])
def get_post(post_id):
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(post), 200


@app.route("/api/posts", methods=["POST"])
@token_required
def create_post(current_user):
    data = request.get_json()
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    tags = data.get("tags", [])

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    now = datetime.datetime.utcnow().isoformat()
    post = {
        "id": str(uuid.uuid4()),
        "title": title,
        "content": content,
        "author": current_user["username"],
        "created_at": now,
        "updated_at": now,
        "tags": tags
    }
    posts.insert(0, post)
    return jsonify(post), 201


@app.route("/api/posts/<post_id>", methods=["PUT"])
@token_required
def update_post(current_user, post_id):
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    if post["author"] != current_user["username"]:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    post["title"] = data.get("title", post["title"]).strip()
    post["content"] = data.get("content", post["content"]).strip()
    post["tags"] = data.get("tags", post["tags"])
    post["updated_at"] = datetime.datetime.utcnow().isoformat()

    return jsonify(post), 200


@app.route("/api/posts/<post_id>", methods=["DELETE"])
@token_required
def delete_post(current_user, post_id):
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    if post["author"] != current_user["username"]:
        return jsonify({"error": "Unauthorized"}), 403

    posts.remove(post)
    return jsonify({"message": "Post deleted successfully"}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
