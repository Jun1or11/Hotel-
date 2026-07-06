from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from .base_page import BasePage


class RoomsPage(BasePage):
    FILTER_TIPO = (By.XPATH, "//label[contains(text(), 'Tipo')]/following::select[1]")
    ROOM_CARDS = (By.CSS_SELECTOR, "div.room-grid div.panel")
    RESERVAR_BTN = (By.XPATH, "//button[contains(text(), 'Reservar ahora')]")

    MODAL_CALENDAR = (By.CSS_SELECTOR, "div.calendar-grid")
    MODAL_HUESPEDES = (By.CSS_SELECTOR, "input.form-control[type='number']")
    MODAL_SOLICITUDES = (By.CSS_SELECTOR, "textarea.form-control[placeholder*='Cama adicional']")
    MODAL_RESERVAR = (By.XPATH, "//button[contains(text(), 'Crear reserva')]")

    CALENDAR_CELLS = (By.CSS_SELECTOR, "button.calendar-day")
    CHECKIN_DISPLAY = (By.CSS_SELECTOR, "[class*='check-in'], [class*='checkin']")

    def open_rooms(self):
        self.open("/habitaciones")
        return self

    def filter_by_tipo(self, tipo):
        el = self.find(*self.FILTER_TIPO)
        Select(el).select_by_visible_text(tipo)
        return self

    def get_visible_room_count(self):
        return len(self.finds(*self.ROOM_CARDS))

    def click_reservar_first(self):
        btns = self.finds(*self.RESERVAR_BTN)
        if btns:
            btns[0].click()
        return self

    def select_dates_in_calendar(self, days_ahead=3, duration=2):
        cells = self.finds(*self.CALENDAR_CELLS)
        free_cells = []
        for cell in cells:
            cls = cell.get_attribute("class") or ""
            txt = cell.text.strip()
            if txt and txt.isdigit() and "is-disabled" not in cls and "is-occupied" not in cls and "is-outside" not in cls:
                free_cells.append(cell)
        if free_cells:
            target = free_cells[min(days_ahead, len(free_cells) - 1)]
            target.click()
            end_idx = min(days_ahead + duration - 1, len(free_cells) - 1)
            free_cells[end_idx].click()
        return self

    def fill_booking_form(self, num_huespedes="2", solicitudes="Test reservation"):
        inputs = self.finds(*self.MODAL_HUESPEDES)
        if inputs:
            inputs[0].clear()
            inputs[0].send_keys(num_huespedes)
        textareas = self.finds(*self.MODAL_SOLICITUDES)
        if textareas:
            textareas[0].send_keys(solicitudes)
        return self

    def confirm_booking(self):
        self.click(*self.MODAL_RESERVAR)
        return self
