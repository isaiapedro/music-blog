import logging
import time
from playwright.sync_api import sync_playwright

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

PROJECT_URL = "https://1001albumsgenerator.com/um-ano-e-meio-de-musica"
BUTTON_SELECTOR = "#did-not-listen-button"

def auto_skip_album():
    logging.info("Launching headless browser...")
    with sync_playwright() as p:
        # Launch Chromium in headless mode (invisible background process)
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        logging.info(f"Navigating to {PROJECT_URL}...")
        page.goto(PROJECT_URL, wait_until="networkidle")
        
        # Check if the button is visible on the page
        if page.is_visible(BUTTON_SELECTOR):
            logging.info("Button found! Executing automated 'Did Not Listen' click...")
            page.click(BUTTON_SELECTOR)
            
            # Give the browser 5 seconds to process the backend JS rating submission safely
            time.sleep(5)
            logging.info("Click submitted successfully.")
        else:
            logging.warning("The 'Did Not Listen' button wasn't found. The album might already be rated/skipped today.")
            
        browser.close()

if __name__ == "__main__":
    auto_skip_album()
