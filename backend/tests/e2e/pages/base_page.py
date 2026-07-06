from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.remote.webelement import WebElement


class BasePage:
    def __init__(self, driver, base_url="http://localhost:5173"):
        self.driver = driver
        self.base_url = base_url

    def open(self, path="/"):
        self.driver.get(f"{self.base_url}{path}")
        return self

    def find(self, by, value, timeout=10) -> WebElement:
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )

    def find_clickable(self, by, value, timeout=10) -> WebElement:
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )

    def finds(self, by, value, timeout=10):
        WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        return self.driver.find_elements(by, value)

    def click(self, by, value, timeout=10):
        self.find_clickable(by, value, timeout).click()

    def type(self, by, value, text, timeout=10, clear_first=True):
        el = self.find(by, value, timeout)
        if clear_first:
            el.clear()
        el.send_keys(text)

    def get_text(self, by, value, timeout=10):
        return self.find(by, value, timeout).text

    def is_visible(self, by, value, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def wait_for_url(self, fragment, timeout=10):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.url_contains(fragment)
            )
            return True
        except TimeoutException:
            return False

    def wait_for_text(self, by, value, text, timeout=10):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.text_to_be_present_in_element((by, value), text)
            )
            return True
        except TimeoutException:
            return False

    def scroll_to(self, by, value, timeout=10):
        el = self.find(by, value, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", el)
        return el

    def execute_script(self, script, *args):
        return self.driver.execute_script(script, *args)
