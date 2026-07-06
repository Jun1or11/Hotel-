from selenium.webdriver.common.by import By
from ..base_page import BasePage


class UsersPage(BasePage):
    TABLE_ROWS = (By.CSS_SELECTOR, "table tbody tr")
    DELETE_BUTTON = (By.XPATH, "//button[contains(text(), 'Eliminar')]")
    REACTIVATE_BUTTON = (By.XPATH, "//button[contains(text(), 'Reactivar')]")
    CONFIRM_YES = (By.XPATH, "//button[contains(text(), 'Sí')]")

    def open_management(self):
        self.open("/admin/usuarios")
        return self

    def get_user_count(self):
        return len(self.finds(*self.TABLE_ROWS))

    def delete_first_user(self):
        btns = self.finds(*self.DELETE_BUTTON)
        if btns:
            btns[0].click()
            if self.is_visible(*self.CONFIRM_YES):
                self.click(*self.CONFIRM_YES)
        return self

    def get_user_data(self):
        rows = self.finds(*self.TABLE_ROWS)
        return [r.text.strip() for r in rows]
