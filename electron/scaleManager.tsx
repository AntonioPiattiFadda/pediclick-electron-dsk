/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { win } from "./main";
import { app } from "electron";

let scaleProcess: ChildProcessWithoutNullStreams | null = null;
let isScaleConnected = false;
let isScaleError = false;

export function connectToScale(portPath: string) {
    if (scaleProcess) {
        console.log("Scale already connected.");
        return scaleProcess;
    }

    const isPackaged = app.isPackaged;

    const exePath = path.join(
        process.cwd(),
        isPackaged ? "resources" : "public",
        "bin",
        "scale_reader.exe"
    );

    console.log("Launching scale reader:", exePath, portPath);

    const proc = spawn(exePath, [portPath]);
    scaleProcess = proc;

    proc.stdout.on("data", (data) => {
        const weight = data.toString().trim();
        const weithInKg = weight / 1000;
        console.log("Scale weight:", weithInKg);

        isScaleConnected = true;
        isScaleError = false;

        win?.webContents.send("scale-weight", {
            weight: weithInKg,
            isScaleConnected,
            isScaleError,
        });
    });

    proc.stderr.on("data", (err) => {
        console.log("Scale weight:", err);

        console.error("Scale stderr:", err.toString().trim());

        isScaleConnected = false;
        isScaleError = true;

        win?.webContents.send("scale-weight", {
            weight: 0,
            isScaleConnected,
            isScaleError,
        });
    });

    proc.on("error", (err) => {
        console.log("Spawn failed:", err);

        isScaleConnected = false;
        isScaleError = true;
        scaleProcess = null;

        win?.webContents.send("scale-weight", {
            weight: 0,
            isScaleConnected,
            isScaleError,
        });
    });

    proc.on("close", (code) => {
        console.log("Scale process closed:", code);

        isScaleConnected = false;
        isScaleError = false;
        scaleProcess = null;

        win?.webContents.send("scale-weight", {
            weight: 0,
            isScaleConnected,
            isScaleError,
        });
    });

    return proc;
}
