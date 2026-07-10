import pytest
from ..pages.login_page import LoginPage
from ..pages.home_page import HomePage
from ..pages.profile_page import ProfilePage


class TestAuth:
    def test_register_new_user(self, browser, frontend_url, new_user_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.register_with_lookup(
            dni=new_user_credentials["dni"],
            email=new_user_credentials["email"],
            password=new_user_credentials["password"],
        )
        assert login_page.wait_for_url("/", timeout=5) or \
               login_page.wait_for_url("/habitaciones", timeout=10)

    def test_login_admin(self, browser, frontend_url, admin_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=admin_credentials["email"],
            password=admin_credentials["password"],
        )
        assert login_page.wait_for_url("/admin/dashboard", timeout=15) or \
               login_page.wait_for_url("/admin", timeout=5)

    def test_login_guest(self, browser, frontend_url, guest_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=guest_credentials["email"],
            password=guest_credentials["password"],
        )
        assert login_page.wait_for_url("/", timeout=5) or \
               login_page.wait_for_url("/habitaciones", timeout=10)

    def test_logout(self, browser, frontend_url, guest_credentials):
        import time
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=guest_credentials["email"],
            password=guest_credentials["password"],
        )
        time.sleep(1.5)
        home_page = HomePage(browser, frontend_url)
        time.sleep(1)
        home_page.click(*home_page.USER_AVATAR)
        time.sleep(1.5)
        home_page.click(*home_page.LOGOUT_BUTTON)
        time.sleep(2)
        assert login_page.wait_for_url("/login", timeout=10)

    def test_update_profile(self, browser, frontend_url, guest_credentials):
        login_page = LoginPage(browser, frontend_url)
        login_page.login(
            email=guest_credentials["email"],
            password=guest_credentials["password"],
        )
        import time
        time.sleep(1.5)
        profile_page = ProfilePage(browser, frontend_url)
        profile_page.open_profile()
        new_name = "Ana Updated"
        profile_page.update_name(new_name)
        assert profile_page.is_success_visible()
        profile_page.open_profile()
        current_name = profile_page.get_name_value()
        assert current_name == new_name
        profile_page.update_name("Ana Torres Ramirez")
