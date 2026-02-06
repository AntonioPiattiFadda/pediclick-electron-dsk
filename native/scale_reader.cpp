#include <windows.h>
#include <iostream>
#include <string>

HANDLE g_hSerial = INVALID_HANDLE_VALUE;

/* ==================================================
   Cierre seguro del puerto COM
   ================================================== */
void closeSerialPort()
{
    if (g_hSerial != INVALID_HANDLE_VALUE)
    {
        CloseHandle(g_hSerial);
        g_hSerial = INVALID_HANDLE_VALUE;
        std::cerr << "[INFO] Puerto COM cerrado\n";
    }
}

/* ==================================================
   Handler de cierre (Electron / Ctrl+C / kill)
   ================================================== */
BOOL WINAPI consoleHandler(DWORD signal)
{
    switch (signal)
    {
    case CTRL_C_EVENT:
    case CTRL_CLOSE_EVENT:
    case CTRL_BREAK_EVENT:
    case CTRL_SHUTDOWN_EVENT:
        closeSerialPort();
        ExitProcess(0);
        return TRUE;
    default:
        return FALSE;
    }
}

/* ==================================================
   Loop de lectura CONTINUA de peso
   ================================================== */
void readWeightLoop(const std::string &comPort)
{
    std::string portName = "\\\\.\\" + comPort;

    g_hSerial = CreateFileA(
        portName.c_str(),
        GENERIC_READ | GENERIC_WRITE,
        0,
        NULL,
        OPEN_EXISTING,
        0,
        NULL);

    if (g_hSerial == INVALID_HANDLE_VALUE)
    {
        std::cerr << "No se pudo abrir el puerto " << comPort << "\n";
        return;
    }

    // Configuración 9600 8N1
    DCB dcb = {0};
    dcb.DCBlength = sizeof(dcb);
    GetCommState(g_hSerial, &dcb);

    dcb.BaudRate = CBR_9600;
    dcb.ByteSize = 8;
    dcb.Parity = NOPARITY;
    dcb.StopBits = ONESTOPBIT;

    SetCommState(g_hSerial, &dcb);

    COMMTIMEOUTS timeouts = {0};
    timeouts.ReadIntervalTimeout = 50;
    timeouts.ReadTotalTimeoutConstant = 50;
    timeouts.ReadTotalTimeoutMultiplier = 10;
    SetCommTimeouts(g_hSerial, &timeouts);

    const char ENQ = 0x05;
    char buffer[256];
    DWORD bytesWritten = 0;
    DWORD bytesRead = 0;

    std::cerr << "[INFO] Balanza conectada. Leyendo peso...\n";

    while (true)
    {
        // Pedir peso
        WriteFile(g_hSerial, &ENQ, 1, &bytesWritten, NULL);

        // Leer respuesta
        if (ReadFile(g_hSerial, buffer, sizeof(buffer), &bytesRead, NULL) && bytesRead > 0)
        {
            for (DWORD i = 0; i < bytesRead; i++)
            {
                if (buffer[i] == 0x02)
                { // STX
                    std::string weight;
                    i++;
                    while (i < bytesRead && buffer[i] != 0x03)
                    { // ETX
                        weight += buffer[i++];
                    }
                    // Salida continua
                    std::cout << weight << std::endl;
                }
            }
        }

        Sleep(200); // 5 lecturas por segundo (estable)
    }
}

/* ==================================================
   MAIN
   ================================================== */
int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Uso: scale_reader.exe COMx\n";
        return 1;
    }

    SetConsoleCtrlHandler(consoleHandler, TRUE);
    readWeightLoop(argv[1]);
    closeSerialPort();
    return 0;
}
