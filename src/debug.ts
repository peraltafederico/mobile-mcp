import ControllerFactory from "./appium/factory";

async function runTest() {
	const controller = await new ControllerFactory().getController("android");

	try {
		await controller.launchApp("com.google.android.youtube");
		await controller.goToHome();
	} finally {
		await controller.driver.pause(1000);
		await controller.deleteSession();
	}
}

runTest().catch(console.error);
