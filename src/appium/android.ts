import { Controller } from "./types";
import KeyCodes from "../constants";

class Android implements Controller {
	driver: WebdriverIO.Browser;

	constructor(driver: WebdriverIO.Browser) {
		this.driver = driver;
	}

	async goToHome() {
		await this.driver.pressKeyCode(3); // 3 = KEYCODE_HOME
	}

	async launchApp(appId: string) {
		// Most reliable way to launch an Android app with Appium,
		// avoiding issues when the main activity is just a wrapper
		// that quickly switches to another activity.
		await this.driver.execute("mobile: shell", {
			command: "monkey",
			args: ["-p", appId, "-c", "android.intent.category.LAUNCHER", "1"]
		});
	}

	async listApps(): Promise<string[]> {
		// No way to list apps on Android using Appium, so we use the shell command
		const result = await this.driver.execute("mobile: shell", {
			command: "cmd",
			args: ["package", "query-activities", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER"]
		}) as string;

		return result.toString()
			.split("\n")
			.map(line => line.trim())
			.filter(line => line.startsWith("packageName="))
			.map(line => line.substring("packageName=".length))
			.filter((value, index, self) => self.indexOf(value) === index);

	}

	async closeApp(appId: string) {
		await this.driver.terminateApp(appId);
	}

	async deleteSession() {
		await this.driver.deleteSession();
	}

	async takeScreenshot(): Promise<string> {
		return this.driver.takeScreenshot();
	}

	async pressButton(button: keyof typeof KeyCodes) {
		await this.driver.pressKeyCode(KeyCodes[button]);
	}

	async getElementsTree(): Promise<string> {
		return this.driver.getPageSource();
	}

	async getScreenSize(): Promise<{
		width: number;
		height: number;
	}> {
		return this.driver.getWindowSize();
	}

	async getElementsOnScreen(): Promise<{
		text: string;
		coordinates: {
			x: number;
			y: number;
		};
		contentDescription: string;
	}[]> {
		const elements = await this.driver.$$("//*");
		const screenSize = await this.getScreenSize();
		return elements.map(async element => {
			// calculate the center of the element
			const coords = await element.getLocation();
			const size = await element.getSize();
			const centerX = coords.x + size.width / 2;
			const centerY = coords.y + size.height / 2;

			return {
				text: await element.getAttribute("text"),
				coordinates: {
					// convert x and y to percentage of the screen size
					x: centerX / screenSize.width,
					y: centerY / screenSize.height,
				},
				contentDescription: await element.getAttribute("content-desc"),
				className: await element.getAttribute("class"),
			};
		});
	}

	async pressByCoordinates(x: number, y: number) {
		await this.driver.action("pointer", {
			parameters: {
				pointerType: "touch",
			},
		}).move({
			x,
			y,
		}).down()
			.up()
			.perform();
	}

	async typeText(text: string) {
		return this.driver.keys(text);
	}

	async swipe(direction: "up" | "down") {
		const screenSize = await this.getScreenSize();
		const centerX = screenSize.width / 2;

		await this.driver.action("pointer", {
			parameters: {
				pointerType: "touch",
			},
		}).move({
			x: centerX,
			y: direction === "up" ? screenSize.height * 0.80 : screenSize.height * 0.20,
		}).down()
			.move({
				x: centerX,
				y: direction === "up" ? screenSize.height * 0.20 : screenSize.height * 0.80,
			})
			// Avoid the swipe to be too fast
			.pause(200)
			.up()
			.perform();
	}
}

export default Android;
