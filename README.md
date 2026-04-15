## 🚀 Ejecución del Proyecto

```bash
# Backend (primera vez o cuando cambies dependencias)
cd backend
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
python -m app.seed_data
uvicorn app.main:app --reload --port 8000

# Frontend (primera vez o cuando cambies dependencias)
cd frontend
npm install
npm run dev

# Credenciales
Email: admin1@hotelnova.com
Password: Promocion135
```