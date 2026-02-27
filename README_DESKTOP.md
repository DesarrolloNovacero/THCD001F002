Resumen rápido para crear la app de escritorio (Windows)

1) Desarrollo
- Instala dependencias Python (virtualenv recomendado):
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r requirements.txt

- Levanta el backend y frontend por separado:
  Terminal A: python run_server.py
  Terminal B: npm run dev
  Terminal C: npm run electron:dev

2) Empaquetado (producción)
- Crear exe del backend con PyInstaller:
  pip install pyinstaller
  pyinstaller --onefile run_server.py --name run_server
  -- el exe generado estará en dist/run_server.exe

- Construir y empaquetar la app con electron-builder:
  npm install
  npm run electron:build

3) Notas
- La app usa `127.0.0.1:8000` para comunicarse con el backend local.
- Incluye `dist/run_server.exe` en `extraResources` para que Electron lo distribuya.
