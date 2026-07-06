import pytest
from ..pages.login_page import LoginPage
from ..pages.rooms_page import RoomsPage
from ..pages.my_reservations_page import MyReservationsPage


class TestBookingFlow:
    @pytest.fixture(autouse=True)
    def login_guest(self, browser, frontend_url, guest_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=guest_credentials["email"],
            password=guest_credentials["password"],
        )
        login_page.wait_for_url("/habitaciones", timeout=15)

    def test_browse_and_filter_rooms(self, browser, frontend_url):
        rooms_page = RoomsPage(browser, frontend_url)
        rooms_page.open_rooms()
        initial_count = rooms_page.get_visible_room_count()
        assert initial_count > 0
        rooms_page.filter_by_tipo("Suite")
        import time
        time.sleep(1)
        filtered_count = rooms_page.get_visible_room_count()
        assert filtered_count <= initial_count

    def test_create_reservation(self, browser, frontend_url):
        rooms_page = RoomsPage(browser, frontend_url)
        rooms_page.open_rooms()
        rooms_page.click_reservar_first()
        import time
        time.sleep(2)
        rooms_page.select_dates_in_calendar()
        rooms_page.fill_booking_form(num_huespedes="2", solicitudes="E2E test reservation")
        rooms_page.confirm_booking()

        reservas_page = MyReservationsPage(browser, frontend_url)
        reservas_page.open_mis_reservas()
        import time
        time.sleep(2)
        count = reservas_page.get_reservation_count()
        assert count > 0

    def test_cancel_pending_reservation(self, browser, frontend_url):
        reservas_page = MyReservationsPage(browser, frontend_url)
        reservas_page.open_mis_reservas()
        import time
        time.sleep(1)
        if reservas_page.has_cancel_button():
            reservas_page.cancel_first_reservation()
            time.sleep(2)
