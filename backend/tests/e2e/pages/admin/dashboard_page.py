from selenium.webdriver.common.by import By
from ..base_page import BasePage


class DashboardPage(BasePage):
    KPI_CARDS = (By.CSS_SELECTOR, "[class*='kpi'], [class*='card'], [class*='stat']")
    POPULAR_ROOMS = (By.CSS_SELECTOR, "[class*='popular'], [class*='ranking']")
    RECENT_RESERVATIONS = (By.CSS_SELECTOR, "table tbody tr")
    REVIEWS_SECTION = (By.CSS_SELECTOR, "[class*='resena'], [class*='review']")

    SIDEBAR_DASHBOARD = (By.XPATH, "//a[contains(@href, '/admin/dashboard')]")
    SIDEBAR_HABITACIONES = (By.XPATH, "//a[contains(@href, '/admin/habitaciones')]")
    SIDEBAR_RESERVAS = (By.XPATH, "//a[contains(@href, '/admin/reservas')]")
    SIDEBAR_USUARIOS = (By.XPATH, "//a[contains(@href, '/admin/usuarios')]")
    SIDEBAR_NOTIFICACIONES = (By.XPATH, "//a[contains(@href, '/admin/notificaciones')]")
    SIDEBAR_PAGOS = (By.XPATH, "//a[contains(@href, '/admin/pagos')]")

    def open_dashboard(self):
        self.open("/admin/dashboard")
        return self

    def get_kpi_count(self):
        return len(self.finds(*self.KPI_CARDS))

    def get_kpi_texts(self):
        return [c.text.strip() for c in self.finds(*self.KPI_CARDS)]

    def click_sidebar_habitaciones(self):
        self.click(*self.SIDEBAR_HABITACIONES)
        return self

    def click_sidebar_reservas(self):
        self.click(*self.SIDEBAR_RESERVAS)
        return self

    def click_sidebar_usuarios(self):
        self.click(*self.SIDEBAR_USUARIOS)
        return self
