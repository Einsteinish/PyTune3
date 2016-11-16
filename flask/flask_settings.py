import logging
import pymongo

# ===================
# = Server Settings =
# ===================

ADMINS                = (
    ('K Hong', 'pytune@aol.com'),
)

SERVER_EMAIL          = 'kihyuck.hong@gmail.com'
HELLO_EMAIL           = 'kihyuck.hong@gmail.com'
#PYTUNE_URL            = 'localhost'
#SESSION_COOKIE_DOMAIN = 'localhost'
PYTUNE_URL            = 'pytune.com'
SESSION_COOKIE_DOMAIN = '.pytune.com'

# ===================
# = Global Settings =
# ===================

DEBUG = True
DEBUG_ASSETS = DEBUG
#MEDIA_URL = '/media/'
SECRET_KEY = 'YOUR SECRET KEY'
AUTO_PREMIUM_NEW_USERS = True
AUTO_ENABLE_NEW_USERS = True

# CACHE_BACKEND = 'dummy:///'
# CACHE_BACKEND = 'locmem:///'
# CACHE_BACKEND = 'memcached://127.0.0.1:11211'

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': '127.0.0.1:6379',
        'OPTIONS': {
            'DB': 6,
            'PARSER_CLASS': 'redis.connection.HiredisParser'
        },
    },
}

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Set this to the username that is shown on the homepage to unauthenticated users.
HOMEPAGE_USERNAME = 'popular'

# Google Reader OAuth API Keys
OAUTH_KEY = 'www.example.com'
OAUTH_SECRET = 'SECRET_KEY_FROM_GOOGLE'

S3_ACCESS_KEY = 'XXX'
S3_SECRET = 'SECRET'
S3_BACKUP_BUCKET = 'pytune_backups'
S3_PAGES_BUCKET_NAME = 'pages-XXX.pytune.com'
S3_ICONS_BUCKET_NAME = 'icons-XXX.pytune.com'

STRIPE_SECRET = "YOUR-SECRET-API-KEY"
STRIPE_PUBLISHABLE = "YOUR-PUBLISHABLE-API-KEY"

# ===============
# = Social APIs =
# ===============

FACEBOOK_APP_ID = '111111111111111'
FACEBOOK_SECRET = '99999999999999999999999999999999'
TWITTER_CONSUMER_KEY = 'ooooooooooooooooooooo'
TWITTER_CONSUMER_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
YOUTUBE_API_KEY = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# =============
# = Databases =
# =============

DATABASES = {
    'default': {
        'NAME': 'pytunedb',
        'ENGINE': 'django.db.backends.mysql',
        'USER': 'pytune',
        #'PASSWORD': 'HK*UY(!4akkb777',
        'PASSWORD': 'kkb777',
        'HOST': '127.0.0.1',
        'OPTIONS': {
            "autocommit": True,
        },
    },
}

MONGO_DB = {
    'name': 'pytunedb',
    'host': '127.0.0.1',
    'port': 27017
}

MONGODB_SLAVE = {
    'host': '127.0.0.1'
}

# Celery RabbitMQ/Redis Broker
BROKER_URL = "redis://127.0.0.1:6379/0"
CELERY_RESULT_BACKEND = BROKER_URL

REDIS = {
    'host': '127.0.0.1',
}
REDIS_PUBSUB = {
    'host': '127.0.0.1',
}
REDIS_STORY = {
    'host': '127.0.0.1',
}

ELASTICSEARCH_FEED_HOSTS = ["127.0.0.1:9200"]
ELASTICSEARCH_STORY_HOSTS = ["127.0.0.1:9200"]

BACKED_BY_AWS = {
    'pages_on_node': False,
    'pages_on_s3': False,
    'icons_on_s3': False,
}

ORIGINAL_PAGE_SERVER = "127.0.0.1:3060"

# ===========
# = Logging =
# ===========

# Logging (setup for development)
LOG_TO_STREAM = True

if len(logging._handlerList) < 1:
    LOG_FILE = '~/pytune/logs/development.log'
    logging.basicConfig(level=logging.DEBUG,
                            format='%(asctime)-12s: %(message)s',
                            datefmt='%b %d %H:%M:%S',
                            handler=logging.StreamHandler)

