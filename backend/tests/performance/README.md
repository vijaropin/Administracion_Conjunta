# Pruebas de carga (Locust)

Este directorio permite generar evidencia tipo pantallazo de:

- usuarios concurrentes,
- throughput (RPS),
- tiempos de respuesta (avg, p95),
- estabilidad (fail ratio y umbrales SLO).

## 1) Instalación rápida

Desde `backend/`:

```bash
pip install -e ".[dev,performance]"
```

## 2) Configuración mínima

Variables opcionales:

- `LOCUST_TOKENS`: lista de tokens Firebase separada por coma.
- `LOCUST_TOKENS_FILE`: ruta a archivo con 1 token por línea (recomendado).
- `LOCUST_AUTH_REQUIRED=true`: obliga a usar tokens.
- `LOCUST_MAX_FAIL_RATIO` (default `0.05`)
- `LOCUST_MAX_P95_MS` (default `2500`)
- `LOCUST_MAX_AVG_MS` (default `1200`)

### 2.1) Generar tokens automáticamente desde QA_CREDENCIALES_262_CASAS.csv

Usa el script:

```bash
python tests/performance/generate_locust_tokens.py --api-key TU_FIREBASE_WEB_API_KEY --max-users 120
```

Por defecto genera:

- `tests/performance/tokens/locust_tokens.txt`
- `tests/performance/tokens/locust_tokens.env`
- `tests/performance/tokens/token_report.json`

PowerShell (si quieres definir variables manualmente):

```powershell
$env:LOCUST_TOKENS_FILE="D:\Projects\Administracion Conjunta\backend\tests\performance\tokens\locust_tokens.txt"
$env:LOCUST_AUTH_REQUIRED="true"
```

Si no define tokens, Locust probará solo `/health` y `/api/v1/health`.

## 3) Ejecución con UI (recomendado para pantallazo)

```bash
locust -f tests/performance/locustfile.py --host http://localhost:8000
```

Abra `http://localhost:8089` y configure por ejemplo:

- `Number of users`: `100`
- `Spawn rate`: `10`
- Duración sugerida: `5-10` minutos

Pantallazo recomendado:

- panel principal con usuarios concurrentes activos,
- gráfica de response times,
- porcentaje de fallos.
- tabla de requests con `Avg`, `95%ile` y `# Fails`.

## 4) Ejecución headless + reporte HTML/CSV

```bash
locust -f tests/performance/locustfile.py --host http://localhost:8000 --headless --users 120 --spawn-rate 12 --run-time 8m --html tests/performance/reports/locust-report.html --csv tests/performance/reports/locust
```

Archivos generados:

- `tests/performance/reports/locust-report.html`
- `tests/performance/reports/locust_stats.csv`
- `tests/performance/reports/locust_failures.csv`

## 5) Interpretación de estabilidad

El `locustfile.py` marca salida con código `1` cuando no cumple umbrales:

- `fail_ratio > LOCUST_MAX_FAIL_RATIO`
- `p95 > LOCUST_MAX_P95_MS`
- `avg > LOCUST_MAX_AVG_MS`

Esto permite usar la prueba en CI/CD para validar estabilidad básica.
