import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";

import { error, trace } from "./logger";
import { z, ZodRawShape, ZodTypeAny } from "zod";

import sharp from "sharp";
import KeyCodes from "./constants";
import ControllerFactory from "./appium/factory";

const getAgentVersion = (): string => {
	const json = require("../package.json");
	return json.version;
};

const operativeSystem = z.enum(["android", "ios"]).describe("The operative system of the device. If unsure, ask the user first.");

export const createMcpServer = (): McpServer => {

	const server = new McpServer({
		name: "mobile-mcp",
		version: getAgentVersion(),
		capabilities: {
			resources: {},
			tools: {},
		},
	});

	const tool = (name: string, description: string, paramsSchema: ZodRawShape, cb: (args: z.objectOutputType<ZodRawShape, ZodTypeAny>) => Promise<string>) => {
		const wrappedCb = async (args: ZodRawShape): Promise<CallToolResult> => {
			try {
				trace(`Invoking ${name} with args: ${JSON.stringify(args)}`);
				const response = await cb(args);
				trace(`=> ${response}`);
				return {
					content: [{ type: "text", text: response }],
				};
			} catch (error: any) {
				trace(`Tool '${description}' failed: ${error.message} stack: ${error.stack}`);
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					isError: true,
				};
			}
		};

		server.tool(name, description, paramsSchema, args => wrappedCb(args));
	};

	tool(
		"mobile_list_apps",
		"List all the installed apps on the device",
		{},
		async () => {
			const controller = await new ControllerFactory().getController("android");
			const result = await controller.listApps();
			return `Found these packages on device: ${result.join(",")}`;
		}
	);

	tool(
		"mobile_launch_app",
		"Launch an app on mobile device",
		{
			packageName: z.string().describe("The package name of the app to launch"),
			operativeSystem,
		},
		async ({ packageName, operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			await controller.launchApp(packageName);
			return `Launched app ${packageName}`;
		}
	);

	tool(
		"mobile_terminate_app",
		"Stop and terminate an app on mobile device",
		{
			packageName: z.string().describe("The package name of the app to terminate"),
			operativeSystem: z.enum(["android", "ios"]).describe("The operative system of the device. If unsure, ask the user first."),
		},
		async ({ packageName, operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			await controller.closeApp(packageName);
			return `Terminated app ${packageName}`;
		}
	);

	tool(
		"mobile_get_screen_size",
		"Get the screen size of the mobile device in pixels",
		{
			operativeSystem,
		},
		async ({ operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			const screenSize = await controller.getScreenSize();
			return `Screen size is ${screenSize.width}x${screenSize.height} pixels`;
		}
	);

	tool(
		"mobile_click_on_screen_at_coordinates",
		"Click on the screen at given x,y coordinates",
		{
			x: z.number().describe("The x coordinate to click between 0 and 1"),
			y: z.number().describe("The y coordinate to click between 0 and 1"),
		},
		async ({ x, y }) => {
			const controller = await new ControllerFactory().getController("android");
			const screenSize = await controller.getScreenSize();
			const x0 = Math.floor(screenSize.width * x);
			const y0 = Math.floor(screenSize.height * y);

			await controller.pressByCoordinates(x0, y0);

			trace(`Clicked on screen at real coordinates: ${x0}, ${y0}`);

			return `Clicked on screen at coordinates: ${x}, ${y}`;
		}
	);

	tool(
		"mobile_list_elements_on_screen",
		"List elements on screen and their coordinates, with display text or accessibility label. Use this to understand what's on screen and to click on elements. Do not cache this result.",
		{
			operativeSystem,
		},
		async ({ operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			const elements = await controller.getElementsOnScreen();
			return `Found these elements on screen: ${JSON.stringify(elements)}`;
		}
	);

	tool(
		"mobile_press_button",
		"Press a button on device",
		{
			button: z.string().describe("The button to press. Supported buttons: " + Object.keys(KeyCodes).join(", ")),
			operativeSystem,
		},
		async ({ button, operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			await controller.pressButton(button);
			return `Pressed the button: ${button}`;
		}
	);

	tool(
		"swipe_on_screen",
		"Swipe on the screen",
		{
			direction: z.enum(["up", "down"]).describe("The direction to swipe"),
			operativeSystem,
		},
		async ({ direction, operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			await controller.swipe(direction);
			return `Swiped ${direction} on screen`;
		}
	);

	tool(
		"mobile_type_keys",
		"Type text into the focused element",
		{
			text: z.string().describe("The text to type"),
			operativeSystem,
		},
		async ({ text, operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			await controller.typeText(text);
			return `Typed text: ${text}`;
		}
	);

	server.tool(
		"mobile_take_screenshot",
		`
			Take a screenshot of the mobile device as last resort to see what's on screen.
			Do not take screenshots to help you click elements on screen.
			Do not cache this result.
		`,
		{
			operativeSystem,
		},
		async ({ operativeSystem }) => {
			try {
				const controller = await new ControllerFactory().getController(operativeSystem);
				const base64Screenshot = await controller.takeScreenshot();
				const screenshot = Buffer.from(base64Screenshot, "base64");

				// Scale down the screenshot by 50%
				const image = sharp(screenshot);
				const metadata = await image.metadata();
				if (!metadata.width) {
					throw new Error("Failed to get screenshot metadata");
				}

				const resizedScreenshot = await image
					.resize(Math.floor(metadata.width / 2))
					.jpeg({ quality: 75 })
					.toBuffer();

				const screenshot64 = resizedScreenshot.toString("base64");
				trace(`Screenshot taken: ${screenshot.length} bytes`);

				// debug:
				// writeFileSync("./screenshot.png", screenshot);
				// writeFileSync("./screenshot-scaled.jpg", resizedScreenshot);

				return {
					content: [{ type: "image", data: screenshot64, mimeType: "image/jpeg" }]
				};
			} catch (err: any) {
				error(`Error taking screenshot: ${err.message} ${err.stack}`);
				return {
					content: [{ type: "text", text: `Error: ${err.message}` }],
					isError: true,
				};
			}
		}
	);

	tool(
		"mobile_get_elements_tree",
		"Get the elements tree of the mobile device. This is a string that represents the view hierarchy of the mobile device. Use this to understand the structure of the screen.",
		{
			operativeSystem,
		},
		async ({ operativeSystem }) => {
			const controller = await new ControllerFactory().getController(operativeSystem);
			const elementsTree = await controller.getElementsTree();
			return `Elements tree: ${elementsTree}`;
		}
	);

	return server;
};
