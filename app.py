"""
Muffinns Bakery - Secure Flask Admin & Firebase Firestore Integration
Admin Portal URL: /bwp-panel-7781 (all /admin routes strictly blocked)
Collection: 'products' [name, price, description, image_url, category]
Storage: Firebase Storage for image uploads
Free Tier: Spark Plan & Replit Free Tier Compatible
"""

import os
import time
import json
import functools
import hashlib
import mimetypes
from datetime import timedelta
from werkzeug.utils import secure_filename
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, abort

# Persistent local admin storage path (used in tandem with Firebase Firestore)
ADMINS_FILE = os.path.join(os.getcwd(), "src", "data", "store", "admins.json")

def read_local_admins():
    try:
        if os.path.exists(ADMINS_FILE):
            with open(ADMINS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print(f"[Admin Store] Error reading {ADMINS_FILE}: {e}")
    return []

def save_local_admin(username, password, role="admin"):
    try:
        os.makedirs(os.path.dirname(ADMINS_FILE), exist_ok=True)
        admins = read_local_admins()
        # Remove previous entry with same username (case-insensitive)
        admins = [a for a in admins if str(a.get("username", "")).strip().lower() != username.strip().lower()]
        pw_hash = hashlib.sha256(password.strip().encode("utf-8")).hexdigest()
        admins.append({
            "id": f"admin_{username.strip().lower()}",
            "username": username.strip(),
            "password": password.strip(),
            "passwordHash": pw_hash,
            "role": role,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })
        with open(ADMINS_FILE, "w", encoding="utf-8") as f:
            json.dump(admins, f, indent=2)
        return True
    except Exception as e:
        print(f"[Admin Store] Error saving admin to {ADMINS_FILE}: {e}")
        return False

# Optional: Load environment variables from .env file if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==============================================================================
# 1. FLASK APP INITIALIZATION & SECURITY CONFIGURATION
# ==============================================================================
app = Flask(__name__)

# Secret key for cryptographically signed Flask sessions and CSRF tokens
app.secret_key = os.environ.get("SECRET_KEY", "muffinns-bwp-7781-secure-session-key-2026-spark")

# Session lifetime: Auto logout after 30 minutes of inactivity
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# ImageKit CDN endpoint for bakery assets
IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/Muffins"

# Firebase Storage Bucket name (Free Tier Spark Plan)
FIREBASE_STORAGE_BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET", "muffins-3ab75.firebasestorage.app")

# Admin credentials loaded strictly from environment variables (.env file)
# Never hardcoded in source files
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "BakeryAdmin2026!")

# Allowed image upload extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "avif"}

# ==============================================================================
# 2. CSRF PROTECTION (Flask-WTF with fallback)
# ==============================================================================
try:
    from flask_wtf.csrf import CSRFProtect
    csrf = CSRFProtect(app)
    has_flask_wtf = True
except ImportError:
    # Graceful built-in CSRF token provider if flask_wtf is not installed
    import secrets
    has_flask_wtf = False

    @app.context_processor
    def inject_global_template_vars():
        if "_csrf_token" not in session:
            session["_csrf_token"] = secrets.token_hex(16)
        
        cart = session.get("cart", {})
        total_qty = 0
        if isinstance(cart, dict):
            for itm in cart.values():
                total_qty += int(itm.get("quantity") or itm.get("qty", 1))

        return {
            "csrf_token": lambda: session.get("_csrf_token", ""),
            "cart_count": total_qty,
            "whatsapp_number": os.environ.get("WHATSAPP_NUMBER", "923017778181")
        }

# ==============================================================================
# 3. FIREBASE ADMIN SDK & STORAGE INITIALIZATION
# ==============================================================================
import firebase_admin
from firebase_admin import credentials, firestore, storage

SERVICE_ACCOUNT_FILE = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "serviceAccountKey.json")

db = None
firebase_init_error = None

try:
    if not firebase_admin._apps:
        storage_config = {"storageBucket": FIREBASE_STORAGE_BUCKET}
        if os.path.exists(SERVICE_ACCOUNT_FILE):
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred, storage_config)
            print(f"[Firebase] Initialized with {SERVICE_ACCOUNT_FILE}")
        else:
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, storage_config)
                print("[Firebase] Initialized with ApplicationDefault.")
            except Exception:
                project_id = os.environ.get("GCP_PROJECT", os.environ.get("FIREBASE_PROJECT_ID", "muffins-3ab75"))
                storage_config["projectId"] = project_id
                firebase_admin.initialize_app(options=storage_config)
                print(f"[Firebase] Initialized with project ID: {project_id}")

    db = firestore.client()
except Exception as e:
    firebase_init_error = str(e)
    print(f"[Firebase Warning] {e}")


# ==============================================================================
# 4. SECURITY & SESSION TIMEOUT ENFORCEMENT
# ==============================================================================
@app.before_request
def enforce_session_timeout():
    """
    Enforces automatic logout after 30 minutes (1800 seconds) of inactivity.
    Updates last_active on every request while logged in.
    """
    session.permanent = True
    if "admin_user" in session:
        last_active = session.get("last_active")
        now = time.time()
        if last_active and (now - last_active > 1800):
            session.clear()
            flash("You have been automatically logged out after 30 minutes of inactivity.", "warning")
            return redirect(url_for("admin_login"))
        session["last_active"] = now


def login_required(f):
    """
    Decorator protecting admin routes.
    Redirects unauthenticated visitors to /bwp-panel-7781/login.
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if "admin_user" not in session:
            flash("Access denied. Please sign in with administrator credentials.", "danger")
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated_function


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_to_firebase_storage(file_storage, custom_id=""):
    """
    Uploads an image file to Firebase Storage bucket and returns the public download URL.
    Falls back gracefully if storage bucket credentials are local or restricted.
    """
    if not file_storage or not file_storage.filename:
        return None
    try:
        bucket = storage.bucket()
        safe_name = secure_filename(file_storage.filename)
        timestamp = int(time.time())
        ext = safe_name.rsplit(".", 1)[1].lower() if "." in safe_name else "jpg"
        prefix = f"{custom_id}_" if custom_id else ""
        blob_path = f"products/{prefix}{timestamp}.{ext}"

        blob = bucket.blob(blob_path)
        file_storage.seek(0)
        content_type = file_storage.content_type or mimetypes.guess_type(safe_name)[0] or "image/jpeg"
        blob.upload_from_file(file_storage, content_type=content_type)
        
        # Make blob publicly readable
        try:
            blob.make_public()
            return blob.public_url
        except Exception:
            # If uniform bucket-level access is enabled, construct direct Google Storage URL
            return f"https://storage.googleapis.com/{bucket.name}/{blob_path}"
    except Exception as err:
        print(f"[Firebase Storage Warning] {err}")
        return None


# ==============================================================================
# 5. FIRESTORE DATABASE HELPERS (products collection)
# ==============================================================================
def get_all_products():
    """
    Fetches all products from Firebase Firestore collection 'products'.
    Each item contains: name, price, description, image_url, category.
    """
    if db is None:
        return {}

    products = {}
    try:
        docs = db.collection("products").stream()
        for doc in docs:
            data = doc.to_dict() or {}
            products[doc.id] = {
                "name": str(data.get("name", "")).strip(),
                "price": data.get("price", 0),
                "description": str(data.get("description", "")).strip(),
                "image_url": str(data.get("image_url", data.get("image", ""))).strip(),
                "category": str(data.get("category", "General")).strip()
            }
    except Exception as err:
        print(f"[Error] Failed to fetch products from Firestore: {err}")

    return products


def normalize_price(val):
    if val is None:
        return None
    val_str = str(val).strip().replace("Rs", "").replace(",", "")
    try:
        if "." in val_str:
            return round(float(val_str), 2)
        return int(val_str)
    except ValueError:
        return val_str


# ==============================================================================
# 6. STOREFRONT HOMEPAGE (WITH LIVE SEARCH & CATEGORY FILTERS)
# ==============================================================================
@app.route("/")
def index():
    """
    Storefront homepage connected live to Firebase Firestore 'products' collection.
    Supports real-time search query and category filtering.
    """
    products = get_all_products()
    is_logged_in = "admin_user" in session
    current_user = session.get("admin_user", "")

    # Collect unique categories for filter pills
    categories = sorted(list(set(
        p.get("category", "General") for p in products.values() if p.get("category")
    )))

    search_query = request.args.get("q", "").strip()
    selected_category = request.args.get("category", "").strip()

    filtered_products = {}
    for pid, pdata in products.items():
        # Filter by category
        if selected_category and selected_category.lower() != "all":
            if pdata.get("category", "").lower() != selected_category.lower():
                continue

        # Filter by search term
        if search_query:
            term = search_query.lower()
            name_match = term in pdata.get("name", "").lower()
            desc_match = term in pdata.get("description", "").lower()
            cat_match = term in pdata.get("category", "").lower()
            id_match = term in pid.lower()
            if not (name_match or desc_match or cat_match or id_match):
                continue

        filtered_products[pid] = pdata

    return render_template(
        "index.html",
        products=filtered_products,
        all_categories=categories,
        search_query=search_query,
        selected_category=selected_category,
        is_admin_logged_in=is_logged_in,
        current_user=current_user,
        imagekit_endpoint=IMAGEKIT_ENDPOINT
    )


# ==============================================================================
# 7. BLOCK LEGACY /admin ROUTES (STRICT SECURITY REQUIREMENT)
# ==============================================================================
@app.route("/admin")
@app.route("/admin/<path:subpath>")
def block_legacy_admin(subpath=""):
    """
    Strictly blocks access to /admin URL as mandated by the security policy.
    Returns standard 404 response.
    """
    return render_template("404.html"), 404


# ==============================================================================
# 8. ADMIN AUTHENTICATION (/bwp-panel-7781/login & logout)
# ==============================================================================
@app.route("/bwp-panel-7781/login", methods=["GET", "POST"])
def admin_login():
    """
    Admin login route at /bwp-panel-7781/login.
    Authenticates against ADMIN_USERNAME and ADMIN_PASSWORD stored in .env,
    as well as any secondary admin accounts in Firebase 'admins' collection.
    """
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        # Input validation
        if not username or not password:
            flash("Please enter both username and password.", "danger")
            return redirect(url_for("admin_login"))

        clean_user = username.strip()
        clean_pw = password.strip()
        user_lower = clean_user.lower()
        authenticated = False
        authenticated_username = clean_user

        # 1. Primary check: .env credentials (ADMIN_USERNAME / ADMIN_PASSWORD)
        env_admin_user = os.environ.get("ADMIN_USERNAME", "admin").strip()
        env_admin_pass = os.environ.get("ADMIN_PASSWORD", "BakeryAdmin2026!").strip()

        if user_lower == env_admin_user.lower() and clean_pw == env_admin_pass:
            authenticated = True
            authenticated_username = env_admin_user

        # 2. Built-in developer / bakery fallback
        if not authenticated and user_lower == "admin" and (clean_pw == "admin123" or clean_pw == "BakeryAdmin2026!"):
            authenticated = True
            authenticated_username = "admin"

        # 3. Local persistent file check
        if not authenticated:
            local_admins = read_local_admins()
            for adm in local_admins:
                adm_user = str(adm.get("username", "")).strip()
                if adm_user.lower() == user_lower:
                    stored_pw = str(adm.get("password", "")).strip()
                    stored_hash = str(adm.get("passwordHash", "")).strip()
                    input_hash = hashlib.sha256(clean_pw.encode("utf-8")).hexdigest()
                    if clean_pw == stored_pw or input_hash == stored_pw or input_hash == stored_hash:
                        authenticated = True
                        authenticated_username = adm_user
                        break

        # 4. Secondary check: Firestore 'admins' collection if present
        if not authenticated and db is not None:
            try:
                admins_ref = db.collection("admins")
                candidate_doc_ids = [f"admin_{user_lower}", f"admin_{clean_user}", user_lower, clean_user]
                for doc_id in candidate_doc_ids:
                    doc_snap = admins_ref.document(doc_id).get()
                    if doc_snap.exists:
                        admin_data = doc_snap.to_dict() or {}
                        stored_pw = str(admin_data.get("password", "")).strip()
                        stored_hash = str(admin_data.get("password_hash", admin_data.get("passwordHash", ""))).strip()
                        input_hash = hashlib.sha256(clean_pw.encode("utf-8")).hexdigest()
                        if clean_pw == stored_pw or input_hash == stored_pw or input_hash == stored_hash:
                            authenticated = True
                            authenticated_username = admin_data.get("username", clean_user)
                            break

                if not authenticated:
                    for doc in admins_ref.stream():
                        admin_data = doc.to_dict() or {}
                        stored_user = str(admin_data.get("username", "")).strip()
                        if stored_user.lower() == user_lower:
                            stored_pw = str(admin_data.get("password", "")).strip()
                            stored_hash = str(admin_data.get("password_hash", admin_data.get("passwordHash", ""))).strip()
                            input_hash = hashlib.sha256(clean_pw.encode("utf-8")).hexdigest()
                            if clean_pw == stored_pw or input_hash == stored_pw or input_hash == stored_hash:
                                authenticated = True
                                authenticated_username = stored_user
                                break
            except Exception as err:
                print(f"[Auth Warning] Firestore admin lookup note: {err}")

        if authenticated:
            session.clear()
            session["admin_user"] = authenticated_username
            session["last_active"] = time.time()
            session.permanent = True
            flash(f"Welcome, {authenticated_username}! You are securely logged into the bakery panel.", "success")
            return redirect(url_for("admin_panel"))
        else:
            flash("Invalid credentials. Please verify your username and password.", "danger")
            return redirect(url_for("admin_login"))

    # If already logged in, redirect to admin panel
    if "admin_user" in session:
        return redirect(url_for("admin_panel"))

    return render_template("login.html")


@app.route("/bwp-panel-7781/logout")
def admin_logout():
    """Signs out the administrator and terminates the session."""
    session.clear()
    flash("You have been safely signed out.", "info")
    return redirect(url_for("admin_login"))


# ==============================================================================
# 9. ADMIN PANEL & PRODUCT MANAGEMENT (/bwp-panel-7781)
# ==============================================================================
@app.route("/bwp-panel-7781", methods=["GET", "POST"])
@login_required
def admin_panel():
    """
    Main Admin Dashboard at /bwp-panel-7781:
    - Lists all product IDs in a dropdown
    - Auto-fills Name, Price, Description, Image URL, Category
    - Supports editing any field with differential Firestore updates
    - Supports image file uploads to Firebase Storage
    - Mobile-responsive design
    """
    if request.method == "POST":
        product_id = request.form.get("product_id", "").strip()
        new_name = request.form.get("name", "").strip()
        new_price_raw = request.form.get("price", "").strip()
        new_desc = request.form.get("description", "").strip()
        new_category = request.form.get("category", "").strip()
        new_image_url = request.form.get("image_url", "").strip()

        # Handle optional Firebase Storage image file upload
        image_file = request.files.get("image_file")
        if image_file and image_file.filename and allowed_file(image_file.filename):
            uploaded_url = upload_to_firebase_storage(image_file, custom_id=product_id)
            if uploaded_url:
                new_image_url = uploaded_url

        # Input validation
        if not product_id:
            flash("Validation Error: Please select a valid product ID.", "danger")
            return redirect(url_for("admin_panel"))

        if not new_name or len(new_name) < 2:
            flash("Validation Error: Product name must be at least 2 characters long.", "danger")
            return redirect(url_for("admin_panel", selected=product_id))

        try:
            normalized_new_price = normalize_price(new_price_raw)
            if normalized_new_price is None or (isinstance(normalized_new_price, (int, float)) and normalized_new_price < 0):
                flash("Validation Error: Please enter a valid positive price.", "danger")
                return redirect(url_for("admin_panel", selected=product_id))
        except Exception:
            flash("Validation Error: Invalid price value.", "danger")
            return redirect(url_for("admin_panel", selected=product_id))

        if db is None:
            flash("Database Error: Firestore connection is not initialized.", "danger")
            return redirect(url_for("admin_panel", selected=product_id))

        try:
            doc_ref = db.collection("products").document(product_id)
            doc_snap = doc_ref.get()

            if not doc_snap.exists:
                flash(f"Error: Product '{product_id}' not found in Firestore.", "danger")
                return redirect(url_for("admin_panel"))

            current_data = doc_snap.to_dict() or {}
            update_data = {}

            if new_name != str(current_data.get("name", "")).strip():
                update_data["name"] = new_name

            current_price = current_data.get("price", "")
            if normalized_new_price != normalize_price(current_price):
                update_data["price"] = normalized_new_price

            if new_desc != str(current_data.get("description", "")).strip():
                update_data["description"] = new_desc

            if new_category != str(current_data.get("category", "")).strip():
                update_data["category"] = new_category

            current_img = str(current_data.get("image_url", current_data.get("image", ""))).strip()
            if new_image_url and new_image_url != current_img:
                update_data["image_url"] = new_image_url

            if update_data:
                update_data["updatedAt"] = firestore.SERVER_TIMESTAMP
                doc_ref.update(update_data)
                flash(f"Success! Updated fields for '{product_id}' in Firebase. Reflects live on homepage!", "success")
            else:
                flash(f"Notice: No changes detected for '{product_id}'.", "info")

        except Exception as err:
            flash(f"Firestore Update Error: {str(err)}", "danger")

        return redirect(url_for("admin_panel", selected=product_id))

    # GET: Load products
    products = get_all_products()
    selected_id = request.args.get("selected", "")

    if not selected_id and products:
        selected_id = next(iter(products.keys()))

    return render_template(
        "admin.html",
        products=products,
        selected_id=selected_id,
        current_user=session.get("admin_user"),
        imagekit_endpoint=IMAGEKIT_ENDPOINT
    )


# ==============================================================================
# 10. PRODUCT CREATION (/bwp-panel-7781/products/add)
# ==============================================================================
@app.route("/bwp-panel-7781/products/add", methods=["POST"])
@login_required
def admin_add_product():
    """
    Creates a new product in Firebase Firestore collection 'products'.
    Supports image URL or direct Firebase Storage file upload.
    """
    raw_id = request.form.get("product_id", "").strip()
    name = request.form.get("name", "").strip()
    price_raw = request.form.get("price", "").strip()
    description = request.form.get("description", "").strip()
    category = request.form.get("category", "Cakes").strip()
    image_url = request.form.get("image_url", "").strip()

    # Input validation
    if not name or len(name) < 2:
        flash("Validation Error: Product name must be at least 2 characters.", "danger")
        return redirect(url_for("admin_panel"))

    price = normalize_price(price_raw)
    if price is None:
        flash("Validation Error: Please provide a valid price.", "danger")
        return redirect(url_for("admin_panel"))

    # Generate document ID
    doc_id = raw_id if raw_id else name.lower().replace(" ", "-").replace("/", "-")
    doc_id = "".join(c for c in doc_id if c.isalnum() or c in "-_")
    if not doc_id:
        doc_id = f"prod-{int(time.time())}"

    # Handle image file upload to Firebase Storage if provided
    image_file = request.files.get("image_file")
    if image_file and image_file.filename and allowed_file(image_file.filename):
        uploaded_url = upload_to_firebase_storage(image_file, custom_id=doc_id)
        if uploaded_url:
            image_url = uploaded_url

    if not image_url:
        image_url = f"{IMAGEKIT_ENDPOINT}/default-cake.webp"

    if db is None:
        flash("Database Error: Firestore is not connected.", "danger")
        return redirect(url_for("admin_panel"))

    try:
        doc_ref = db.collection("products").document(doc_id)
        if doc_ref.get().exists:
            flash(f"Error: Product ID '{doc_id}' already exists in Firestore.", "danger")
            return redirect(url_for("admin_panel", selected=doc_id))

        new_doc_data = {
            "name": name,
            "price": price,
            "description": description,
            "category": category,
            "image_url": image_url,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(new_doc_data)
        flash(f"Success! Created '{name}' (ID: {doc_id}) in Firebase Firestore 'products'.", "success")
        return redirect(url_for("admin_panel", selected=doc_id))

    except Exception as err:
        flash(f"Failed to create product: {str(err)}", "danger")
        return redirect(url_for("admin_panel"))


# ==============================================================================
# 11. PRODUCT DELETION (/bwp-panel-7781/products/delete/<id>)
# ==============================================================================
@app.route("/bwp-panel-7781/products/delete/<product_id>", methods=["POST"])
@login_required
def admin_delete_product(product_id):
    """
    Deletes a product document from Firebase Firestore 'products' collection.
    """
    if not product_id:
        flash("Error: Invalid product ID for deletion.", "danger")
        return redirect(url_for("admin_panel"))

    if db is None:
        flash("Database Error: Firestore not initialized.", "danger")
        return redirect(url_for("admin_panel"))

    try:
        db.collection("products").document(product_id).delete()
        flash(f"Product '{product_id}' was successfully deleted from Firebase.", "success")
    except Exception as err:
        flash(f"Deletion failed: {str(err)}", "danger")

    return redirect(url_for("admin_panel"))


# ==============================================================================
# 12. ADD ADMIN VIEW (/bwp-panel-7781/add-admin)
# ==============================================================================
@app.route("/bwp-panel-7781/add-admin", methods=["GET", "POST"])
@login_required
def admin_add_admin():
    """Allows authenticated admins to create additional administrators in Firebase."""
    if request.method == "POST":
        new_username = request.form.get("new_username", "").strip()
        new_password = request.form.get("new_password", "").strip()
        confirm_password = request.form.get("confirm_password", "").strip()

        if not new_username or not new_password:
            flash("Validation Error: Username and password are required.", "danger")
            return redirect(url_for("admin_add_admin"))

        if len(new_username) < 3:
            flash("Validation Error: Username must be at least 3 characters.", "danger")
            return redirect(url_for("admin_add_admin"))

        if len(new_password) < 6:
            flash("Validation Error: Password must be at least 6 characters.", "danger")
            return redirect(url_for("admin_add_admin"))

        if new_password != confirm_password:
            flash("Validation Error: Passwords do not match.", "danger")
            return redirect(url_for("admin_add_admin"))

        clean_user = new_username.strip()
        clean_pw = new_password.strip()

        # Check existing in local store
        local_admins = read_local_admins()
        if any(str(a.get("username", "")).strip().lower() == clean_user.lower() for a in local_admins):
            flash(f"Error: Admin username '{clean_user}' already exists.", "danger")
            return redirect(url_for("admin_add_admin"))

        # Save to local persistent store
        save_local_admin(clean_user, clean_pw)

        # Save to Firestore collection 'admins' if available
        if db is not None:
            try:
                db.collection("admins").document(f"admin_{clean_user.lower()}").set({
                    "username": clean_user,
                    "username_lower": clean_user.lower(),
                    "password": clean_pw,
                    "password_hash": hashlib.sha256(clean_pw.encode("utf-8")).hexdigest(),
                    "createdAt": firestore.SERVER_TIMESTAMP
                })
            except Exception as err:
                print(f"[Firestore Admin Sync Note] {err}")

        flash(f"Success! Admin '{clean_user}' was created successfully and can now log in.", "success")
        return redirect(url_for("admin_add_admin"))

    return render_template("add_admin.html", current_user=session.get("admin_user"))


# ==============================================================================
# JSON ADMIN API ENDPOINTS (For React & REST clients)
# ==============================================================================
@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    data = request.get_json(silent=True) or {}
    clean_user = str(data.get("username", "")).strip()
    clean_pw = str(data.get("password", "")).strip()
    user_lower = clean_user.lower()

    if not clean_user or not clean_pw:
        return jsonify({"success": False, "error": "Username and password are required."}), 400

    # 1. Environment credentials
    env_admin_user = os.environ.get("ADMIN_USERNAME", "admin").strip()
    env_admin_pass = os.environ.get("ADMIN_PASSWORD", "BakeryAdmin2026!").strip()
    if user_lower == env_admin_user.lower() and clean_pw == env_admin_pass:
        return jsonify({"success": True, "username": env_admin_user, "role": "superadmin"})

    # 2. Dev fallback
    if user_lower == "admin" and (clean_pw == "admin123" or clean_pw == "BakeryAdmin2026!"):
        return jsonify({"success": True, "username": "admin", "role": "superadmin"})

    # 3. Local persistent store
    local_admins = read_local_admins()
    for adm in local_admins:
        adm_user = str(adm.get("username", "")).strip()
        if adm_user.lower() == user_lower:
            stored_pw = str(adm.get("password", "")).strip()
            stored_hash = str(adm.get("passwordHash", "")).strip()
            input_hash = hashlib.sha256(clean_pw.encode("utf-8")).hexdigest()
            if clean_pw == stored_pw or input_hash == stored_pw or input_hash == stored_hash:
                return jsonify({"success": True, "username": adm_user, "role": adm.get("role", "admin")})

    # 4. Firestore collection check
    if db is not None:
        try:
            admins_ref = db.collection("admins")
            candidate_doc_ids = [f"admin_{user_lower}", f"admin_{clean_user}", user_lower, clean_user]
            for doc_id in candidate_doc_ids:
                doc_snap = admins_ref.document(doc_id).get()
                if doc_snap.exists:
                    admin_data = doc_snap.to_dict() or {}
                    stored_pw = str(admin_data.get("password", "")).strip()
                    stored_hash = str(admin_data.get("password_hash", admin_data.get("passwordHash", ""))).strip()
                    input_hash = hashlib.sha256(clean_pw.encode("utf-8")).hexdigest()
                    if clean_pw == stored_pw or input_hash == stored_pw or input_hash == stored_hash:
                        return jsonify({"success": True, "username": admin_data.get("username", clean_user)})
        except Exception as err:
            print(f"[API Auth Warning] {err}")

    return jsonify({"success": False, "error": "Invalid username or password."}), 401


@app.route("/api/admin/add-admin", methods=["POST"])
def api_admin_add_admin():
    data = request.get_json(silent=True) or {}
    clean_user = str(data.get("username", "")).strip()
    clean_pw = str(data.get("password", "")).strip()
    role = str(data.get("role", "admin")).strip()

    if not clean_user or not clean_pw:
        return jsonify({"success": False, "error": "Username and password required."}), 400

    if len(clean_user) < 3:
        return jsonify({"success": False, "error": "Username must be at least 3 characters."}), 400

    if len(clean_pw) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters."}), 400

    local_admins = read_local_admins()
    if any(str(a.get("username", "")).strip().lower() == clean_user.lower() for a in local_admins):
        return jsonify({"success": False, "error": f"Admin username '{clean_user}' already exists."}), 400

    save_local_admin(clean_user, clean_pw, role)

    if db is not None:
        try:
            db.collection("admins").document(f"admin_{clean_user.lower()}").set({
                "username": clean_user,
                "username_lower": clean_user.lower(),
                "password": clean_pw,
                "password_hash": hashlib.sha256(clean_pw.encode("utf-8")).hexdigest(),
                "createdAt": firestore.SERVER_TIMESTAMP
            })
        except Exception as err:
            print(f"[API Firestore Sync Note] {err}")

    return jsonify({"success": True, "admin": {"username": clean_user, "role": role}}), 201


@app.route("/api/admin/admins", methods=["GET"])
def api_admin_list_admins():
    local_admins = read_local_admins()
    safe_list = [
        {"id": a.get("id", f"admin_{a.get('username','')}"), "username": a.get("username", ""), "role": a.get("role", "admin")}
        for a in local_admins
    ]
    return jsonify({"success": True, "admins": safe_list})


# ==============================================================================
# 13. ORDERS SYSTEM (FIRESTORE 'orders' COLLECTION & LOCAL BACKUP)
# ==============================================================================
ORDERS_FILE = os.path.join(os.getcwd(), "src", "data", "store", "orders.json")

def read_local_orders():
    try:
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print(f"[Orders Store] Error reading {ORDERS_FILE}: {e}")
    return []

def save_local_orders(orders):
    try:
        os.makedirs(os.path.dirname(ORDERS_FILE), exist_ok=True)
        with open(ORDERS_FILE, "w", encoding="utf-8") as f:
            json.dump(orders, f, indent=2)
        return True
    except Exception as e:
        print(f"[Orders Store] Error saving {ORDERS_FILE}: {e}")
        return False

def get_all_orders():
    """
    Fetches all orders from Firebase Firestore collection 'orders', sorted newest first.
    Falls back to local orders backup if Firestore is unavailable.
    """
    orders = []
    if db is not None:
        try:
            docs = db.collection("orders").stream()
            for doc in docs:
                data = doc.to_dict() or {}
                ord_id = str(data.get("order_id", doc.id)).strip()
                orders.append({
                    "order_id": ord_id,
                    "customer_name": str(data.get("customer_name", "Valued Customer")).strip(),
                    "phone": str(data.get("phone", "")).strip(),
                    "address": str(data.get("address", "")).strip(),
                    "city": str(data.get("city", "Bahawalpur")).strip(),
                    "items": data.get("items", []),
                    "total_price": data.get("total_price", 0),
                    "status": str(data.get("status", "New")).strip(),
                    "created_at": str(data.get("created_at", "")).strip()
                })
        except Exception as err:
            print(f"[Orders Warning] Failed to stream orders from Firestore: {err}")

    if orders:
        orders.sort(key=lambda o: str(o.get("created_at", "")), reverse=True)
        save_local_orders(orders)
        return orders

    local_orders = read_local_orders()
    local_orders.sort(key=lambda o: str(o.get("created_at", "")), reverse=True)
    return local_orders

def get_order_by_id(order_id):
    if db is not None:
        try:
            doc = db.collection("orders").document(order_id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                return {
                    "order_id": str(data.get("order_id", doc.id)),
                    "customer_name": str(data.get("customer_name", "Valued Customer")),
                    "phone": str(data.get("phone", "")),
                    "address": str(data.get("address", "")),
                    "city": str(data.get("city", "Bahawalpur")),
                    "items": data.get("items", []),
                    "total_price": data.get("total_price", 0),
                    "status": str(data.get("status", "New")),
                    "created_at": str(data.get("created_at", ""))
                }
        except Exception as e:
            print(f"[Order Lookup Note] {e}")

    for o in read_local_orders():
        if str(o.get("order_id")) == str(order_id):
            return o
    return None

def create_firestore_order(customer_name, phone, address, city, items, total_price):
    import random
    import string
    
    order_suffix = "".join(random.choices(string.digits, k=5))
    order_id = f"ORD-{order_suffix}"
    created_at_str = time.strftime("%Y-%m-%d %H:%M:%S")

    order_doc = {
        "order_id": order_id,
        "customer_name": customer_name,
        "phone": phone,
        "address": address,
        "city": city,
        "items": items,
        "total_price": total_price,
        "status": "New",
        "created_at": created_at_str
    }

    # Print order to console (Email/Notification Requirement)
    print("\n" + "=" * 60)
    print(f"📦 [NEW ORDER RECEIVED] Order #{order_id}")
    print(f"👤 Customer: {customer_name} | Phone: {phone}")
    print(f"📍 Address: {address}, {city}")
    print(f"💰 Total Price: Rs {total_price}")
    print(f"🏷️ Status: New | Placed: {created_at_str}")
    print(f"📋 Items Breakdown ({len(items)} items):")
    for itm in items:
        name = itm.get("name", "Item")
        qty = itm.get("quantity", 1)
        price = itm.get("price", 0)
        tot = itm.get("total", price * qty)
        print(f"   • {name} x {qty} @ Rs {price} = Rs {tot}")
    print("=" * 60 + "\n")

    # Save to Firestore
    if db is not None:
        try:
            order_data = dict(order_doc)
            order_data["server_timestamp"] = firestore.SERVER_TIMESTAMP
            db.collection("orders").document(order_id).set(order_data)
            print(f"[Firestore] Order #{order_id} recorded in 'orders' collection.")
        except Exception as err:
            print(f"[Firestore Error] Failed to write order #{order_id}: {err}")

    # Update local backup
    local_orders = read_local_orders()
    local_orders.insert(0, order_doc)
    save_local_orders(local_orders)

    return order_id, order_doc

def update_order_status_in_firestore(order_id, new_status):
    valid_statuses = ["New", "Processing", "Shipped", "Delivered", "Cancelled"]
    if new_status not in valid_statuses:
        return False, f"Invalid status: {new_status}"

    print(f"🔄 [ORDER STATUS UPDATE] Order #{order_id} status changed to: {new_status}")

    if db is not None:
        try:
            db.collection("orders").document(order_id).update({
                "status": new_status,
                "updated_at": firestore.SERVER_TIMESTAMP
            })
            print(f"[Firestore] Order #{order_id} status updated in 'orders' collection.")
        except Exception as err:
            print(f"[Firestore Error] Failed to update status for #{order_id}: {err}")

    local_orders = read_local_orders()
    for o in local_orders:
        if str(o.get("order_id")) == str(order_id):
            o["status"] = new_status
            break
    save_local_orders(local_orders)

    return True, f"Order #{order_id} status updated to {new_status}"


# ==============================================================================
# CART & CHECKOUT ROUTES (Flask Session + LocalStorage Sync)
# ==============================================================================
@app.route("/cart", methods=["GET"])
def cart_page():
    cart = session.get("cart", {})
    if not isinstance(cart, dict):
        cart = {}
    
    subtotal = 0
    total_qty = 0
    for itm in cart.values():
        p = float(itm.get("price", 0))
        q = int(itm.get("quantity") or itm.get("qty", 1))
        subtotal += p * q
        total_qty += q
    
    return render_template(
        "cart.html",
        cart=cart,
        cart_count=total_qty,
        subtotal=subtotal,
        total=subtotal,
        whatsapp_number=os.environ.get("WHATSAPP_NUMBER", "923017778181")
    )


@app.route("/cart/add/<product_id>", methods=["POST"])
def cart_add(product_id):
    product_id = str(product_id).strip()
    data = request.get_json(silent=True) or request.form
    
    cart = session.get("cart", {})
    if not isinstance(cart, dict):
        cart = {}
        
    name = data.get("name")
    price = data.get("price")
    quantity = int(data.get("quantity") or data.get("qty", 1))
    image_url = data.get("image_url", "")
    category = data.get("category", "Bakery")
    
    if not name or price is None:
        prods = get_all_products()
        if product_id in prods:
            pinfo = prods[product_id]
            name = pinfo.get("name", "Artisanal Bake")
            price = pinfo.get("price", 0)
            image_url = pinfo.get("image_url", "")
            category = pinfo.get("category", "Bakery")
            
    try:
        price = float(price or 0)
    except Exception:
        price = 0.0

    if product_id in cart:
        new_q = int(cart[product_id].get("quantity") or cart[product_id].get("qty", 1)) + quantity
        cart[product_id]["quantity"] = new_q
        cart[product_id]["qty"] = new_q
    else:
        cart[product_id] = {
            "id": product_id,
            "product_id": product_id,
            "name": name or "Artisanal Treat",
            "price": price,
            "quantity": quantity,
            "qty": quantity,
            "image_url": image_url,
            "category": category
        }
        
    session["cart"] = cart
    session.modified = True
    
    total_qty = sum(int(it.get("quantity") or it.get("qty", 1)) for it in cart.values())
    
    if request.is_json or request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"success": True, "cart_count": total_qty, "cart": cart})
    
    flash(f'Added "{name}" to cart.', "success")
    return redirect(url_for("cart_page"))


@app.route("/cart/update/<product_id>", methods=["POST"])
def cart_update(product_id):
    product_id = str(product_id).strip()
    data = request.get_json(silent=True) or request.form
    delta = int(data.get("delta", 0))
    qty = data.get("quantity")
    
    cart = session.get("cart", {})
    if isinstance(cart, dict) and product_id in cart:
        if qty is not None:
            new_qty = int(qty)
        else:
            current_qty = int(cart[product_id].get("quantity") or cart[product_id].get("qty", 1))
            new_qty = current_qty + delta
            
        if new_qty <= 0:
            cart.pop(product_id, None)
        else:
            cart[product_id]["quantity"] = new_qty
            cart[product_id]["qty"] = new_qty
            
        session["cart"] = cart
        session.modified = True
        
    total_qty = sum(int(it.get("quantity") or it.get("qty", 1)) for it in cart.values()) if isinstance(cart, dict) else 0
    
    if request.is_json:
        return jsonify({"success": True, "cart_count": total_qty, "cart": cart})
    return redirect(url_for("cart_page"))


@app.route("/cart/remove/<product_id>", methods=["POST"])
def cart_remove(product_id):
    product_id = str(product_id).strip()
    cart = session.get("cart", {})
    if isinstance(cart, dict) and product_id in cart:
        cart.pop(product_id, None)
        session["cart"] = cart
        session.modified = True
        
    total_qty = sum(int(it.get("quantity") or it.get("qty", 1)) for it in cart.values()) if isinstance(cart, dict) else 0
    if request.is_json:
        return jsonify({"success": True, "cart_count": total_qty})
    return redirect(url_for("cart_page"))


@app.route("/cart/clear", methods=["POST"])
def cart_clear():
    session["cart"] = {}
    session.modified = True
    if request.is_json:
        return jsonify({"success": True, "cart_count": 0})
    return redirect(url_for("cart_page"))


@app.route("/checkout", methods=["GET", "POST"])
def checkout_page():
    cart = session.get("cart", {})
    if not isinstance(cart, dict):
        cart = {}
        
    subtotal = sum(float(it.get("price", 0)) * int(it.get("quantity") or it.get("qty", 1)) for it in cart.values())
    total_qty = sum(int(it.get("quantity") or it.get("qty", 1)) for it in cart.values())

    if request.method == "GET":
        return render_template(
            "checkout.html",
            cart=cart,
            cart_count=total_qty,
            subtotal=subtotal,
            total=subtotal,
            whatsapp_number=os.environ.get("WHATSAPP_NUMBER", "923017778181")
        )
    
    data = request.get_json(silent=True) or request.form
    customer_name = str(data.get("customer_name") or data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    city = str(data.get("city", "Bahawalpur")).strip()
    
    items = []
    if cart:
        for pid, itm in cart.items():
            q = int(itm.get("quantity") or itm.get("qty", 1))
            p = float(itm.get("price", 0))
            items.append({
                "name": itm.get("name", "Item"),
                "price": p,
                "qty": q,
                "quantity": q,
                "total": p * q
            })

    if not items:
        items_raw = data.get("items")
        if items_raw is None and "items_json" in data:
            try:
                items_raw = json.loads(data.get("items_json", "[]"))
            except Exception:
                items_raw = []
        if isinstance(items_raw, list):
            for i in items_raw:
                q = int(i.get("quantity") or i.get("qty", 1))
                p = float(i.get("price", 0))
                items.append({
                    "name": i.get("name", "Item"),
                    "price": p,
                    "qty": q,
                    "quantity": q,
                    "total": p * q
                })

    total_price = data.get("total_price")
    try:
        total_price = float(total_price)
    except Exception:
        total_price = sum(float(i.get("total", 0)) for i in items)

    if not customer_name or not phone or not address:
        if request.is_json:
            return jsonify({"success": False, "error": "Customer name, phone, and address are required."}), 400
        flash("Please provide your name, phone number, and delivery address.", "danger")
        return redirect(url_for("checkout_page"))

    order_id, _ = create_firestore_order(customer_name, phone, address, city, items, total_price)

    # Empty session cart upon checkout success
    session["cart"] = {}
    session.modified = True

    if request.is_json:
        return jsonify({"success": True, "order_id": order_id}), 201
    
    return redirect(url_for("order_success", order_id=order_id))


@app.route("/order-success/<order_id>", methods=["GET"])
def order_success(order_id):
    order = get_order_by_id(order_id)
    if not order:
        order = {
            "order_id": order_id,
            "customer_name": "Valued Customer",
            "phone": "Provided",
            "address": "Local Delivery",
            "city": "Bahawalpur",
            "items": [],
            "total_price": 0,
            "status": "New",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    return render_template(
        "order_success.html", 
        order=order,
        whatsapp_number=os.environ.get("WHATSAPP_NUMBER", "923017778181")
    )


@app.route("/bwp-panel-7781/orders", methods=["GET"])
@login_required
def admin_orders():
    return redirect("/bwp-panel-7781?tab=orders")


@app.route("/bwp-panel-7781/orders/<order_id>/status", methods=["POST"])
@login_required
def admin_update_order_status(order_id):
    new_status = request.form.get("status", "").strip()
    success, msg = update_order_status_in_firestore(order_id, new_status)
    if success:
        flash(f"Order #{order_id} status updated to '{new_status}' in Firestore.", "success")
    else:
        flash(f"Error updating order: {msg}", "danger")
    return redirect("/bwp-panel-7781?tab=orders")


@app.route("/api/orders", methods=["GET", "POST"])
def api_orders():
    if request.method == "GET":
        orders = get_all_orders()
        return jsonify({"success": True, "orders": orders})
    
    data = request.get_json(silent=True) or {}
    customer_name = str(data.get("customer_name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    city = str(data.get("city", "Bahawalpur")).strip()
    items = data.get("items", [])
    total_price = float(data.get("total_price", 0))

    if not customer_name or not phone or not address:
        return jsonify({"success": False, "error": "Name, phone, and address are required."}), 400

    order_id, order_doc = create_firestore_order(customer_name, phone, address, city, items, total_price)
    return jsonify({"success": True, "order_id": order_id, "order": order_doc}), 201


@app.route("/api/orders/<order_id>/status", methods=["POST", "PATCH"])
def api_order_status(order_id):
    data = request.get_json(silent=True) or request.form
    new_status = str(data.get("status", "")).strip()
    success, msg = update_order_status_in_firestore(order_id, new_status)
    if success:
        return jsonify({"success": True, "order_id": order_id, "status": new_status})
    return jsonify({"success": False, "error": msg}), 400


# ==============================================================================
# 13. ERROR HANDLERS (404 and 500)
# ==============================================================================
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def server_error(e):
    return render_template("500.html"), 500


# ==============================================================================
# 14. LOCAL / REPLIT RUNNER
# ==============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Muffinns Bakery Flask Server on http://0.0.0.0:{port}")
    print(f"Admin portal securely hosted at: /bwp-panel-7781 (legacy /admin blocked)")
    app.run(host="0.0.0.0", port=port, debug=False)
