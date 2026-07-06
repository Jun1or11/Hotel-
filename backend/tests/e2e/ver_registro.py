"""Script para ver visualmente el flujo de registro en el navegador."""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument("--window-size=1360,900")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    driver.get("http://localhost:5173/login")
    wait = WebDriverWait(driver, 10)
    time.sleep(1)

    # Click en "Registrarse"
    reg_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Registrarse')]")))
    reg_btn.click()
    time.sleep(1)

    # Escribir DNI
    dni_input = driver.find_element(By.CSS_SELECTOR, "input[name='dni']")
    dni_input.send_keys("43678840")
    time.sleep(1)

    # Click "Buscar DNI" para autocompletar nombre
    buscar_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Buscar DNI')]")
    buscar_btn.click()
    print("Buscando DNI... esperando autocompletado...")
    time.sleep(4)

    # Ver nombre autocompletado
    nombre_input = driver.find_element(By.CSS_SELECTOR, "input[name='nombre']")
    nombre_value = nombre_input.get_attribute("value")
    print(f"Nombre autocompletado: '{nombre_value}'")
    time.sleep(1)

    # Email
    email_input = driver.find_element(By.CSS_SELECTOR, "input[name='email']")
    email_input.send_keys("test11@gmail.com")
    time.sleep(1)

    # Contraseña
    pass_input = driver.find_element(By.CSS_SELECTOR, "input[name='password']")
    pass_input.send_keys("Junior11")
    time.sleep(1)

    # Click "Registrarse"
    submit = driver.find_element(By.XPATH, "//button[contains(text(), 'Registrarse')]")
    submit.click()
    time.sleep(3)

    print(f"URL final: {driver.current_url}")
    print("El navegador se cerrará en 5 segundos...")
    time.sleep(5)

finally:
    driver.quit()
