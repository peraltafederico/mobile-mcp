import { Controller } from "./types";

class IOS implements Controller {
	driver: WebdriverIO.Browser;

	constructor(driver: WebdriverIO.Browser) {
		this.driver = driver;
	}

	async goToHome() {
		throw new Error("Not implemented");
	}

	async launchApp(appId: string) {
		throw new Error("Not implemented");
	}

	async listApps(): Promise<string[]> {
		throw new Error("Not implemented");
	}

	async closeApp(appId: string) {
		throw new Error("Not implemented");
	}

	async deleteSession() {
		throw new Error("Not implemented");
	}

	async takeScreenshot(): Promise<string> {
		throw new Error("Not implemented");
	}

	async pressButton(button: string) {
		throw new Error("Not implemented");
	}

	async getElementsTree(): Promise<string> {
		throw new Error("Not implemented");
	}

	async getScreenSize(): Promise<{
		width: number;
		height: number;
	}> {
		throw new Error("Not implemented");
	}

	async getElementsOnScreen(): Promise<{
		text: string;
		coordinates: {
			x: number;
			y: number;
		};
		contentDescription: string;
	}[]> {
		throw new Error("Not implemented");
	}

	async pressByCoordinates(x: number, y: number) {
		throw new Error("Not implemented");
	}

	async typeText(text: string) {
		throw new Error("Not implemented");
	}

	async swipe(direction: "up" | "down") {
		throw new Error("Not implemented");
	}

}

export default IOS;
