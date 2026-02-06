import { screen } from 'electron';



export function getScreenSize() {
    const screenWidth = screen.getPrimaryDisplay().size.width;
    const screenHeight = screen.getPrimaryDisplay().size.height;
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

    const finalWidth = Math.floor(screenWidth * scaleFactor);
    const finalHeight = Math.floor(screenHeight * scaleFactor);

    return { width: finalWidth, height: finalHeight };
}

