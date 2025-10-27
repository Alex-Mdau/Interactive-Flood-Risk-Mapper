import os

class Config:
    """Base configuration settings."""
    SECRET_KEY = os.environ.get('SECRET_KEY') #Ommited mine
    DEBUG = True
    TESTING = False
    MODEL_PATH = 'data/trained_model.pkl'
