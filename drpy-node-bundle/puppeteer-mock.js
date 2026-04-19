export const launch = async () => { throw new Error("Puppeteer is not available in the bundled version."); };
export const executablePath = () => "mock-path";
export default { launch, executablePath };
