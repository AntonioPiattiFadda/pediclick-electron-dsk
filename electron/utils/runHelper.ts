import { execFile } from "child_process";
import path from "path";
import { app } from "electron";

const PROD_DIR = path.join(process.resourcesPath, "bin");
const DEV_DIR = path.join(
    "C:\\Users\\anton\\Documents\\cultzyme\\ctz-electron\\ctz-bion-omnix-app\\public",
    "bin"
);

function getHelperPath(exe: string) {
    return app.isPackaged
        ? path.join(PROD_DIR, exe)
        : path.join(DEV_DIR, exe);
}

export function runHelper(exe: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
        const helper = getHelperPath(exe);

        execFile(helper, args, (err) => {
            if (err) {
                console.error(`${exe} failed:`, err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
