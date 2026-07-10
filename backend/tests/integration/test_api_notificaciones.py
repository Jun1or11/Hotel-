class TestNotifications:
    def test_get_my_notifications_empty(self, client, guest_headers):
        response = client.get("/api/notificaciones/mis-notificaciones", headers=guest_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_mark_all_as_read_when_empty(self, client, guest_headers):
        response = client.put("/api/notificaciones/leer-todas", headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["updated"] == 0

    def test_clear_notifications(self, client, guest_headers):
        response = client.delete("/api/notificaciones/limpiar", headers=guest_headers)
        assert response.status_code == 200

    def test_admin_list_sent_notifications(self, client, admin_headers):
        response = client.get("/api/notificaciones/enviadas", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_admin_send_notification_to_single_user(self, client, admin_headers, test_guest):
        response = client.post("/api/notificaciones/enviar", json={
            "destinatario": "single",
            "usuario_id": test_guest.id,
            "plantilla": "custom",
            "mensaje": "Bienvenido al hotel"
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["sent"] == 1

    def test_admin_send_notification_to_all(self, client, admin_headers):
        response = client.post("/api/notificaciones/enviar", json={
            "destinatario": "all",
            "plantilla": "custom",
            "mensaje": "Aviso general"
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["sent"] >= 1

    def test_guest_cannot_send_notification(self, client, guest_headers):
        response = client.post("/api/notificaciones/enviar", json={
            "destinatario": "all",
            "plantilla": "custom",
            "mensaje": "Hack"
        }, headers=guest_headers)
        assert response.status_code == 403

    def test_mark_single_notification_as_read(self, client, admin_headers, guest_headers, test_guest):
        client.post("/api/notificaciones/enviar", json={
            "destinatario": "single",
            "usuario_id": test_guest.id,
            "plantilla": "custom",
            "mensaje": "Notificacion de prueba"
        }, headers=admin_headers)

        get = client.get("/api/notificaciones/mis-notificaciones", headers=guest_headers)
        assert get.status_code == 200
        notis = get.json()
        assert len(notis) >= 1

        response = client.put(f"/api/notificaciones/{notis[0]['id']}/leer", headers=guest_headers)
        assert response.status_code == 200
        assert response.json()["leida"] is True
