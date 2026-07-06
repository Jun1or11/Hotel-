from selenium.webdriver.common.by import By
from ..base_page import BasePage


class ReservationsPage(BasePage):
    ACTIVE_TABLE = (By.XPATH, "//h2[contains(text(), 'Activas')]/following::table[1]")
    HISTORY_TABLE = (By.XPATH, "//h2[contains(text(), 'Historial')]/following::table[1]")
    TABLE_ROWS = (By.CSS_SELECTOR, "table tbody tr")

    COMPLETAR_BUTTON = (By.XPATH, "//button[contains(text(), 'Completar') or contains(text(), 'Terminar')]")
    LIBERAR_BUTTON = (By.XPATH, "//button[contains(text(), 'Liberar')]")
    CANCELAR_BUTTON = (By.XPATH, "//button[contains(text(), 'Cancelar')]")
    CONFIRM_YES = (By.XPATH, "//button[contains(text(), 'Sí')]")

    def open_management(self):
        self.open("/admin/reservas")
        return self

    def get_reservation_count(self):
        return len(self.finds(*self.TABLE_ROWS))

    def complete_first_active(self):
        btns = self.finds(*self.COMPLETAR_BUTTON)
        if btns:
            btns[0].click()
            if self.is_visible(*self.CONFIRM_YES):
                self.click(*self.CONFIRM_YES)
        return self

    def cancel_first_pending(self):
        btns = self.finds(*self.CANCELAR_BUTTON)
        if btns:
            btns[0].click()
            if self.is_visible(*self.CONFIRM_YES):
                self.click(*self.CONFIRM_YES)
        return self

    def get_table_text(self):
        rows = self.finds(*self.TABLE_ROWS)
        return [r.text.strip() for r in rows]
