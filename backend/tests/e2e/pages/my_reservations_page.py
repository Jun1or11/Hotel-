from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from .base_page import BasePage


class MyReservationsPage(BasePage):
    RESERVATION_ROWS = (By.CSS_SELECTOR, "table tbody tr")
    CANCEL_BUTTON = (By.XPATH, "//button[contains(text(), 'Cancelar')]")
    STATUS_CHIP = (By.CSS_SELECTOR, "[class*='status'], [class*='chip']")

    def open_mis_reservas(self):
        self.open("/mis-reservas")
        return self

    def get_reservation_count(self):
        return len(self.finds(*self.RESERVATION_ROWS))

    def cancel_first_reservation(self):
        btns = self.finds(*self.CANCEL_BUTTON)
        if btns:
            import time
            time.sleep(2)
            btns[0].click()
            try:
                time.sleep(1.5)
                WebDriverWait(self.driver, 5).until(EC.alert_is_present())
                alert = self.driver.switch_to.alert
                alert.accept()
                time.sleep(2)
            except TimeoutException:
                pass
        return self

    def has_cancel_button(self):
        return len(self.finds(*self.CANCEL_BUTTON)) > 0
