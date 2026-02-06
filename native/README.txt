# Native Display Helpers (Windows)

This directory contains **native C++ helpers for Windows** used by the Electron application (Omnix) to modify system-level settings that **cannot be handled directly from Node/Electron**.

These helpers are responsible for:
- Setting scale communication
- Etc..

---

## 🧰 Requirements

To build these helpers you need:

- **Visual Studio Build Tools 2022**
- Recommended version:
  - **17.14.x** (tested with 17.14.14 and newer)
- Required workload:
  - **Desktop development with C++**
- Operating System:
  - **Windows**

> Visual Studio *Build Tools* are sufficient.

---

## 🛠 Build Instructions

Compilation must be done from the **Developer Command Prompt for Visual Studio 2022**.

### Build Command

From the project root:

```bat

cl /EHsc /std:c++17 native\serialPortComToScale.cpp user32.lib advapi32.lib Fe:public\bin\serialPortComToScale.exe
cl /EHsc native\CPP_SCRIPT.cpp user32.lib /Fe:public\bin\CPP_SCRIPT.exe


cl /EHsc /std:c++17 native\scale_reader.cpp /Fe:public\bin\scale_reader.exe user32.lib advapi32.lib
