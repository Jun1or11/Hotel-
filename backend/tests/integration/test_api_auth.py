import pytest


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/api/auth/register", json={
            "dni": "43678840",
            "nombre": "Test User",
            "email": "new.user@gmail.com",
            "password": "Junior11"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new.user@gmail.com"
        assert data["rol"] == "huesped"
        assert data["activo"] is True

    def test_register_duplicate_email(self, client, test_guest):
        response = client.post("/api/auth/register", json={
            "dni": "43678841",
            "nombre": "Duplicate",
            "email": "guest.integration@gmail.com",
            "password": "Junior11"
        })
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()

    def test_register_invalid_email_domain(self, client):
        response = client.post("/api/auth/register", json={
            "dni": "43678840",
            "nombre": "Test",
            "email": "test@hotmail.com",
            "password": "Junior11"
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, test_guest):
        response = client.post("/api/auth/login", json={
            "email": "guest.integration@gmail.com",
            "password": "Guest11"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "guest.integration@gmail.com"

    def test_login_invalid_password(self, client, test_guest):
        response = client.post("/api/auth/login", json={
            "email": "guest.integration@gmail.com",
            "password": "WrongPass1"
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/auth/login", json={
            "email": "nobody@gmail.com",
            "password": "SomePass1"
        })
        assert response.status_code == 401


class TestMe:
    def test_get_me_authenticated(self, client, guest_headers):
        response = client.get("/api/auth/me", headers=guest_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "guest.integration@gmail.com"

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401


class TestUpdateMe:
    def test_update_name(self, client, guest_headers):
        response = client.put("/api/auth/me", json={
            "nombre": "Updated Name"
        }, headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["nombre"] == "Updated Name"

    def test_update_unauthorized(self, client):
        response = client.put("/api/auth/me", json={"nombre": "Hacker"})
        assert response.status_code == 401
