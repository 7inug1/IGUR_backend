require("dotenv").config();
const puppeteer = require("puppeteer");
const USERNAME = "tate";

(async () => {
  const browser = await puppeteer.launch({
    args: ["--incognito"],
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 1024,
  });
  await page.goto("https://www.instagram.com/accounts/login", {
    waitUntil: "networkidle2",
  });
  await page.type("input[name=username]", process.env.ID, { delay: 40 });
  await page.type("input[name=password]", process.env.PW, { delay: 40 });
  await page.click("button[type=submit]", { delay: 40 });
  await page.waitForNavigation({ waitUntil: "networkidle2" });
  await page.goto(`https://www.instagram.com/${USERNAME}`, {
    waitUntil: "networkidle2",
  });
})();
