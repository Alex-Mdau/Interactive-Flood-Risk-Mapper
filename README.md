# Interactive Flood Risk Mapper

A web-based flood risk mapping tool with a Python ML backend and an interactive Leaflet frontend. Input location parameters, get a risk prediction, see it on a map.

**Live:** [interactive-flood-risk-mapper.vercel.app](https://interactive-flood-risk-mapper.vercel.app)

---

## What it does

Users enter location data (elevation, proximity to water bodies, soil type, rainfall index) through a web form. A scikit-learn model returns a flood risk score. The result is visualised on an interactive Leaflet map with colour-coded risk zones.

---

## Stack

**Backend**
- Python, Flask
- scikit-learn (Random Forest classifier)
- REST API returning GeoJSON risk zones

**Frontend**
- Leaflet.js — interactive map rendering
- HTML/CSS/JavaScript
- Fetch API — async calls to Flask backend

---

## Structure

```
Interactive-Flood-Risk-Mapper/
├── app.py              # Flask app and ML prediction endpoint
├── config.py           # App configuration
├── requirements.txt
├── static/             # CSS, JS
└── templates/          # HTML templates
```

---

## Running locally

```bash
git clone https://github.com/Alex-Mdau/Interactive-Flood-Risk-Mapper
cd Interactive-Flood-Risk-Mapper
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`

---

## Deployment

Deployed on Vercel. Backend runs as serverless functions, frontend served statically.

---

Built by [Alex Okumu](https://sites.google.com/view/okumugis) · Nairobi, Kenya
