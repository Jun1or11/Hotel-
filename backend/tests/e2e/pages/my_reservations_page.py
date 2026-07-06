from selenium.webdriver.common.by import By
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
            btns[0].click()
            import time
            time.sleep(1)
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
                time.sleep(1)
            except Exception:
                pass
        return self

    def has_cancel_button(self):
        return len(self.finds(*self.CANCEL_BUTTON)) > 0
