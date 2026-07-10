import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from .base_page import BasePage


class LoginPage(BasePage):
    LOGIN_TAB = (By.XPATH, "//button[contains(text(), 'Iniciar sesión')]")
    REGISTER_TAB = (By.XPATH, "//button[contains(text(), 'Registrarse')]")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[name='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='password']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")

    REGISTER_DNI = (By.CSS_SELECTOR, "input[name='dni']")
    REGISTER_NOMBRE = (By.CSS_SELECTOR, "input[name='nombre']")
    BUSCAR_DNI_BTN = (By.XPATH, "//button[contains(text(), 'Buscar DNI')]")

    def login(self, email, password):
        self.open("/login")
        self.click(*self.LOGIN_TAB)
        self.type(*self.EMAIL_INPUT, email)
        self.type(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BUTTON)
        return self

    def register_with_lookup(self, dni, email, password):
        self.open("/login")
        time.sleep(1)
        self.click(*self.REGISTER_TAB)
        time.sleep(1)
        self.type(*self.REGISTER_DNI, dni)
        time.sleep(1)
        self.click(*self.BUSCAR_DNI_BTN)
        time.sleep(3)
        try:
            WebDriverWait(self.driver, 10).until(
                lambda d: d.find_element(By.CSS_SELECTOR, "input[name='nombre']").get_attribute("value") != ""
            )
        except TimeoutException:
            pass
        time.sleep(1)
        self.type(*self.EMAIL_INPUT, email)
        time.sleep(1)
        self.type(*self.PASSWORD_INPUT, password)
        time.sleep(1)
        self.click(*self.SUBMIT_BUTTON)
        time.sleep(2)
        return self
