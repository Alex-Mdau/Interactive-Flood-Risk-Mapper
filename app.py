import os
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.ensemble import RandomForestRegressor
from joblib import dump, load
from config import Config
import numpy as np


def train_and_save_model(data_path, model_path):
    """Trains a simple Random Forest model and saves it."""
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"Error: Data file not found at {data_path}. Generating dummy data.")
        # Generate synthetic data for robust startup
        np.random.seed(42)
        n_samples = 100
        lat = np.random.uniform(33.9, 34.2, n_samples)
        lon = np.random.uniform(-118.4, -118.1, n_samples)
        elev = np.random.normal(70, 30, n_samples)
        river_prox = np.abs(np.random.normal(2, 1, n_samples))
        rain = np.random.normal(500, 100, n_samples)
        # Risk score calculation (simple linear combination with noise)
        risk = 100 - (0.5 * elev + 10 * river_prox - 0.1 * rain) + np.random.normal(0, 5, n_samples)
        risk = np.clip(risk, 0, 100)
        
        df = pd.DataFrame({
            'latitude': lat, 'longitude': lon, 'elevation_m': elev, 
            'proximity_to_river_km': river_prox, 'rainfall_annual_mm': rain, 
            'risk_score': risk.astype(int)
        })
    
    # Features (X) and Target (y)
    features = ['latitude', 'longitude', 'elevation_m', 'proximity_to_river_km', 'rainfall_annual_mm']
    X = df[features]
    y = df['risk_score']
    
    # Simple model training
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model
    dump(model, model_path)
    print(f"Model trained and saved to {model_path}")
    return model

def load_or_train_model(data_path, model_path):
    """Loads a pre-trained model or trains a new one if not found."""
    if os.path.exists(model_path):
        try:
            model = load(model_path)
            print(f"Model loaded from {model_path}")
            return model
        except Exception as e:
            print(f"Could not load model: {e}. Retraining...")
            return train_and_save_model(data_path, model_path)
    else:
        return train_and_save_model(data_path, model_path)

# --- Flask Application Setup ---

app = Flask(__name__)
app.config.from_object(Config)

# Ensure data directory exists
os.makedirs('data', exist_ok=True)


FEATURE_DEFAULTS = {
    'elevation_m': 70,  # Average elevation
    'proximity_to_river_km': 1.5, # Average river proximity
    'rainfall_annual_mm': 500 # Average annual rainfall
}

# Load the ML model on application startup
MODEL = load_or_train_model('data/sample_flood_data.csv', app.config['MODEL_PATH'])

@app.route('/')
def index():
    """Renders the main map page."""
    return render_template('index.html')

@app.route('/predict_risk', methods=['POST'])
def predict_risk():
    """API endpoint to get flood risk prediction."""
    try:
        data = request.get_json()
        
        # Parse and validate inputs
        latitude = float(data.get('lat'))
        longitude = float(data.get('lon'))
        
        # Prepare features for the model
        # fetch your prefferes lat lon
        input_data = [
            latitude, 
            longitude, 
            FEATURE_DEFAULTS['elevation_m'], 
            FEATURE_DEFAULTS['proximity_to_river_km'], 
            FEATURE_DEFAULTS['rainfall_annual_mm']
        ]
        
        # Make prediction
        
        prediction = MODEL.predict([input_data])[0]
        
        # Ensure score is within 0-100 range and is an integer
        risk_score = int(np.clip(prediction, 0, 100))
        
        # Simple interpretation logic
        if risk_score >= 80:
            message = "Extremely High Risk: Immediate action is advised."
        elif risk_score >= 60:
            message = "High Risk: Vigilance and planning required."
        elif risk_score >= 40:
            message = "Moderate Risk: Monitor local advisories."
        else:
            message = "Low Risk: Generally safe, but be aware."

        return jsonify({
            'success': True,
            'latitude': latitude,
            'longitude': longitude,
            'risk_score': risk_score,
            'message': message
        })

    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid latitude or longitude provided.'}), 400
    except Exception as e:
       
        print(f"Prediction Error: {e}")
        return jsonify({'success': False, 'message': 'An internal error occurred during prediction.'}), 500

if __name__ == '__main__':
    app.run(debug=True)
