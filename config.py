import os

class Config:
    """Base configuration settings."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_hard_to_guess_string_for_dev'
    DEBUG = True
    TESTING = False
    MODEL_PATH = 'data/trained_model.pkl'
