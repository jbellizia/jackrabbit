from flask import Flask, request, jsonify, redirect
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from dotenv import load_dotenv
from enum import Enum
from itsdangerous import URLSafeTimedSerializer
import os
import uuid
import sys
import requests
from werkzeug.utils import secure_filename
import psycopg2
import psycopg2.extras


load_dotenv()

app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY")


app.config['TEMPLATES_AUTO_RELOAD'] = True


UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp3', 'wav', 'ogg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://jackrabbitrecords.net", "https://www.jackrabbitrecords.net"],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

login_manager = LoginManager()
login_manager.init_app(app)

s = URLSafeTimedSerializer(app.secret_key)



ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")  
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,   # must be False for local http dev
    SESSION_COOKIE_DOMAIN=None
)

class Post:
    def __init__(self, id, title, blurb, writeup, media_type, media_href, timestamp, is_visible):
        self.id = id
        self.title = title
        self.blurb = blurb
        self.writeup = writeup
        self.media_type = media_type
        self.media_href = media_href
        self.timestamp = timestamp
        self.is_visible = is_visible
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'blurb': self.blurb,
            'writeup': self.writeup,
            'media_type': self.media_type,
            'media_href': self.media_href,
            'timestamp': self.timestamp,
            'is_visible': self.is_visible
        }

class MediaType(Enum):
    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    LINK = "link"
    NONE = "none"

class Admin(UserMixin):
    def __init__(self):
        self.id = '1'

    def get_id(self):
        return self.id

class About:
    def __init__(self, id, header, body, last_updated=None):
        self.id = id
        self.header = header
        self.body = body
        self.last_updated = last_updated

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASS"),
        dbname=os.environ.get("DB_NAME"),
        port=os.environ.get("DB_PORT", 5432),
        cursor_factory=psycopg2.extras.RealDictCursor
    )
    return conn

def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS posts (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    blurb TEXT,
                    writeup TEXT,
                    media_type TEXT NOT NULL,
                    media_href TEXT,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    is_visible BOOLEAN DEFAULT TRUE NOT NULL
                );
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS posts_timestamp_idx
                ON posts (timestamp DESC);
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS posts_visibility_idx
                ON posts (is_visible);
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS about (
                    id SERIAL PRIMARY KEY,
                    header TEXT,
                    body TEXT,
                    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            cursor.execute("SELECT COUNT(*) FROM about")
            count = cursor.fetchone()["count"]

            if count == 0:
                cursor.execute(
                    "INSERT INTO about (header, body) VALUES (%s, %s)",
                    ("", "")
                )
            conn.commit()
    return True

init_db()

def get_about():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT id, header, body, last_updated FROM about')
            row = cursor.fetchone()
    if row:
        about = About(
            row['id'],
            row['header'],
            row['body'],
            row['last_updated']
        )
        return about
    else:
        return None


def get_post_by_id(post_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT id, title, blurb, writeup, media_type, media_href, timestamp, is_visible FROM posts WHERE id = %s', (post_id,))
            row = cursor.fetchone()
    if row:
        post = Post(
            row['id'],
            row['title'],
            row['blurb'],
            row['writeup'],
            row['media_type'],
            row['media_href'],
            row['timestamp'],
            row['is_visible']
        )
        return post
    else:
        return None


def get_all_posts():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT id, title, blurb, writeup, media_type, media_href, timestamp, is_visible FROM posts ORDER BY timestamp DESC')
            posts = [Post(row['id'], row['title'], row['blurb'], row['writeup'], row['media_type'], row['media_href'], row['timestamp'], row['is_visible']) for row in cursor.fetchall()]
    return posts


@login_manager.user_loader
def load_user(user_id):
    if user_id == '1':
        return Admin()
    return None

@app.route("/api/uploads/presign", methods=["POST"])
def presign_upload():
    data = request.json

    content_type = data["content_type"]
    file_ext = data["file_ext"]  # "png", "jpg", "mp3", etc

    key = f"uploads/{uuid.uuid4().hex}.{file_ext}"

    try:
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type
            },
            ExpiresIn=300  # 5 minutes
        )
    except ClientError:
        return jsonify({"error": "Failed to generate upload URL"}), 500

    return jsonify({
        "upload_url": url,
        "public_url": f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"
    })


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data or 'password' not in data:
        return jsonify({"error": "Missing password"}), 400

    if data['password'] == os.getenv('ADMIN_PASSWORD'):
        admin = Admin()
        login_user(admin)
        return jsonify({"message": "Logged in"})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/logout', methods = ['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})

@app.route('/api/posts', methods=['GET'])
def get_posts():
    posts = get_all_posts()
    return jsonify([post.to_dict() for post in posts])

@app.route('/api/post/<int:id>', methods=['GET'])
def get_post(id):
    post = get_post_by_id(id)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(post.to_dict())

@app.route('/api/admin')
@login_required
def admin():
    return jsonify({"message": f"Hello {current_user.id}"})


@app.route("/api/check-auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify({"authenticated": True, "user_id": current_user.get_id()})
    return jsonify({"authenticated": False})

@app.route('/api/posts', methods=['POST'])
@login_required
def create_post():
    data = request.get_json()

    title = data.get('title') or None
    blurb = data.get('blurb') or None
    writeup = data.get('writeup') or None
    media_type = data.get('media_type') or None
    # Check for file uploads (image or audio)
    image_file = data.get('image') or None
    audio_file = data.get('audio') or None
    # check if user wants post visible
    is_visible = bool(data.get('is_visible', True))

    media_href = None
    saved_file_path = None
    if media_type == 'image' and image_file and allowed_file(image_file.filename):
        ext = os.path.splitext(secure_filename(image_file.filename))[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        # Upload directly to S3 and store the public URL
        try:
            media_href = upload_fileobj_to_s3(image_file, unique_filename)
        except Exception as e:
            return jsonify({"error": f"Failed to upload file to S3: {str(e)}"}), 500
    elif media_type == 'audio' and audio_file and allowed_file(audio_file.filename):
        ext = os.path.splitext(secure_filename(audio_file.filename))[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        try:
            media_href = upload_fileobj_to_s3(audio_file, unique_filename)
        except Exception as e:
            return jsonify({"error": f"Failed to upload file to S3: {str(e)}"}), 500
    else:
        # maybe user sent a video URL or external media href
        media_href = data.get('media_href')

    # validate
    if not (title and (blurb or writeup or (media_type and media_href))):
        # If we saved an uploaded file but validation failed, remove the file to avoid orphaned uploads
        try:
            if saved_file_path and os.path.exists(saved_file_path):
                os.remove(saved_file_path)
        except Exception:
            pass
        return jsonify({"error": "Missing fields"}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    '''
                    INSERT INTO posts (title, blurb, writeup, media_type, media_href, is_visible)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                    ''',
                    (title, blurb, writeup, media_type, media_href, is_visible)
                )
                new_id = cursor.fetchone()["id"]
                conn.commit()
    except Exception as e:
        # Cleanup saved file if DB insert failed
        try:
            # if we uploaded to s3, attempt to delete that object
            if media_href and media_href.startswith(f"https://{BUCKET_NAME}.s3.amazonaws.com/"):
                delete_s3_object_from_url(media_href)
        except Exception:
            pass
        return jsonify({"error": f"Failed to create post: {str(e)}"}), 500

    return jsonify({
        "id": new_id,
        "title": title,
        "blurb": blurb,
        "writeup": writeup,
        "media_type": media_type,
        "media_href": media_href,
        "is_visible": is_visible
    }), 201


@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@login_required
def update_post(post_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute('SELECT id, title, blurb, writeup, media_type, media_href, timestamp, is_visible FROM posts WHERE id = %s', (post_id,))
            row = cursor.fetchone()

            if post is None:
                return jsonify({"error": "Post not found"}), 404
            
            if row:
                post = Post(
                    row['id'],
                    row['title'],
                    row['blurb'],
                    row['writeup'],
                    row['media_type'],
                    row['media_href'],
                    row['timestamp'],
                    row['is_visible']
                )


            data = request.get_json()

            title = data.get("title", post.title)
            blurb = data.get("blurb", post.blurb)
            writeup = data.get("writeup", post.writeup)
            media_type = data.get("media_type", post.media_type)
            media_href = data.get("media_href", post.media_href)
            is_visible = bool(data.get("is_visible", post.is_visible))

            old_media_href = post.media_href

            # Delete old media ONLY if it changed
            if old_media_href and old_media_href != media_href:
                delete_s3_object_from_url(old_media_href)

            cursor.execute(
                '''
                UPDATE posts
                SET title=%s,
                    blurb=%s,
                    writeup=%s,
                    media_type=%s,
                    media_href=%s,
                    is_visible=%s
                WHERE id=%s
                ''',
                (
                    title,
                    blurb,
                    writeup,
                    media_type,
                    media_href,
                    is_visible,
                    post_id
                )
            )
            conn.commit()

    return jsonify({
        "id": post_id,
        "title": title,
        "blurb": blurb,
        "writeup": writeup,
        "media_type": media_type,
        "media_href": media_href,
        "is_visible": is_visible
    })



@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            
            cursor.execute('SELECT id, title, blurb, writeup, media_type, media_href, timestamp, is_visible FROM posts WHERE id = %s', (post_id,))
            row = cursor.fetchone()

            if not post:
                return jsonify({"error": "Post not found"}), 404
            
            if row:
                post = Post(
                    row['id'],
                    row['title'],
                    row['blurb'],
                    row['writeup'],
                    row['media_type'],
                    row['media_href'],
                    row['timestamp'],
                    row['is_visible']
                )

            

            # Remove file if exists
            if post.media_href:
                # local file stored in /uploads/
                if post.media_href.startswith('/uploads/'):
                    filename = post.media_href.split('/uploads/')[-1]
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    if os.path.exists(filepath):
                        os.remove(filepath)
                else:
                    # attempt to delete S3 object if it looks like an S3 URL or key
                    delete_s3_object_from_url(post.media_href)
            cursor.execute('DELETE FROM posts WHERE id=%s', (post_id,))
            conn.commit()

    return jsonify({"message": "Post deleted"}), 200

@app.route("/api/uploads/<filename>")
def uploaded_file(filename):
    # Redirect to S3 directly
    s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/uploads/{filename}"
    return redirect(s3_url)




# Get API key from environment variable
@app.route("/api/check-youtube-embed")
def check_youtube_embed():
    video_id = request.args.get("id")

    if not video_id:
        return jsonify({"embeddable": False, "error": "Missing video id"}), 400

    if not YOUTUBE_API_KEY:
        return jsonify({"embeddable": False, "error": "No API key"}), 500

    api_url = (
        f"https://www.googleapis.com/youtube/v3/videos"
        f"?part=status,contentDetails&id={video_id}&key={YOUTUBE_API_KEY}"
    )
    print("Fetching:", api_url, file=sys.stderr)

    try:
        response = requests.get(api_url, timeout=5)
        data = response.json()

        items = data.get("items", [])
        if not items:
            return jsonify({"embeddable": False, "error": "Video not found"}), 404

        status = items[0].get("status", {})
        content_details = items[0].get("contentDetails", {})

        embeddable = status.get("embeddable", False)
        privacy_status = status.get("privacyStatus", "")
        region_restrictions = content_details.get("regionRestriction", {})
        content_rating = content_details.get("contentRating", {})

        # Initial check
        can_embed = embeddable and privacy_status == "public"

        # Block region- or age-restricted videos
        if region_restrictions or content_rating.get("ytRating") == "ytAgeRestricted":
            can_embed = False

        # Final oEmbed verification
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        try:
            oembed_resp = requests.get(oembed_url, timeout=5)
            if oembed_resp.status_code != 200:
                can_embed = False
        except Exception as e:
            print("oEmbed check failed:", e, file=sys.stderr)
            can_embed = False

        print("Embeddable (final):", can_embed, file=sys.stderr)
        return jsonify({"embeddable": can_embed})

    except Exception as e:
        print("Error in check_youtube_embed:", str(e), file=sys.stderr)
        return jsonify({"embeddable": False, "error": str(e)}), 500

@app.route("/api/about", methods=["GET"])
def about():
    about = get_about()
    if about:
        return jsonify({
            "id": about.id,
            "header": about.header,
            "body": about.body,
            "last_updated": about.last_updated
        })
    else:
        return jsonify({
            "id": None,
            "header": "",
            "body": "",
            "last_updated": None
        }), 404

@app.route("/api/about", methods=["POST", "PUT"])
def update_about():
    data = request.get_json()
    header = data.get("header")
    body = data.get("body")

    if not header or not body:
        return jsonify({"error": "Missing header or body"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE about SET header = %s, body = %s, last_updated = CURRENT_TIMESTAMP WHERE id = 1",
                (header, body)
            )
            conn.commit()

    return jsonify({"message": "About page updated successfully"}), 200

@app.errorhandler(413)
def too_large(e):
    return "File too large!", 413

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050,debug=True)

application = app

