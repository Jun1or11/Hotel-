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

## Backend en Render + PostgreSQL

- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables mínimas en Render:
	- `DATABASE_URL` (la URL de PostgreSQL de Render)
	- `FRONTEND_URL` (tu dominio de Vercel)
	- `SECRET_KEY`
