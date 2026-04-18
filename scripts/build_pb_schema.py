#!/usr/bin/env python3
"""
Generate pb_schema/collections.json in the strict format PocketBase 0.22+
expects for admin-UI import.

Each field needs an `id`, type-specific properties, and every collection
needs the base system fields (id, created, updated).
"""
import json
import hashlib
from pathlib import Path

USERS_COL = "_pb_users_auth_"


def hid(prefix: str, name: str) -> str:
    """Produce a stable, unique-ish field id like PocketBase does."""
    h = hashlib.sha1(f"{prefix}:{name}".encode()).hexdigest()[:9]
    # PocketBase's own ids are like `text3208210256` — alphanum, readable.
    return f"{prefix}{int(h, 16) % 10**10}"


def col_id(name: str) -> str:
    h = hashlib.sha1(f"col:{name}".encode()).hexdigest()[:9]
    return f"pbc_{int(h, 16) % 10**10}"


def base_fields(col_name: str) -> list:
    return [
        {
            "type": "text",
            "name": "id",
            "id": "text3208210256",
            "autogeneratePattern": "[a-z0-9]{15}",
            "hidden": False,
            "max": 15,
            "min": 15,
            "pattern": "^[a-z0-9]+$",
            "presentable": False,
            "primaryKey": True,
            "required": True,
            "system": True,
        },
        {
            "type": "autodate",
            "name": "created",
            "id": "autodate2990389176",
            "hidden": False,
            "onCreate": True,
            "onUpdate": False,
            "presentable": False,
            "system": False,
        },
        {
            "type": "autodate",
            "name": "updated",
            "id": "autodate3332085495",
            "hidden": False,
            "onCreate": True,
            "onUpdate": True,
            "presentable": False,
            "system": False,
        },
    ]


# ── Field factories ───────────────────────────────────────────────────────

def fld_text(col, name, required=False, max_=0, min_=0, pattern=""):
    return {
        "type": "text",
        "name": name,
        "id": hid("text", f"{col}:{name}"),
        "autogeneratePattern": "",
        "hidden": False,
        "max": max_,
        "min": min_,
        "pattern": pattern,
        "presentable": False,
        "primaryKey": False,
        "required": required,
        "system": False,
    }


def fld_editor(col, name, required=False):
    return {
        "type": "editor",
        "name": name,
        "id": hid("editor", f"{col}:{name}"),
        "convertURLs": False,
        "hidden": False,
        "maxSize": 0,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_bool(col, name, required=False):
    return {
        "type": "bool",
        "name": name,
        "id": hid("bool", f"{col}:{name}"),
        "hidden": False,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_number(col, name, required=False, min_=None, max_=None, only_int=False):
    return {
        "type": "number",
        "name": name,
        "id": hid("number", f"{col}:{name}"),
        "hidden": False,
        "max": max_,
        "min": min_,
        "onlyInt": only_int,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_date(col, name, required=False):
    return {
        "type": "date",
        "name": name,
        "id": hid("date", f"{col}:{name}"),
        "hidden": False,
        "max": "",
        "min": "",
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_url(col, name, required=False):
    return {
        "type": "url",
        "name": name,
        "id": hid("url", f"{col}:{name}"),
        "exceptDomains": None,
        "onlyDomains": None,
        "hidden": False,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_json(col, name, required=False, max_size=0):
    return {
        "type": "json",
        "name": name,
        "id": hid("json", f"{col}:{name}"),
        "hidden": False,
        "maxSize": max_size,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_select(col, name, values, required=False, max_select=1):
    return {
        "type": "select",
        "name": name,
        "id": hid("select", f"{col}:{name}"),
        "hidden": False,
        "maxSelect": max_select,
        "values": values,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_file(col, name, max_select=1, mime_types=None, required=False):
    return {
        "type": "file",
        "name": name,
        "id": hid("file", f"{col}:{name}"),
        "hidden": False,
        "maxSelect": max_select,
        "maxSize": 0,
        "mimeTypes": mime_types or [],
        "protected": False,
        "thumbs": None,
        "presentable": False,
        "required": required,
        "system": False,
    }


def fld_relation(col, name, collection_id, required=False, max_select=1,
                 cascade_delete=False, min_select=None):
    return {
        "type": "relation",
        "name": name,
        "id": hid("rel", f"{col}:{name}"),
        "hidden": False,
        "collectionId": collection_id,
        "cascadeDelete": cascade_delete,
        "maxSelect": max_select,
        "minSelect": min_select,
        "presentable": False,
        "required": required,
        "system": False,
    }


# ── Collection definitions ────────────────────────────────────────────────

collections = []


def add(name, *, list_rule="", view_rule="", create_rule=None,
        update_rule=None, delete_rule=None, fields=None, indexes=None):
    cid = col_id(name)
    collections.append({
        "id": cid,
        "name": name,
        "type": "base",
        "system": False,
        "listRule": list_rule,
        "viewRule": view_rule,
        "createRule": create_rule,
        "updateRule": update_rule,
        "deleteRule": delete_rule,
        "fields": base_fields(name) + (fields or []),
        "indexes": indexes or [],
    })
    return cid


# 1. courses — public read, admin write
courses_id = add(
    "courses",
    list_rule="", view_rule="",
    fields=[
        fld_text("courses", "title", required=True, max_=120),
        fld_text("courses", "slug", required=True, pattern="^[a-z0-9-]+$"),
        fld_text("courses", "tagline", max_=180),
        fld_editor("courses", "description"),
        fld_file("courses", "thumbnail", mime_types=["image/png","image/jpeg","image/webp"]),
        fld_file("courses", "cover_image", mime_types=["image/png","image/jpeg","image/webp"]),
        fld_select("courses", "access_type", ["free","paid"], required=True),
        fld_number("courses", "price_cents", min_=0, only_int=True),
        fld_text("courses", "currency", max_=3),
        fld_select("courses", "billing", ["one_time","monthly","yearly"]),
        fld_bool("courses", "is_published"),
        fld_number("courses", "sort_order", min_=0, only_int=True),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_courses_slug` ON `courses` (`slug`)"],
)

# 2. enrollments — each user sees only their own
enrollments_id = add(
    "enrollments",
    list_rule="@request.auth.id = user.id",
    view_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("enrollments", "user", USERS_COL, required=True, cascade_delete=True),
        fld_relation("enrollments", "course", courses_id, required=True, cascade_delete=True),
        fld_select("enrollments", "status", ["active","cancelled","pending"], required=True),
        fld_date("enrollments", "enrolled_at"),
        fld_date("enrollments", "expires_at"),
        fld_select("enrollments", "source", ["free","stripe","manual","promo"]),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_enrollments_user_course` ON `enrollments` (`user`, `course`)"],
)

# 3. categories — public read
categories_id = add(
    "categories",
    list_rule="", view_rule="",
    fields=[
        fld_text("categories", "name", required=True, max_=60),
        fld_text("categories", "slug", required=True, pattern="^[a-z0-9-]+$"),
        fld_text("categories", "emoji", max_=8),
        fld_text("categories", "description", max_=200),
        fld_relation("categories", "course", courses_id, cascade_delete=True),
        fld_number("categories", "sort_order", min_=0, only_int=True),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_categories_slug_course` ON `categories` (`slug`, `course`)"],
)

# 4. rules — public read
add(
    "rules",
    list_rule="", view_rule="",
    fields=[
        fld_text("rules", "title", required=True, max_=120),
        fld_editor("rules", "body", required=True),
        fld_relation("rules", "course", courses_id, cascade_delete=True),
        fld_number("rules", "sort_order", min_=0, only_int=True),
    ],
)

# 5. posts — public read, auth create, author-only update/delete
posts_id = add(
    "posts",
    list_rule="", view_rule="",
    create_rule="@request.auth.id != ''",
    update_rule="@request.auth.id = author.id",
    delete_rule="@request.auth.id = author.id",
    fields=[
        fld_text("posts", "title", required=True, max_=180),
        fld_editor("posts", "content"),
        fld_relation("posts", "author", USERS_COL, required=True, cascade_delete=True),
        fld_relation("posts", "course", courses_id, cascade_delete=True),
        fld_relation("posts", "category", categories_id),
        fld_bool("posts", "is_pinned"),
        fld_file("posts", "image", mime_types=["image/png","image/jpeg","image/webp","image/gif"]),
        fld_url("posts", "video_url"),
        fld_number("posts", "like_count", min_=0, only_int=True),
        fld_number("posts", "comment_count", min_=0, only_int=True),
    ],
    indexes=[
        "CREATE INDEX `idx_posts_course_created` ON `posts` (`course`, `created`)",
        "CREATE INDEX `idx_posts_category` ON `posts` (`category`)",
    ],
)

# 6. comments
comments_id = col_id("comments")
collections.append({
    "id": comments_id,
    "name": "comments",
    "type": "base",
    "system": False,
    "listRule": "", "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id = author.id",
    "deleteRule": "@request.auth.id = author.id",
    "fields": base_fields("comments") + [
        fld_relation("comments", "post", posts_id, required=True, cascade_delete=True),
        fld_relation("comments", "author", USERS_COL, required=True, cascade_delete=True),
        fld_relation("comments", "parent", comments_id, cascade_delete=True),
        fld_text("comments", "body", required=True, max_=4000),
    ],
    "indexes": ["CREATE INDEX `idx_comments_post` ON `comments` (`post`, `created`)"],
})

# 7. reactions
add(
    "reactions",
    list_rule="", view_rule="",
    create_rule="@request.auth.id = user.id",
    delete_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("reactions", "user", USERS_COL, required=True, cascade_delete=True),
        fld_select("reactions", "target_type", ["post","comment"], required=True),
        fld_text("reactions", "target_id", required=True, max_=60),
        fld_select("reactions", "kind", ["like","heart","spark","hug"], required=True),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_reactions_unique` ON `reactions` (`user`, `target_type`, `target_id`, `kind`)"],
)

# 8. notifications
add(
    "notifications",
    list_rule="@request.auth.id = user.id",
    view_rule="@request.auth.id = user.id",
    update_rule="@request.auth.id = user.id",
    delete_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("notifications", "user", USERS_COL, required=True, cascade_delete=True),
        fld_select("notifications", "kind",
                   ["comment","mention","reaction","enrollment","event","system"], required=True),
        fld_text("notifications", "title", required=True, max_=180),
        fld_text("notifications", "body", max_=500),
        fld_text("notifications", "link", max_=300),
        fld_date("notifications", "read_at"),
    ],
    indexes=["CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user`, `read_at`)"],
)

# 9. chat_threads
threads_id = add(
    "chat_threads",
    list_rule="@request.auth.id ?= participants.id",
    view_rule="@request.auth.id ?= participants.id",
    create_rule="@request.auth.id != ''",
    update_rule="@request.auth.id ?= participants.id",
    fields=[
        fld_relation("chat_threads", "participants", USERS_COL, required=True, max_select=10),
        fld_text("chat_threads", "last_message", max_=500),
        fld_date("chat_threads", "last_message_at"),
    ],
)

# 10. chat_messages
add(
    "chat_messages",
    list_rule="@request.auth.id ?= thread.participants.id",
    view_rule="@request.auth.id ?= thread.participants.id",
    create_rule="@request.auth.id = sender.id && @request.auth.id ?= thread.participants.id",
    delete_rule="@request.auth.id = sender.id",
    fields=[
        fld_relation("chat_messages", "thread", threads_id, required=True, cascade_delete=True),
        fld_relation("chat_messages", "sender", USERS_COL, required=True, cascade_delete=True),
        fld_text("chat_messages", "body", required=True, max_=4000),
        fld_relation("chat_messages", "read_by", USERS_COL, max_select=20),
    ],
    indexes=["CREATE INDEX `idx_messages_thread_created` ON `chat_messages` (`thread`, `created`)"],
)

# 11. user_preferences
add(
    "user_preferences",
    list_rule="@request.auth.id = user.id",
    view_rule="@request.auth.id = user.id",
    create_rule="@request.auth.id = user.id",
    update_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("user_preferences", "user", USERS_COL, required=True, cascade_delete=True),
        fld_select("user_preferences", "theme", ["light","dark","system"]),
        fld_relation("user_preferences", "active_course", courses_id),
        fld_bool("user_preferences", "notify_comments"),
        fld_bool("user_preferences", "notify_mentions"),
        fld_bool("user_preferences", "notify_reactions"),
        fld_bool("user_preferences", "notify_events"),
        fld_bool("user_preferences", "email_digest_weekly"),
        fld_select("user_preferences", "language", ["es","en"]),
        fld_text("user_preferences", "timezone", max_=64),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_user_preferences_user` ON `user_preferences` (`user`)"],
)

# 12. payment_methods
add(
    "payment_methods",
    list_rule="@request.auth.id = user.id",
    view_rule="@request.auth.id = user.id",
    delete_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("payment_methods", "user", USERS_COL, required=True, cascade_delete=True),
        fld_select("payment_methods", "provider", ["stripe"], required=True),
        fld_text("payment_methods", "provider_payment_id", required=True, max_=120),
        fld_select("payment_methods", "kind", ["card","link","apple_pay","google_pay"]),
        fld_text("payment_methods", "brand", max_=32),
        fld_text("payment_methods", "last4", max_=4),
        fld_number("payment_methods", "exp_month", min_=1, max_=12, only_int=True),
        fld_number("payment_methods", "exp_year", min_=2020, max_=2100, only_int=True),
        fld_bool("payment_methods", "is_default"),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_payment_methods_provider_id` ON `payment_methods` (`provider`, `provider_payment_id`)"],
)

# 13. transactions
add(
    "transactions",
    list_rule="@request.auth.id = user.id",
    view_rule="@request.auth.id = user.id",
    fields=[
        fld_relation("transactions", "user", USERS_COL, required=True),
        fld_relation("transactions", "course", courses_id),
        fld_number("transactions", "amount_cents", required=True, min_=0, only_int=True),
        fld_text("transactions", "currency", required=True, max_=3),
        fld_select("transactions", "status",
                   ["pending","succeeded","failed","refunded"], required=True),
        fld_select("transactions", "provider", ["stripe","manual"], required=True),
        fld_text("transactions", "provider_ref", max_=200),
        fld_text("transactions", "description", max_=300),
    ],
    indexes=["CREATE INDEX `idx_transactions_user_created` ON `transactions` (`user`, `created`)"],
)

# 14. feature_flags
add(
    "feature_flags",
    list_rule="", view_rule="",
    fields=[
        fld_text("feature_flags", "key", required=True, pattern="^[a-z0-9_]+$", max_=80),
        fld_bool("feature_flags", "enabled"),
        fld_json("feature_flags", "value"),
        fld_text("feature_flags", "description", max_=300),
    ],
    indexes=["CREATE UNIQUE INDEX `idx_feature_flags_key` ON `feature_flags` (`key`)"],
)

# ── Write ────────────────────────────────────────────────────────────────

out = Path("pb_schema/collections.json")
out.write_text(json.dumps(collections, indent=2) + "\n")
print(f"Wrote {len(collections)} collections → {out}")
