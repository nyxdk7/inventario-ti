import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def lista_env(nome, padrao=""):
    valor = os.environ.get(nome, padrao)

    return [
        item.strip()
        for item in valor.split(",")
        if item.strip()
    ]


SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-inventario-ti-dev-key"
)

DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = lista_env(
    "DJANGO_ALLOWED_HOSTS",
    "localhost,127.0.0.1"
)


INSTALLED_APPS = [
    "corsheaders",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "inventario",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "inventario.auth_middleware.InventarioAuthMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "templates",
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("DJANGO_DB_PATH", BASE_DIR / "db.sqlite3"),
    }
}


AUTH_PASSWORD_VALIDATORS = []


LANGUAGE_CODE = "pt-br"

TIME_ZONE = "America/Porto_Velho"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOWED_ORIGINS = lista_env(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
)

CSRF_TRUSTED_ORIGINS = lista_env(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
)

CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "0") == "1"
CSRF_COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "0") == "1"