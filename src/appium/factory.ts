import { remote } from "webdriverio";
import Android from "./android";
import IOS from "./ios";

type ControllerType = "android" | "ios";

// Just a simple factory to create controllers, but that could be extended to save controllers and reuse them.
// Keeping it simple for now.
class ControllerFactory {
	async getController(type: ControllerType) {
		if (type === "android") {
			const driver = await remote({
				hostname: process.env.APPIUM_HOST || "localhost",
				port: parseInt(process.env.APPIUM_PORT || "4723", 10),
				logLevel: "info",
				capabilities: {
					"platformName": "Android",
					"appium:automationName": "UiAutomator2",
					"appium:deviceName": "Android",
				}
			});
			return new Android(driver);
		}

		if (type === "ios") {
			const driver = await remote({
				hostname: process.env.APPIUM_HOST || "localhost",
				port: parseInt(process.env.APPIUM_PORT || "4723", 10),
				logLevel: "info",
				capabilities: {
					"platformName": "iOS",
					"appium:automationName": "XCUITest",
					"appium:deviceName": "iPhone",
				}
			});
			return new IOS(driver);
		}

		throw new Error(`Unsupported platform: ${type}`);
	}
}

export default ControllerFactory;
