## Enable Raw USB Printing (WinUSB) with Zadig

To communicate directly with the thermal printer (ESC/POS mode) without Windows print dialogs:

1. Download Zadig: https://zadig.akeo.ie/#  
2. Run Zadig **as Administrator**  
3. Go to **Options → List All Devices**  
4. Select your thermal printer (e.g. `USB Printing Support`, `POS Printer`, or similar)  
NO es etse porque no funciona aun
5. In **Driver**, choose **WinUSB (Microsoft)**  
6. Click **Install Driver** or **Replace Driver**  
7. Reconnect the printer and run the Electron app  

AL INSTALAR LA ACTUALIZACION AUTOMATICA ME DESVINCULO EL ACCESO DIRECTO DEL ESCRITORIO Y EN OTRA OCACION ME DESINSTALO SOLO NO INSTALO LO NUEVO. HACER LA ACTUALIZACION CUANDO EL USUARIO ACEPTE.

> This replaces the Windows printer driver and enables raw USB communication via `node-usb`.

La balanza se conecta por puerto COM, al conectarla se deberia instalar el driver automaticamente, podemos observar eso en administrador de dispositivos. Luego la coneccion se hace con un script de c.pp