import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support import expected_conditions as EC
from ..base_page import BasePage


class RoomsManagementPage(BasePage):
    CREATE_BUTTON = (By.XPATH, "//button[contains(text(), 'Agregar')]")
    TABLE_ROWS = (By.CSS_SELECTOR, "table tbody tr")

    MODAL_NUMERO = (By.CSS_SELECTOR, "input[name='numero']")
    MODAL_TIPO = (By.CSS_SELECTOR, "select[name='tipo']")
    MODAL_CAPACIDAD = (By.CSS_SELECTOR, "input[name='capacidad']")
    MODAL_PRECIO = (By.CSS_SELECTOR, "input[name='precio_noche']")
    MODAL_DESCRIPCION = (By.CSS_SELECTOR, "textarea[name='descripcion']")
    MODAL_SAVE = (By.XPATH, "//button[contains(text(), 'Guardar')]")

    EDIT_BUTTON = (By.XPATH, "//button[contains(text(), 'Editar')]")
    DELETE_BUTTON = (By.XPATH, "//button[contains(text(), 'Eliminar')]")

    def open_management(self):
        self.open("/admin/habitaciones")
        return self

    def click_create(self):
        self.click(*self.CREATE_BUTTON)
        return self

    def fill_room_form(self, numero, tipo, capacidad, precio, descripcion="Test room"):
        self.type(*self.MODAL_NUMERO, str(numero))
        el = self.find(*self.MODAL_TIPO)
        Select(el).select_by_visible_text(tipo)
        self.type(*self.MODAL_CAPACIDAD, str(capacidad))
        self.type(*self.MODAL_PRECIO, str(precio))
        if descripcion:
            self.type(*self.MODAL_DESCRIPCION, descripcion)
        return self

    def save_room(self):
        self.click(*self.MODAL_SAVE)
        return self

    def create_room(self, numero, tipo, capacidad, precio, descripcion="Test room"):
        self.click_create()
        self.fill_room_form(numero, tipo, capacidad, precio, descripcion)
        self.save_room()
        return self

    def edit_first_room(self):
        btns = self.finds(*self.EDIT_BUTTON)
        if btns:
            btns[0].click()
        return self

    def set_precio(self, precio):
        self.type(*self.MODAL_PRECIO, str(precio))
        return self

    def save_edit(self):
        self.click(*self.MODAL_SAVE)
        return self

    def delete_first_room(self):
        btns = self.finds(*self.DELETE_BUTTON)
        if btns:
            btns[0].click()
            time.sleep(1)
            alert = self.driver.switch_to.alert
            alert.accept()
            time.sleep(1)
        return self

    def get_room_count(self):
        return len(self.finds(*self.TABLE_ROWS))
