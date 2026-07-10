import pytest


@pytest.fixture
def room_id(client, admin_headers):
    response = client.post("/api/habitaciones", json={
        "numero": "R1", "tipo": "estandar",
        "capacidad": 2, "precio_noche": 100.00
    }, headers=admin_headers)
    return response.json()["id"]


class TestCreateReserva:
    def test_create_success(self, client, guest_headers, room_id):
        response = client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-01",
            "fecha_checkout": "2026-12-03",
            "num_huespedes": 2
        }, headers=guest_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["habitacion_id"] == room_id
        assert data["estado"] == "pendiente"
        assert float(data["total"]) == 200.00

    def test_create_overlap_raises(self, client, guest_headers, room_id):
        client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-10",
            "fecha_checkout": "2026-12-15",
            "num_huespedes": 2
        }, headers=guest_headers)

        response = client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-12",
            "fecha_checkout": "2026-12-18",
            "num_huespedes": 2
        }, headers=guest_headers)
        assert response.status_code == 400
        assert "no disponible" in response.json()["detail"].lower()

    def test_create_unauthorized(self, client, room_id):
        response = client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-01",
            "fecha_checkout": "2026-12-03",
            "num_huespedes": 2
        })
        assert response.status_code == 401


class TestCancelReserva:
    def test_cancel_own_reservation(self, client, guest_headers, room_id):
        create = client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-20",
            "fecha_checkout": "2026-12-22",
            "num_huespedes": 2
        }, headers=guest_headers)
        reserva_id = create.json()["id"]

        response = client.put(f"/api/reservas/{reserva_id}/cancelar", headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["estado"] == "cancelado"

    def test_cancel_others_reservation_forbidden(self, client, guest_headers, admin_headers, db_session, room_id):
        from app.schemas.usuario import UsuarioCreate
        from app.crud.usuario import create_user
        other = create_user(db_session, UsuarioCreate(
            dni="99999999", nombre="Other",
            email="other.guest@gmail.com", password="Other11"
        ))
        from app.core.security import create_access_token
        from datetime import timedelta
        other_token = create_access_token(
            data={"sub": str(other.id), "email": other.email, "rol": "huesped"},
            expires_delta=timedelta(hours=1)
        )
        other_headers = {"Authorization": f"Bearer {other_token}"}

        create = client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-25",
            "fecha_checkout": "2026-12-27",
            "num_huespedes": 2
        }, headers=guest_headers)
        reserva_id = create.json()["id"]

        response = client.put(f"/api/reservas/{reserva_id}/cancelar", headers=other_headers)
        assert response.status_code == 403


class TestGetReservas:
    def test_get_my_reservas(self, client, guest_headers, room_id):
        client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-01",
            "fecha_checkout": "2026-12-03",
            "num_huespedes": 2
        }, headers=guest_headers)

        response = client.get("/api/reservas/mis-reservas", headers=guest_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_admin_list_all(self, client, admin_headers, guest_headers, room_id):
        client.post("/api/reservas", json={
            "habitacion_id": room_id,
            "fecha_checkin": "2026-12-05",
            "fecha_checkout": "2026-12-07",
            "num_huespedes": 2
        }, headers=guest_headers)

        response = client.get("/api/reservas", headers=admin_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_guest_cannot_list_all(self, client, guest_headers):
        response = client.get("/api/reservas", headers=guest_headers)
        assert response.status_code == 403
