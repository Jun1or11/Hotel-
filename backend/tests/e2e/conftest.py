import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

ADMIN_EMAIL = "admin1@hotelnova.com"
ADMIN_PASSWORD = "Promocion135"

GUEST_EMAIL = "ana.torres@gmail.com"
GUEST_PASSWORD = "Ana12345"

CHROME_SERVICE = Service(ChromeDriverManager().install())


@pytest.fixture(scope="function")
def browser():
    options = Options()
    options.add_argument("--window-size=1360,900")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    if os.getenv("HEADLESS"):
        options.add_argument("--headless=new")
    driver = webdriver.Chrome(service=CHROME_SERVICE, options=options)
    driver.implicitly_wait(2)
    yield driver
    driver.quit()


@pytest.fixture
def frontend_url():
    return FRONTEND_URL


@pytest.fixture
def backend_url():
    return BACKEND_URL


@pytest.fixture
def admin_credentials():
    return {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}


@pytest.fixture
def guest_credentials():
    return {"email": GUEST_EMAIL, "password": GUEST_PASSWORD}


@pytest.fixture
def new_user_credentials():
    import uuid
    unique = uuid.uuid4().hex[:6]
    return {
        "dni": "43678840",
        "email": f"test.{unique}@gmail.com",
        "password": "Junior11",
    }
