from playwright.sync_api import sync_playwright
import glob
import time

def run_cuj(page):
    # Navigate to the app
    page.goto("http://localhost:8000/index.html")
    page.wait_for_timeout(1000)

    # Click the "Add Player" card to open the Add Modal
    page.click('.add-card')
    page.wait_for_selector('.age-option', state='visible')
    page.wait_for_timeout(1000)

    # Use keyboard navigation to focus the first age option
    # First, focus the new-name input, then tab to the age option
    page.focus('#new-name')
    page.wait_for_timeout(500)
    page.keyboard.press('Tab')
    page.wait_for_timeout(500)

    # Take screenshot of the focus state
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

    # Verify elements are buttons and have aria-labels
    age_btn = page.query_selector('.age-option')
    print("Age Button element tag:", age_btn.evaluate("el => el.tagName"))
    print("Age Button aria-label:", age_btn.get_attribute('aria-label'))

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
