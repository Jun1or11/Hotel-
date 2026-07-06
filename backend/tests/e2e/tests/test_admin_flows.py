import pytest
from ..pages.login_page import LoginPage
from ..pages.admin.dashboard_page import DashboardPage
from ..pages.admin.rooms_management_page import RoomsManagementPage
from ..pages.admin.reservations_page import ReservationsPage
from ..pages.admin.users_page import UsersPage


class TestAdminFlows:
    @pytest.fixture(autouse=True)
    def login_admin(self, browser, frontend_url, admin_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=admin_credentials["email"],
            password=admin_credentials["password"],
        )
        login_page.wait_for_url("/admin", timeout=15)

    def test_dashboard_loads(self, browser, frontend_url):
        dashboard = DashboardPage(browser, frontend_url)
        dashboard.open_dashboard()
        import time
        time.sleep(2)
        kpi_texts = dashboard.get_kpi_texts()
        assert len(kpi_texts) >= 1
        combined = " ".join(kpi_texts)
        assert any(word in combined.lower() for word in ["habitacion", "ocup", "reserva", "ingreso", "total"])

    def test_create_room(self, browser, frontend_url):
        rooms_mgmt = RoomsManagementPage(browser, frontend_url)
        rooms_mgmt.open_management()
        import time
        time.sleep(1)
        initial_count = rooms_mgmt.get_room_count()
        import random, string
        room_num = "9" + "".join(random.choices(string.digits, k=3))
        rooms_mgmt.create_room(
            numero=room_num,
            tipo="Suite",
            capacidad=2,
            precio=250.00,
            descripcion="E2E test room",
        )
        time.sleep(2)
        new_count = rooms_mgmt.get_room_count()
        assert new_count == initial_count + 1

    def test_edit_room(self, browser, frontend_url):
        rooms_mgmt = RoomsManagementPage(browser, frontend_url)
        rooms_mgmt.open_management()
        import time
        time.sleep(1)
        rooms_mgmt.edit_first_room()
        time.sleep(1)
        rooms_mgmt.set_precio("999.99")
        rooms_mgmt.save_room()
        time.sleep(2)

    def test_delete_room(self, browser, frontend_url):
        rooms_mgmt = RoomsManagementPage(browser, frontend_url)
        rooms_mgmt.open_management()
        import time
        time.sleep(1)
        initial_count = rooms_mgmt.get_room_count()
        if initial_count > 1:
            rooms_mgmt.delete_first_room()
            time.sleep(2)
            new_count = rooms_mgmt.get_room_count()
            assert new_count < initial_count

    def test_manage_reservations(self, browser, frontend_url):
        reservations = ReservationsPage(browser, frontend_url)
        reservations.open_management()
        import time
        time.sleep(1)
        count = reservations.get_reservation_count()
        assert count > 0

    def test_users_list(self, browser, frontend_url):
        users = UsersPage(browser, frontend_url)
        users.open_management()
        import time
        time.sleep(1)
        count = users.get_user_count()
        assert count > 0
