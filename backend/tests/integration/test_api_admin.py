class TestDashboard:
    def test_admin_get_stats(self, client, admin_headers):
        response = client.get("/api/dashboard/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_habitaciones" in data
        assert "ocupadas_hoy" in data
        assert "reservas_pendientes" in data
        assert "ingresos_mes" in data

    def test_guest_cannot_get_stats(self, client, guest_headers):
        response = client.get("/api/dashboard/stats", headers=guest_headers)
        assert response.status_code == 403

    def test_unauthorized_get_stats(self, client):
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 401

    def test_popular_rooms(self, client, admin_headers):
        response = client.get("/api/dashboard/habitaciones-populares", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_reviews_dashboard(self, client, admin_headers):
        response = client.get("/api/dashboard/resenas", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "promedio_puntuacion" in data
        assert "total_resenas" in data
        assert "recientes" in data


class TestUsers:
    def test_admin_list_users(self, client, admin_headers):
        response = client.get("/api/usuarios", headers=admin_headers)
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 1

    def test_guest_cannot_list_users(self, client, guest_headers):
        response = client.get("/api/usuarios", headers=guest_headers)
        assert response.status_code == 403

    def test_admin_get_user_by_id(self, client, admin_headers, test_guest):
        response = client.get(f"/api/usuarios/{test_guest.id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "guest.integration@gmail.com"

    def test_admin_get_nonexistent_user(self, client, admin_headers):
        response = client.get("/api/usuarios/9999", headers=admin_headers)
        assert response.status_code == 404

    def test_admin_delete_user(self, client, admin_headers):
        create = client.post("/api/auth/register", json={
            "dni": "11111111", "nombre": "To Delete",
            "email": "todelete@gmail.com", "password": "Junior11"
        })
        user_id = create.json()["id"]

        response = client.delete(f"/api/usuarios/{user_id}", headers=admin_headers)
        assert response.status_code == 200


class TestPayments:
    def test_admin_list_payments(self, client, admin_headers):
        response = client.get("/api/pagos", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_guest_cannot_list_payments(self, client, guest_headers):
        response = client.get("/api/pagos", headers=guest_headers)
        assert response.status_code == 403

    def test_admin_monthly_summary(self, client, admin_headers):
        response = client.get("/api/pagos/resumen/mes-actual", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "cantidad_pagos_aprobados" in data
        assert "total_aprobado" in data

    def test_my_payments(self, client, guest_headers):
        response = client.get("/api/pagos/mis-pagos", headers=guest_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
