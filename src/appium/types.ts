interface Controller {
	goToHome(): Promise<void>;
	launchApp(appId: string): Promise<void>;
	closeApp(appId: string): Promise<void>;
	listApps(): Promise<string[]>;
	deleteSession(): Promise<void>;
	takeScreenshot(): Promise<string>;
	pressButton(button: string): Promise<void>;
	getElementsTree(): Promise<string>;
	getScreenSize(): Promise<{
		width: number;
		height: number;
	}>;
	getElementsOnScreen(): Promise<any[]>;
	pressByCoordinates(x: number, y: number): Promise<void>;
	typeText(text: string): Promise<void>;
	swipe(direction: "up" | "down"): Promise<void>;
	driver: WebdriverIO.Browser;

}

export { Controller };
