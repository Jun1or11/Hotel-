from decimal import Decimal


class TestListHabitaciones:
    def test_list_all(self, client):
        response = client.get("/api/habitaciones")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_empty(self, client):
        response = client.get("/api/habitaciones")
        assert len(response.json()) == 0


class TestCreateHabitacion:
    def test_admin_create_room(self, client, admin_headers):
        response = client.post("/api/habitaciones", json={
            "numero": "101",
            "tipo": "estandar",
            "capacidad": 2,
            "precio_noche": 150.00,
            "descripcion": "Habitacion test"
        }, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["numero"] == "101"
        assert data["tipo"] == "estandar"
        assert data["estado"] == "libre"

    def test_guest_cannot_create_room(self, client, guest_headers):
        response = client.post("/api/habitaciones", json={
            "numero": "102",
            "tipo": "suite",
            "capacidad": 4,
            "precio_noche": 300.00
        }, headers=guest_headers)
        assert response.status_code == 403

    def test_unauthorized_cannot_create_room(self, client):
        response = client.post("/api/habitaciones", json={
            "numero": "103",
            "tipo": "suite",
            "capacidad": 4,
            "precio_noche": 300.00
        })
        assert response.status_code == 401


class TestGetHabitacion:
    def test_get_by_id(self, client, admin_headers):
        create = client.post("/api/habitaciones", json={
            "numero": "201", "tipo": "familiar",
            "capacidad": 4, "precio_noche": 200.00
        }, headers=admin_headers)
        room_id = create.json()["id"]

        response = client.get(f"/api/habitaciones/{room_id}")
        assert response.status_code == 200
        assert response.json()["numero"] == "201"

    def test_get_nonexistent(self, client):
        response = client.get("/api/habitaciones/9999")
        assert response.status_code == 404


class TestUpdateHabitacion:
    def test_admin_update_price(self, client, admin_headers):
        create = client.post("/api/habitaciones", json={
            "numero": "301", "tipo": "matrimonial",
            "capacidad": 2, "precio_noche": 120.00
        }, headers=admin_headers)
        room_id = create.json()["id"]

        response = client.put(f"/api/habitaciones/{room_id}", json={
            "precio_noche": 180.00
        }, headers=admin_headers)
        assert response.status_code == 200
        assert float(response.json()["precio_noche"]) == 180.00


class TestDeleteHabitacion:
    def test_admin_delete_room(self, client, admin_headers):
        create = client.post("/api/habitaciones", json={
            "numero": "401", "tipo": "estandar",
            "capacidad": 2, "precio_noche": 100.00
        }, headers=admin_headers)
        room_id = create.json()["id"]

        response = client.delete(f"/api/habitaciones/{room_id}", headers=admin_headers)
        assert response.status_code == 200

        get = client.get(f"/api/habitaciones/{room_id}")
        assert get.status_code == 404


class TestFilterHabitaciones:
    def test_filter_by_tipo(self, client, admin_headers):
        client.post("/api/habitaciones", json={
            "numero": "501", "tipo": "estandar",
            "capacidad": 2, "precio_noche": 100.00
        }, headers=admin_headers)
        client.post("/api/habitaciones", json={
            "numero": "502", "tipo": "suite",
            "capacidad": 4, "precio_noche": 300.00
        }, headers=admin_headers)

        response = client.get("/api/habitaciones?tipo=suite")
        assert response.status_code == 200
        rooms = response.json()
        assert all(r["tipo"] == "suite" for r in rooms)
