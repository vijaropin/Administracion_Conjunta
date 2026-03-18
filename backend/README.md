# Backend Python

Este backend es la base de migracion a produccion para `Administracion Conjunta`.

## Objetivo

- Mantener el frontend actual en React/Vite.
- Mover logica sensible, auditoria, integraciones y validaciones a Python.
- Reducir dependencia de logica directa en el cliente.

## Stack

- FastAPI
- Pydantic Settings
- Firebase Admin SDK

## Estructura

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── health.py
│   │   │   └── pagos.py
│   │   └── router.py
│   ├── core/
│   │   ├── config.py
│   │   └── firebase_admin.py
│   ├── schemas/
│   ├── services/
│   └── main.py
├── .env.example
├── Dockerfile
└── pyproject.toml
```

## Ejecucion local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload
```

## Endpoints iniciales

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/auth/me`
- `GET /api/v1/pagos`

## Paso a paso de la fase 2

1. El cliente envia el token Firebase en `Authorization: Bearer <token>`.
2. El backend valida el token con Firebase Admin.
3. El backend carga `usuarios/{uid}` para conocer `tipo`, `conjuntoId` y estado del usuario.
4. El endpoint de pagos filtra por `conjuntoId` y aplica alcance por rol.
5. Un `residente` solo ve sus pagos; `administrador`, `consejo` y `contadora` ven pagos del conjunto.

## Ejemplo rapido de prueba

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer TU_TOKEN_FIREBASE"
```

```bash
curl "http://localhost:8000/api/v1/pagos?limit=20" \
  -H "Authorization: Bearer TU_TOKEN_FIREBASE"
```
