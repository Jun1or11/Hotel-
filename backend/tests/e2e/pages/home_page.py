from selenium.webdriver.common.by import By
from .base_page import BasePage


class HomePage(BasePage):
    ROOM_CARDS = (By.CSS_SELECTOR, "[class*='RoomCard']")
    RESERVAR_BUTTON = (By.XPATH, "//a[contains(text(), 'Ir a reservar')]")
    NAV_LINKS = (By.CSS_SELECTOR, "nav a")
    USER_AVATAR = (By.CSS_SELECTOR, "button[name='user-menu']")
    LOGOUT_BUTTON = (By.XPATH, "//button[contains(text(), 'Cerrar sesión')]")
    USER_NAME_DISPLAY = (By.CSS_SELECTOR, "[class*='user-name'], [class*='user-info']")

    def open_home(self):
        self.open("/")
        return self

    def get_room_card_count(self):
        return len(self.finds(*self.ROOM_CARDS))

    def click_reservar(self):
        self.click(*self.RESERVAR_BUTTON)
        return self

    def logout(self):
        self.click(*self.USER_AVATAR)
        self.click(*self.LOGOUT_BUTTON)
        return self
