import os
import random
from typing import Iterable

from locust import HttpUser, between, events, task
from locust.runners import LocalRunner, MasterRunner


def parse_tokens(raw: str) -> list[str]:
    return [token.strip() for token in raw.split(",") if token.strip()]


def parse_tokens_file(path: str) -> list[str]:
    if not path:
        return []
    if not os.path.exists(path):
        print(f"[locust] LOCUST_TOKENS_FILE no encontrado: {path}")
        return []

    with open(path, encoding="utf-8") as file:
        rows = [line.strip() for line in file.readlines()]

    return [row for row in rows if row and not row.startswith("#")]


TOKENS = parse_tokens(os.getenv("LOCUST_TOKENS", ""))
TOKENS += parse_tokens_file(os.getenv("LOCUST_TOKENS_FILE", ""))
TOKENS = list(dict.fromkeys(TOKENS))
AUTH_REQUIRED = os.getenv("LOCUST_AUTH_REQUIRED", "false").lower() == "true"

WAIT_MIN_SECONDS = float(os.getenv("LOCUST_WAIT_MIN_SECONDS", "0.5"))
WAIT_MAX_SECONDS = float(os.getenv("LOCUST_WAIT_MAX_SECONDS", "2.0"))

MAX_FAIL_RATIO = float(os.getenv("LOCUST_MAX_FAIL_RATIO", "0.05"))
MAX_P95_MS = float(os.getenv("LOCUST_MAX_P95_MS", "2500"))
MAX_AVG_MS = float(os.getenv("LOCUST_MAX_AVG_MS", "1200"))


def _mark_expected(response, expected_statuses: Iterable[int], failure_message: str) -> None:
    if response.status_code in expected_statuses:
        response.success()
    else:
        response.failure(f"{failure_message}. status={response.status_code}")


class AdminConjuntaUser(HttpUser):
    wait_time = between(WAIT_MIN_SECONDS, WAIT_MAX_SECONDS)

    def on_start(self) -> None:
        if TOKENS:
            token = random.choice(TOKENS)
            self.auth_headers = {"Authorization": f"Bearer {token}"}
            self.auth_enabled = True
            return

        self.auth_headers = {}
        self.auth_enabled = False

    @task(4)
    def health_publica(self) -> None:
        with self.client.get("/health", name="GET /health", catch_response=True) as response:
            _mark_expected(response, {200}, "Health pública falló")

    @task(4)
    def health_api(self) -> None:
        with self.client.get("/api/v1/health", name="GET /api/v1/health", catch_response=True) as response:
            _mark_expected(response, {200}, "Health API falló")

    @task(3)
    def auth_me(self) -> None:
        if not self.auth_enabled:
            return
        with self.client.get(
            "/api/v1/auth/me",
            headers=self.auth_headers,
            name="GET /api/v1/auth/me",
            catch_response=True,
        ) as response:
            _mark_expected(response, {200}, "Auth/me falló")

    @task(3)
    def pagos_list(self) -> None:
        if not self.auth_enabled:
            return
        with self.client.get(
            "/api/v1/pagos?limit=20",
            headers=self.auth_headers,
            name="GET /api/v1/pagos",
            catch_response=True,
        ) as response:
            _mark_expected(response, {200}, "Listado de pagos falló")

    @task(2)
    def pagos_filtrados(self) -> None:
        if not self.auth_enabled:
            return
        with self.client.get(
            "/api/v1/pagos?estado=pendiente&limit=20",
            headers=self.auth_headers,
            name="GET /api/v1/pagos?estado=pendiente",
            catch_response=True,
        ) as response:
            _mark_expected(response, {200}, "Filtro de pagos falló")


@events.test_start.add_listener
def on_test_start(environment, **_kwargs) -> None:
    if AUTH_REQUIRED and not TOKENS:
        raise RuntimeError(
            "LOCUST_AUTH_REQUIRED=true pero no hay tokens en LOCUST_TOKENS/LOCUST_TOKENS_FILE. "
            "Configure al menos un token Bearer Firebase."
        )

    mode = "autenticado" if TOKENS else "solo salud (sin token)"
    print(f"[locust] Iniciando prueba en modo: {mode}")
    print(
        "[locust] Umbrales de estabilidad -> "
        f"fail_ratio<={MAX_FAIL_RATIO}, p95<={MAX_P95_MS}ms, avg<={MAX_AVG_MS}ms"
    )


@events.quitting.add_listener
def on_quitting(environment, **_kwargs) -> None:
    if not isinstance(environment.runner, (MasterRunner, LocalRunner)):
        return

    stats = environment.stats.total
    fail_ratio = float(stats.fail_ratio or 0.0)
    p95 = float(stats.get_response_time_percentile(0.95) or 0.0)
    avg = float(stats.avg_response_time or 0.0)

    meets_slo = fail_ratio <= MAX_FAIL_RATIO and p95 <= MAX_P95_MS and avg <= MAX_AVG_MS
    if meets_slo:
        environment.process_exit_code = 0
        print(
            "[locust] ESTABLE: "
            f"fail_ratio={fail_ratio:.4f}, p95={p95:.1f}ms, avg={avg:.1f}ms"
        )
        return

    environment.process_exit_code = 1
    print(
        "[locust] INESTABLE: "
        f"fail_ratio={fail_ratio:.4f}, p95={p95:.1f}ms, avg={avg:.1f}ms"
    )
