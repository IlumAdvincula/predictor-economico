#!/usr/bin/env python3
"""
Aplicación de Escritorio: Predictor Macroeconómico
Interfaz gráfica nativa construida con CustomTkinter y Matplotlib.
Permite simular la economía de cualquier país en función del PIB, tasas de interés, etc.
"""

import os
import sys

# Prevenir avisos de permisos de caché en matplotlib
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib_macro_cache"

import tkinter as tk
import customtkinter as ctk
import numpy as np
import matplotlib
matplotlib.use("TkAgg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import webbrowser

# Configuración visual de CustomTkinter
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

# Base de datos de países de muestra
COUNTRIES_DATA = {
    "España 🇪🇸": {
        "gdp": 1650.0, "interest": 3.25, "inflation": 2.3, "growth": 2.4,
        "unemployment": 11.5, "debt": 105.0, "fiscal": -3.2, "neutral": 1.25, "target_inf": 2.0, "potential": 1.8
    },
    "México 🇲🇽": {
        "gdp": 1810.0, "interest": 10.25, "inflation": 4.5, "growth": 1.6,
        "unemployment": 2.8, "debt": 51.5, "fiscal": -4.8, "neutral": 2.75, "target_inf": 3.0, "potential": 2.1
    },
    "Estados Unidos 🇺🇸": {
        "gdp": 28780.0, "interest": 4.75, "inflation": 2.6, "growth": 2.8,
        "unemployment": 4.1, "debt": 123.0, "fiscal": -6.4, "neutral": 1.5, "target_inf": 2.0, "potential": 2.2
    },
    "Argentina 🇦🇷": {
        "gdp": 640.0, "interest": 35.0, "inflation": 45.0, "growth": -1.5,
        "unemployment": 7.6, "debt": 85.0, "fiscal": 0.5, "neutral": 5.0, "target_inf": 8.0, "potential": 2.5
    },
    "Colombia 🇨🇴": {
        "gdp": 395.0, "interest": 9.75, "inflation": 5.4, "growth": 1.8,
        "unemployment": 9.2, "debt": 54.0, "fiscal": -4.5, "neutral": 2.8, "target_inf": 3.0, "potential": 2.8
    },
    "Chile 🇨🇱": {
        "gdp": 345.0, "interest": 5.25, "inflation": 4.1, "growth": 2.3,
        "unemployment": 8.5, "debt": 40.5, "fiscal": -2.3, "neutral": 2.0, "target_inf": 3.0, "potential": 2.3
    },
    "Brasil 🇧🇷": {
        "gdp": 2330.0, "interest": 11.25, "inflation": 4.4, "growth": 3.0,
        "unemployment": 6.8, "debt": 78.5, "fiscal": -7.5, "neutral": 4.5, "target_inf": 3.0, "potential": 2.0
    },
    "Alemania 🇩🇪": {
        "gdp": 4590.0, "interest": 3.25, "inflation": 2.1, "growth": 0.2,
        "unemployment": 6.0, "debt": 63.5, "fiscal": -1.8, "neutral": 1.0, "target_inf": 2.0, "potential": 1.0
    },
    "China 🇨🇳": {
        "gdp": 18530.0, "interest": 3.1, "inflation": 0.4, "growth": 4.8,
        "unemployment": 5.1, "debt": 83.0, "fiscal": -7.1, "neutral": 2.0, "target_inf": 2.5, "potential": 4.2
    },
    "Japón 🇯🇵": {
        "gdp": 4110.0, "interest": 0.5, "inflation": 2.5, "growth": 0.7,
        "unemployment": 2.5, "debt": 255.0, "fiscal": -4.9, "neutral": 0.0, "target_inf": 2.0, "potential": 0.6
    },
    "Personalizado 🌐": {
        "gdp": 1000.0, "interest": 5.0, "inflation": 3.0, "growth": 2.0,
        "unemployment": 6.0, "debt": 60.0, "fiscal": -3.0, "neutral": 2.0, "target_inf": 2.5, "potential": 2.2
    }
}


class MacroeconomicEngine:
    """Motor de simulación matemática macroeconómica."""
    @staticmethod
    def simulate(params):
        horizon = int(params.get("horizon", 5))
        base_year = 2025
        years = [base_year + t for t in range(horizon + 1)]

        gdp = float(params.get("gdp", 1000.0))
        interest = float(params.get("interest", 5.0))
        inflation = float(params.get("inflation", 3.0))
        growth = float(params.get("growth", 2.0))
        unemployment = float(params.get("unemployment", 6.0))
        debt = float(params.get("debt", 60.0))
        fiscal = float(params.get("fiscal", -3.0))
        neutral_rate = float(params.get("neutral", 2.0))
        target_inf = float(params.get("target_inf", 2.5))
        potential_g = float(params.get("potential", 2.2))
        scenario = params.get("scenario", "base")

        gdp_levels = [gdp]
        growths = [growth]
        inflations = [inflation]
        interests = [interest]
        debts = [debt]
        unemployments = [unemployment]

        curr_gdp = gdp
        p_growth = growth
        p_inf = inflation
        p_int = interest
        p_debt = debt
        p_unemp = unemployment

        for t in range(1, horizon + 1):
            # 1. Shocks de escenario
            g_shock = 0.0
            inf_shock = 0.0
            if scenario == "optimistic":
                g_shock = 0.7
                inf_shock = -0.3
            elif scenario == "pessimistic":
                g_shock = -1.8 if t == 1 else -0.8
                inf_shock = 0.4
            elif scenario == "stagflation":
                g_shock = -2.2
                inf_shock = 3.0 if t <= 2 else 1.2

            # 2. Transmisión monetaria (IS Gap)
            real_rate = p_int - p_inf
            monetary_gap = real_rate - neutral_rate
            debt_drag = max(0.0, (p_debt - 80.0) * 0.015) if p_debt > 80.0 else 0.0

            new_growth = potential_g - (0.35 * monetary_gap) - debt_drag + (0.30 * (p_growth - potential_g)) + g_shock
            new_growth = max(-6.0, min(12.0, new_growth))
            output_gap = new_growth - potential_g

            # 3. Curva de Phillips
            new_inf = (0.50 * p_inf) + (0.50 * target_inf) + (0.28 * output_gap) + inf_shock
            new_inf = max(0.2, new_inf)

            # 4. Regla de Taylor
            taylor_rate = neutral_rate + new_inf + 0.6 * (new_inf - target_inf) + 0.4 * output_gap
            new_int = max(0.0, (0.60 * p_int) + (0.40 * taylor_rate))

            # 5. Ley de Okun
            new_unemp = max(2.0, p_unemp - 0.4 * (new_growth - potential_g))

            # 6. Dinámica de Deuda (Ecuación de Domar)
            nom_growth = ((1.0 + new_growth / 100.0) * (1.0 + new_inf / 100.0) - 1.0) * 100.0
            snowball = ((1.0 + new_int / 100.0) / (1.0 + nom_growth / 100.0)) - 1.0
            new_debt = max(5.0, (p_debt * (1.0 + snowball)) - fiscal)

            curr_gdp = curr_gdp * (1.0 + nom_growth / 100.0)

            gdp_levels.append(round(curr_gdp, 1))
            growths.append(round(new_growth, 2))
            inflations.append(round(new_inf, 2))
            interests.append(round(new_int, 2))
            debts.append(round(new_debt, 1))
            unemployments.append(round(new_unemp, 2))

            p_growth, p_inf, p_int, p_debt, p_unemp = new_growth, new_inf, new_int, new_debt, new_unemp

        # Evaluación de riesgo crediticio
        final_debt = debts[-1]
        final_inf = inflations[-1]
        avg_g = sum(growths[1:]) / horizon

        score = 100.0 - (max(0.0, final_debt - 60.0) * 0.45) - (max(0.0, final_inf - 3.0) * 2.5) + (avg_g * 2.0)
        rating = "AAA" if score > 88 else ("AA" if score > 80 else ("A" if score > 70 else ("BBB" if score > 58 else ("BB" if score > 45 else "B/CCC"))))
        recession_prob = int(max(8, min(92, 18 + max(0.0, (interests[1] - inflations[1] - 2.0) * 8.0) + (25 if growths[1] < 1.0 else 0))))

        return {
            "years": years,
            "gdp_levels": gdp_levels,
            "growths": growths,
            "inflations": inflations,
            "interests": interests,
            "debts": debts,
            "unemployments": unemployments,
            "cum_growth": round(((gdp_levels[-1] / gdp_levels[0]) - 1.0) * 100.0, 1),
            "final_debt": final_debt,
            "final_inf": final_inf,
            "final_int": interests[-1],
            "rating": rating,
            "recession_prob": recession_prob
        }


class EconomicPredictorApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Predictor Macroeconómico Cuantitativo")
        self.geometry("1280x820")
        self.minsize(1100, 750)

        # Configurar Grid
        self.grid_columnconfigure(0, weight=0, minsize=340)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.build_sidebar()
        self.build_main_dashboard()

        # Iniciar con España
        self.on_country_change("España 🇪🇸")

    def build_sidebar(self):
        # Panel lateral de controles
        self.sidebar = ctk.CTkScrollableFrame(self, width=340, corner_radius=0, fg_color="#111827")
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)

        title_label = ctk.CTkLabel(
            self.sidebar, text="📊 Variables Económicas", 
            font=ctk.CTkFont(size=18, weight="bold"), text_color="#38bdf8"
        )
        title_label.pack(pady=(15, 5), padx=15, anchor="w")

        desc_label = ctk.CTkLabel(
            self.sidebar, text="Selecciona un país o introduce valores manuales.", 
            font=ctk.CTkFont(size=11), text_color="#94a3b8"
        )
        desc_label.pack(pady=(0, 15), padx=15, anchor="w")

        # Selector de País
        ctk.CTkLabel(self.sidebar, text="País de Referencia:", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=15, anchor="w")
        self.country_menu = ctk.CTkOptionMenu(
            self.sidebar, values=list(COUNTRIES_DATA.keys()),
            command=self.on_country_change, fg_color="#1e293b", button_color="#0284c7"
        )
        self.country_menu.pack(padx=15, pady=(4, 12), fill="x")

        # Selector de Escenario
        ctk.CTkLabel(self.sidebar, text="Escenario Macroeconómico:", font=ctk.CTkFont(size=12, weight="bold")).pack(padx=15, anchor="w")
        self.scenario_menu = ctk.CTkOptionMenu(
            self.sidebar, values=["base", "optimistic", "pessimistic", "stagflation"],
            command=lambda _: self.run_prediction(), fg_color="#1e293b", button_color="#0284c7"
        )
        self.scenario_menu.set("base")
        self.scenario_menu.pack(padx=15, pady=(4, 15), fill="x")

        # Variables con sliders y entries
        self.entries = {}
        self.sliders = {}

        self.create_numeric_control("gdp", "PIB Actual (Miles de M. USD):", 10.0, 30000.0, 1650.0)
        self.create_numeric_control("interest", "Tasa de Interés Anual (%):", 0.0, 45.0, 3.25)
        self.create_numeric_control("inflation", "Tasa de Inflación Anual (%):", 0.0, 40.0, 2.3)
        self.create_numeric_control("growth", "Crecimiento PIB Actual (%):", -5.0, 10.0, 2.4)
        self.create_numeric_control("unemployment", "Tasa de Desempleo (%):", 1.0, 25.0, 11.5)
        self.create_numeric_control("debt", "Deuda Pública (% PIB):", 10.0, 250.0, 105.0)
        self.create_numeric_control("fiscal", "Balance Fiscal (% PIB):", -12.0, 5.0, -3.2)

        # Botón para abrir versión Web
        web_btn = ctk.CTkButton(
            self.sidebar, text="🌐 Abrir Versión Web Completa",
            fg_color="#0284c7", hover_color="#0369a1",
            command=self.open_web_version
        )
        web_btn.pack(padx=15, pady=(20, 20), fill="x")

    def create_numeric_control(self, key, label_text, min_val, max_val, default_val):
        frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame.pack(padx=15, pady=6, fill="x")

        top_f = ctk.CTkFrame(frame, fg_color="transparent")
        top_f.pack(fill="x")

        lbl = ctk.CTkLabel(top_f, text=label_text, font=ctk.CTkFont(size=11), text_color="#e2e8f0")
        lbl.pack(side="left")

        entry = ctk.CTkEntry(top_f, width=70, height=24, font=ctk.CTkFont(size=11))
        entry.insert(0, str(default_val))
        entry.pack(side="right")
        self.entries[key] = entry

        slider = ctk.CTkSlider(
            frame, from_=min_val, to=max_val,
            number_of_steps=100, height=14,
            progress_color="#38bdf8", button_color="#0ea5e9"
        )
        slider.set(default_val)
        slider.pack(fill="x", pady=(3, 0))
        self.sliders[key] = slider

        def on_slider(val):
            val_round = round(val, 2 if key in ["interest", "inflation", "growth"] else 1)
            entry.delete(0, tk.END)
            entry.insert(0, str(val_round))
            self.run_prediction()

        def on_entry(_):
            try:
                v = float(entry.get())
                slider.set(v)
                self.run_prediction()
            except ValueError:
                pass

        slider.configure(command=on_slider)
        entry.bind("<Return>", on_entry)

    def build_main_dashboard(self):
        # Área principal para KPIs y Gráficos Matplotlib
        self.main_frame = ctk.CTkFrame(self, fg_color="#0b0f19")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        self.main_frame.grid_rowconfigure(1, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        # 1. Barra de KPIs
        self.kpi_frame = ctk.CTkFrame(self.main_frame, fg_color="#111827", corner_radius=10)
        self.kpi_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        self.kpi_frame.grid_columnconfigure((0, 1, 2, 3, 4), weight=1)

        self.kpi_widgets = {}
        kpi_defs = [
            ("cum_growth", "Crecimiento Acumulado", "+0.0%"),
            ("final_debt", "Deuda Final / PIB", "0.0%"),
            ("final_inf", "Inflación Final", "0.0%"),
            ("rating", "Rating Crediticio", "AAA"),
            ("recession", "Riesgo Recesión", "0%")
        ]

        for i, (k_id, k_title, k_default) in enumerate(kpi_defs):
            f = ctk.CTkFrame(self.kpi_frame, fg_color="#1e293b", corner_radius=8)
            f.grid(row=0, column=i, padx=6, pady=8, sticky="ew")

            t_lbl = ctk.CTkLabel(f, text=k_title, font=ctk.CTkFont(size=10), text_color="#94a3b8")
            t_lbl.pack(pady=(4, 0))

            v_lbl = ctk.CTkLabel(f, text=k_default, font=ctk.CTkFont(size=16, weight="bold"), text_color="#38bdf8")
            v_lbl.pack(pady=(0, 4))
            self.kpi_widgets[k_id] = v_lbl

        # 2. Lienzo Matplotlib (4 Subplots)
        self.fig, self.axs = plt.subplots(2, 2, figsize=(9, 6), facecolor="#0b0f19")
        self.fig.tight_layout(pad=3.2)
        plt.subplots_adjust(hspace=0.35, wspace=0.25)

        self.canvas = FigureCanvasTkAgg(self.fig, master=self.main_frame)
        self.canvas.get_tk_widget().grid(row=1, column=0, sticky="nsew", padx=10, pady=5)

    def on_country_change(self, country_name):
        data = COUNTRIES_DATA.get(country_name, COUNTRIES_DATA["Personalizado 🌐"])
        for k in ["gdp", "interest", "inflation", "growth", "unemployment", "debt", "fiscal"]:
            val = data[k]
            self.entries[k].delete(0, tk.END)
            self.entries[k].insert(0, str(val))
            self.sliders[k].set(val)
        self.run_prediction()

    def run_prediction(self):
        try:
            params = {
                "gdp": float(self.entries["gdp"].get()),
                "interest": float(self.entries["interest"].get()),
                "inflation": float(self.entries["inflation"].get()),
                "growth": float(self.entries["growth"].get()),
                "unemployment": float(self.entries["unemployment"].get()),
                "debt": float(self.entries["debt"].get()),
                "fiscal": float(self.entries["fiscal"].get()),
                "scenario": self.scenario_menu.get(),
                "horizon": 5
            }
        except ValueError:
            return

        res = MacroeconomicEngine.simulate(params)

        # Actualizar KPIs
        self.kpi_widgets["cum_growth"].configure(text=f"+{res['cum_growth']}%" if res['cum_growth'] >= 0 else f"{res['cum_growth']}%")
        self.kpi_widgets["final_debt"].configure(text=f"{res['final_debt']}%")
        self.kpi_widgets["final_inf"].configure(text=f"{res['final_inf']}%")
        self.kpi_widgets["rating"].configure(text=res["rating"])
        self.kpi_widgets["recession"].configure(text=f"{res['recession_prob']}%")

        # Dibujar Gráficos
        years = res["years"]
        
        # Limpiar ejes
        for ax in self.axs.flat:
            ax.clear()
            ax.set_facecolor("#111827")
            ax.tick_params(colors="#94a3b8", labelsize=8)
            ax.grid(True, linestyle="--", alpha=0.2, color="#cbd5e1")
            for spine in ax.spines.values():
                spine.set_color("#374151")

        # 1. PIB Proyectado
        self.axs[0, 0].plot(years, res["gdp_levels"], color="#38bdf8", linewidth=2.5, marker="o", markersize=4)
        self.axs[0, 0].set_title("Evolución del PIB ($ Miles M. USD)", color="#f8fafc", fontsize=10, weight="bold")

        # 2. Inflación vs Tasa de Interés
        self.axs[0, 1].plot(years, res["inflations"], color="#f43f5e", linewidth=2, label="Inflación %")
        self.axs[0, 1].plot(years, res["interests"], color="#818cf8", linewidth=2, label="Tasa Interés %")
        self.axs[0, 1].legend(loc="upper right", facecolor="#1e293b", edgecolor="#374151", labelcolor="#e2e8f0", fontsize=8)
        self.axs[0, 1].set_title("Inflación vs Tasa de Interés", color="#f8fafc", fontsize=10, weight="bold")

        # 3. Deuda / PIB
        self.axs[1, 0].plot(years, res["debts"], color="#fbbf24", linewidth=2.5, marker="s", markersize=4)
        self.axs[1, 0].set_title("Deuda Pública (% del PIB)", color="#f8fafc", fontsize=10, weight="bold")

        # 4. Crecimiento del PIB Real
        bars = self.axs[1, 1].bar(years, res["growths"], color=["#34d399" if g >= 0 else "#f43f5e" for g in res["growths"]], width=0.55)
        self.axs[1, 1].set_title("Crecimiento PIB Real (%)", color="#f8fafc", fontsize=10, weight="bold")

        self.canvas.draw_idle()

    def open_web_version(self):
        curr_dir = os.path.dirname(os.path.abspath(__file__))
        html_path = os.path.join(curr_dir, "index.html")
        webbrowser.open(f"file://{html_path}")


def main():
    app = EconomicPredictorApp()
    app.mainloop()


if __name__ == "__main__":
    main()
