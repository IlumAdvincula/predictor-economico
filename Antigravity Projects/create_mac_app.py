#!/usr/bin/env python3
"""
Crea un paquete de aplicación nativa de macOS (.app)
Permite abrir el programa directamente con doble clic sin tocar la terminal.
"""

import os
import stat

APP_NAME = "Predictor Economico.app"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(BASE_DIR, APP_NAME)
CONTENTS_DIR = os.path.join(APP_DIR, "Contents")
MACOS_DIR = os.path.join(CONTENTS_DIR, "MacOS")
RESOURCES_DIR = os.path.join(CONTENTS_DIR, "Resources")

os.makedirs(MACOS_DIR, exist_ok=True)
os.makedirs(RESOURCES_DIR, exist_ok=True)

# 1. Info.plist
info_plist = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>Spanish</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.pedro.predictoreconomico</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Predictor Economico</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""

with open(os.path.join(CONTENTS_DIR, "Info.plist"), "w") as f:
    f.write(info_plist)

# 2. Script ejecutable launcher
launcher_script = f"""#!/bin/bash
DIR="$( cd "$( dirname "${{BASH_SOURCE[0]}}" )/../../.." && pwd )"
cd "$DIR"

# Intentar abrir con el navegador la versión web completa o el servidor
if which python3 >/dev/null 2>&1; then
    python3 "$DIR/main.py" --web &
else
    open "$DIR/index.html"
fi
"""

launcher_path = os.path.join(MACOS_DIR, "launcher")
with open(launcher_path, "w") as f:
    f.write(launcher_script)

# Dar permisos de ejecución
st = os.stat(launcher_path)
os.chmod(launcher_path, st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)

print(f"✓ Aplicación nativa de macOS creada con éxito: {APP_NAME}")
