#!/usr/bin/env python3
"""
Lanzador Maestro: Predictor Macroeconómico
Permite ejecutar la versión web interactiva en el navegador o la aplicación de escritorio nativa.
"""

import sys
import os
import argparse
import webbrowser
import http.server
import socketserver
import threading
import time

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Silenciar logs ruidosos para una salida limpia
        pass


def start_web_server(port=PORT, auto_open=True):
    print("\n" + "="*65)
    print(" 🚀 INICIANDO PREDICTOR MACROECONÓMICO GLOBAL (VERSIÓN WEB)")
    print("="*65)
    
    server_address = ("", port)
    
    try:
        httpd = socketserver.TCPServer(server_address, Handler)
    except OSError:
        # Si el puerto 8080 está ocupado, probar 8081
        port = port + 1
        server_address = ("", port)
        httpd = socketserver.TCPServer(server_address, Handler)

    url = f"http://localhost:{port}/index.html"
    print(f"\n ✓ Servidor local activo en: {url}")
    print(" ✓ Abriendo en tu navegador predeterminado...")
    print(" ✓ Presiona Ctrl+C en cualquier momento para detener el servidor.\n")

    if auto_open:
        threading.Thread(target=lambda: (time.sleep(0.5), webbrowser.open(url))).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n 🛑 Servidor detenido. ¡Hasta pronto!")
        httpd.server_close()


def start_desktop_app():
    print("\n" + "="*65)
    print(" 🖥️ INICIANDO APLICACIÓN NATIVA DE ESCRITORIO (CUSTOMTKINTER)")
    print("="*65)
    try:
        from desktop_app import main as run_desktop
        run_desktop()
    except Exception as e:
        print(f"\n❌ Error al abrir la aplicación de escritorio: {e}")
        print("💡 Puedes abrir la versión web ejecutando: python3 main.py --web")


def run_cli_forecast(country_name="España"):
    from desktop_app import COUNTRIES_DATA, MacroeconomicEngine
    
    match = None
    for k, v in COUNTRIES_DATA.items():
        if country_name.lower() in k.lower():
            match = (k, v)
            break
            
    if not match:
        match = ("Personalizado 🌐", COUNTRIES_DATA["Personalizado 🌐"])

    name, data = match
    print("\n" + "="*65)
    print(f" 📈 PREDICCIÓN MACROECONÓMICA: {name}")
    print("="*65)
    print(f"• PIB Base: ${data['gdp']} B USD")
    print(f"• Tasa de Interés: {data['interest']}%")
    print(f"• Inflación: {data['inflation']}%")
    print(f"• Deuda / PIB: {data['debt']}%")
    print("-" * 65)

    res = MacroeconomicEngine.simulate({
        "gdp": data["gdp"],
        "interest": data["interest"],
        "inflation": data["inflation"],
        "growth": data["growth"],
        "unemployment": data["unemployment"],
        "debt": data["debt"],
        "fiscal": data["fiscal"],
        "scenario": "base",
        "horizon": 5
    })

    print(f"{'Año':<6} | {'PIB ($B)':<10} | {'Crecimiento':<12} | {'Inflación':<10} | {'Tasa Int.':<10} | {'Deuda/PIB':<10}")
    print("-" * 65)
    for i in range(len(res["years"])):
        print(f"{res['years'][i]:<6} | ${res['gdp_levels'][i]:<9.1f} | {res['growths'][i]:>+8.2f}%   | {res['inflations'][i]:>7.2f}%   | {res['interests'][i]:>7.2f}%   | {res['debts'][i]:>7.1f}%")
    print("-" * 65)
    print(f"✓ Crecimiento Acumulado 5 Años: +{res['cum_growth']}%")
    print(f"✓ Calificación de Riesgo Soberano: {res['rating']}")
    print(f"✓ Probabilidad de Recesión 24M: {res['recession_prob']}%")
    print("="*65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Predictor Macroeconómico Global")
    parser.add_argument("--web", action="store_true", help="Abrir la versión web en el navegador")
    parser.add_argument("--desktop", action="store_true", help="Abrir la versión de escritorio nativa")
    parser.add_argument("--cli", type=str, nargs="?", const="España", help="Ejecutar simulación rápida en consola (opcional: nombre del país)")
    parser.add_argument("--port", type=int, default=PORT, help="Puerto para el servidor web (por defecto: 8080)")

    args = parser.parse_args()

    if args.desktop:
        start_desktop_app()
    elif args.cli:
        run_cli_forecast(args.cli)
    elif args.web:
        start_web_server(port=args.port)
    else:
        # Por defecto abrir la versión web que es la más rica en visualizaciones
        start_web_server(port=args.port)


if __name__ == "__main__":
    main()
