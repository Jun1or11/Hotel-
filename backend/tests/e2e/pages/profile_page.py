import time
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ProfilePage(BasePage):
    NOMBRE_INPUT = (By.CSS_SELECTOR, "input[name='nombre'], input[name='name']")
    DNI_INPUT = (By.CSS_SELECTOR, "input[name='dni']")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[name='email']")
    SAVE_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, "[data-testid='profile-message']")

    def open_profile(self):
        self.open("/mi-perfil")
        self.find(*self.NOMBRE_INPUT, timeout=10)
        time.sleep(1.5)
        return self

    def update_name(self, new_name):
        time.sleep(1)
        self.type(*self.NOMBRE_INPUT, new_name)
        time.sleep(1)
        self.click(*self.SAVE_BUTTON)
        self.is_visible(*self.SUCCESS_MESSAGE, timeout=10)
        time.sleep(1.5)
        return self

    def get_name_value(self):
        return self.find(*self.NOMBRE_INPUT).get_attribute("value")

    def is_success_visible(self):
        return self.is_visible(*self.SUCCESS_MESSAGE)
