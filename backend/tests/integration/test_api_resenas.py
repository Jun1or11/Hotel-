class TestResenas:
    def test_create_review(self, client, guest_headers):
        response = client.post("/api/resenas", json={
            "puntuacion": 5,
            "comentario": "Excelente hotel"
        }, headers=guest_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["puntuacion"] == 5
        assert data["comentario"] == "Excelente hotel"

    def test_get_my_review(self, client, guest_headers):
        client.post("/api/resenas", json={
            "puntuacion": 4,
            "comentario": "Muy bueno"
        }, headers=guest_headers)

        response = client.get("/api/resenas/mi-resena", headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["puntuacion"] == 4

    def test_get_my_review_not_found(self, client, guest_headers):
        response = client.get("/api/resenas/mi-resena", headers=guest_headers)
        assert response.status_code == 404

    def test_update_review(self, client, guest_headers):
        client.post("/api/resenas", json={
            "puntuacion": 3,
            "comentario": "Regular"
        }, headers=guest_headers)

        response = client.post("/api/resenas", json={
            "puntuacion": 4,
            "comentario": "Mejoró"
        }, headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["puntuacion"] == 4
        assert response.json()["comentario"] == "Mejoró"

    def test_unauthorized_create_review(self, client):
        response = client.post("/api/resenas", json={
            "puntuacion": 5,
            "comentario": "Bueno"
        })
        assert response.status_code == 401
