import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { readFileSync, unlinkSync } from "fs";
import { execFileSync } from "child_process";

import { WebDriverAgent } from "./webdriver-agent";
import { Button, Dimensions, Robot, SwipeDirection } from "./robot";

interface ListCommandOutput {
	deviceList: string[];
}

const getGoIosPath = (): string => {
	return "ios";
};

export class IosRobot implements Robot {

	private readonly wda: WebDriverAgent;

	public constructor(private deviceId: string) {
		this.wda = new WebDriverAgent("localhost", 8100);
	}

	private async ios(...args: string[]): Promise<string> {
		return execFileSync(getGoIosPath(), ["--udid", this.deviceId, ...args], {}).toString();
	}

	public async getScreenSize(): Promise<Dimensions> {
		return await this.wda.getScreenSize();
	}

	public async swipe(direction: SwipeDirection): Promise<void> {
		await this.wda.swipe(direction);
	}

	public async listApps(): Promise<string[]> {
		const output = await this.ios("apps", "--all", "--list");
		return output
			.split("\n")
			.map(line => line.split(" ")[0]);
	}

	public async launchApp(packageName: string): Promise<void> {
		await this.ios("launch", packageName);
	}

	public async terminateApp(packageName: string): Promise<void> {
		await this.ios("kill", packageName);
	}

	public async openUrl(url: string): Promise<void> {
		await this.wda.openUrl(url);
	}

	public async sendKeys(text: string): Promise<void> {
		await this.wda.sendKeys(text);
	}

	public async pressButton(button: Button): Promise<void> {
		await this.wda.pressButton(button);
	}

	public async tap(x: number, y: number): Promise<void> {
		await this.wda.tap(x, y);
	}

	public async getElementsOnScreen(): Promise<any[]> {
		return await this.wda.getElementsOnScreen();
	}

	public async getScreenshot(): Promise<Buffer> {
		const tmpFilename = join(tmpdir(), `screenshot-${randomBytes(8).toString("hex")}.png`);
		await this.ios("screenshot", "--output", tmpFilename);
		const buffer = readFileSync(tmpFilename);
		unlinkSync(tmpFilename);
		return buffer;
	}
}

export class IosManager {
	public async listDevices(): Promise<string[]> {
		const output = execFileSync(getGoIosPath(), ["list"]).toString();
		const json: ListCommandOutput = JSON.parse(output);
		return json.deviceList;
	}
}
