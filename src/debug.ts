import ControllerFactory from "./appium/factory";

async function runTest() {
	const session = await new ControllerFactory().getController("android");

	try {
		await session.launchApp("com.google.android.youtube");
		await session.goToHome();
	} finally {
		await session.driver.pause(1000);
		await session.deleteSession();
	}
}

runTest().catch(console.error);
