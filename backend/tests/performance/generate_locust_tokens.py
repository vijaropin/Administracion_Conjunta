#!/usr/bin/env python
from __future__ import annotations

import argparse
import csv
import json
import os
import random
import sys
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CSV_PATH = REPO_ROOT / "QA_CREDENCIALES_262_CASAS.csv"
DEFAULT_TOKENS_PATH = REPO_ROOT / "backend" / "tests" / "performance" / "tokens" / "locust_tokens.txt"
DEFAULT_ENV_HINT_PATH = REPO_ROOT / "backend" / "tests" / "performance" / "tokens" / "locust_tokens.env"
DEFAULT_JSON_REPORT_PATH = REPO_ROOT / "backend" / "tests" / "performance" / "tokens" / "token_report.json"
SIGN_IN_URL_TEMPLATE = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"


@dataclass
class Profile:
    key: str
    tipo: str
    email: str
    password: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera tokens Firebase desde QA_CREDENCIALES_262_CASAS.csv para Locust."
    )
    parser.add_argument(
        "--api-key",
        default=os.getenv("FIREBASE_WEB_API_KEY", ""),
        help="Firebase Web API Key (también por FIREBASE_WEB_API_KEY).",
    )
    parser.add_argument(
        "--csv",
        default=str(DEFAULT_CSV_PATH),
        help="Ruta al CSV de credenciales QA.",
    )
    parser.add_argument(
        "--roles",
        default="",
        help="Tipos de usuario separados por coma (ej: residente,administrador). Vacío = todos.",
    )
    parser.add_argument(
        "--max-users",
        type=int,
        default=120,
        help="Máximo de credenciales para generar tokens.",
    )
    parser.add_argument(
        "--random-sample",
        action="store_true",
        help="Usar muestra aleatoria en lugar de primeras filas.",
    )
    parser.add_argument(
        "--default-password",
        default=os.getenv("QA_DEFAULT_PASSWORD", "AdminConjunta#2026"),
        help="Clave fallback cuando la fila no trae password.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=20,
        help="Autenticaciones concurrentes.",
    )
    parser.add_argument(
        "--request-timeout",
        type=float,
        default=25.0,
        help="Timeout por autenticación (segundos).",
    )
    parser.add_argument(
        "--tokens-out",
        default=str(DEFAULT_TOKENS_PATH),
        help="Archivo de salida (1 token por línea).",
    )
    parser.add_argument(
        "--env-out",
        default=str(DEFAULT_ENV_HINT_PATH),
        help="Archivo .env de ayuda con LOCUST_TOKENS_FILE y LOCUST_AUTH_REQUIRED.",
    )
    parser.add_argument(
        "--json-report",
        default=str(DEFAULT_JSON_REPORT_PATH),
        help="Reporte JSON con éxito/fallo por usuario.",
    )
    return parser.parse_args()


def load_profiles(csv_path: Path, roles: set[str], max_users: int, random_sample: bool, default_password: str) -> list[Profile]:
    if not csv_path.exists():
        raise FileNotFoundError(f"No existe el CSV de credenciales: {csv_path}")

    profiles: list[Profile] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            tipo = (row.get("tipo") or "").strip()
            email = (row.get("email") or "").strip()
            if not email or not tipo:
                continue
            if roles and tipo not in roles:
                continue

            password = (row.get("password") or "").strip() or default_password
            profiles.append(
                Profile(
                    key=(row.get("key") or "").strip(),
                    tipo=tipo,
                    email=email,
                    password=password,
                )
            )

    if random_sample and len(profiles) > max_users:
        profiles = random.sample(profiles, max_users)
    else:
        profiles = profiles[:max_users]

    return profiles


def _safe_json(value: str) -> dict:
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def authenticate_profile(sign_in_url: str, profile: Profile, timeout: float) -> dict:
    payload = json.dumps(
        {
            "email": profile.email,
            "password": profile.password,
            "returnSecureToken": True,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        sign_in_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            data = _safe_json(body)
            token = str(data.get("idToken", "")).strip()
            if token:
                return {
                    "ok": True,
                    "key": profile.key,
                    "tipo": profile.tipo,
                    "email": profile.email,
                    "token": token,
                }
            return {
                "ok": False,
                "key": profile.key,
                "tipo": profile.tipo,
                "email": profile.email,
                "error": "Firebase no devolvió idToken",
            }
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        parsed = _safe_json(body)
        message = str(parsed.get("error", {}).get("message", "")).strip()
        return {
            "ok": False,
            "key": profile.key,
            "tipo": profile.tipo,
            "email": profile.email,
            "error": f"HTTP {error.code} {message}".strip(),
        }
    except Exception as error:  # pragma: no cover - depende de red externa
        return {
            "ok": False,
            "key": profile.key,
            "tipo": profile.tipo,
            "email": profile.email,
            "error": str(error),
        }


def generate_tokens(profiles: list[Profile], api_key: str, concurrency: int, timeout: float) -> list[dict]:
    sign_in_url = SIGN_IN_URL_TEMPLATE.format(api_key=api_key)
    max_workers = max(1, min(concurrency, len(profiles)))
    results: list[dict] = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(authenticate_profile, sign_in_url, profile, timeout): profile
            for profile in profiles
        }
        for future in as_completed(futures):
            results.append(future.result())

    results.sort(key=lambda row: (row.get("tipo", ""), row.get("email", "")))
    return results


def write_outputs(results: list[dict], tokens_out: Path, env_out: Path, json_report: Path) -> tuple[int, int]:
    ok_rows = [row for row in results if row.get("ok")]
    fail_rows = [row for row in results if not row.get("ok")]
    tokens = [str(row["token"]) for row in ok_rows]

    tokens_out.parent.mkdir(parents=True, exist_ok=True)
    env_out.parent.mkdir(parents=True, exist_ok=True)
    json_report.parent.mkdir(parents=True, exist_ok=True)

    tokens_out.write_text("\n".join(tokens) + ("\n" if tokens else ""), encoding="utf-8")
    env_out.write_text(
        "\n".join(
            [
                f'LOCUST_TOKENS_FILE="{tokens_out.as_posix()}"',
                "LOCUST_AUTH_REQUIRED=true",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    json_report.write_text(
        json.dumps(
            {
                "total_profiles": len(results),
                "success": len(ok_rows),
                "failed": len(fail_rows),
                "tokens_file": str(tokens_out),
                "env_file": str(env_out),
                "results": results,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    return len(ok_rows), len(fail_rows)


def print_summary(profiles: list[Profile], results: list[dict], tokens_out: Path, env_out: Path, json_report: Path) -> None:
    ok_rows = [row for row in results if row.get("ok")]
    fail_rows = [row for row in results if not row.get("ok")]
    roles_count = Counter(profile.tipo for profile in profiles)

    print(f"Perfiles seleccionados: {len(profiles)}")
    for role, count in sorted(roles_count.items()):
        print(f"  - {role}: {count}")

    print(f"Tokens generados: {len(ok_rows)}")
    print(f"Fallidos: {len(fail_rows)}")
    print(f"Archivo de tokens: {tokens_out}")
    print(f"Archivo env helper: {env_out}")
    print(f"Reporte JSON: {json_report}")

    print("\nPowerShell (copiar/pegar):")
    print(f'$env:LOCUST_TOKENS_FILE="{tokens_out}"')
    print('$env:LOCUST_AUTH_REQUIRED="true"')

    if fail_rows:
        print("\nPrimeros errores:")
        for row in fail_rows[:10]:
            print(f"  - {row.get('email')}: {row.get('error')}")


def main() -> int:
    args = parse_args()
    api_key = (args.api_key or "").strip()
    if not api_key:
        print(
            "Falta FIREBASE_WEB_API_KEY. "
            "Use --api-key o configure la variable de entorno FIREBASE_WEB_API_KEY.",
            file=sys.stderr,
        )
        return 2

    roles = {value.strip() for value in str(args.roles).split(",") if value.strip()}
    csv_path = Path(args.csv).resolve()
    tokens_out = Path(args.tokens_out).resolve()
    env_out = Path(args.env_out).resolve()
    json_report = Path(args.json_report).resolve()

    try:
        profiles = load_profiles(
            csv_path=csv_path,
            roles=roles,
            max_users=max(1, int(args.max_users)),
            random_sample=bool(args.random_sample),
            default_password=str(args.default_password),
        )
    except Exception as error:
        print(f"Error cargando perfiles: {error}", file=sys.stderr)
        return 2

    if not profiles:
        print("No hay perfiles seleccionados para generar tokens.", file=sys.stderr)
        return 2

    results = generate_tokens(
        profiles=profiles,
        api_key=api_key,
        concurrency=max(1, int(args.concurrency)),
        timeout=float(args.request_timeout),
    )

    success_count, fail_count = write_outputs(
        results=results,
        tokens_out=tokens_out,
        env_out=env_out,
        json_report=json_report,
    )
    print_summary(
        profiles=profiles,
        results=results,
        tokens_out=tokens_out,
        env_out=env_out,
        json_report=json_report,
    )
    return 0 if success_count > 0 and fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

