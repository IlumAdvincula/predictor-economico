# 🌐 Predictor Macroeconómico Global

Una aplicación cuantitativa avanzada para modelar, simular y predecir la economía de **cualquier país a tu elección**, introduciendo variables fundamentales como el **PIB**, la **tasa de interés anual**, la **inflación**, la **deuda pública**, el **desempleo** y el **balance fiscal**.

La aplicación cuenta con dos modalidades completas:
1. **Versión Web Interactiva (Recomendada)**: Interfaz moderna con *glassmorphism*, gráficos dinámicos con Chart.js, cono de incertidumbre Monte Carlo, comparador de escenarios, semáforo de salud macroeconómica, y exportación a PDF y CSV.
2. **Aplicación de Escritorio Nativa**: Interfaz nativa para macOS/PC construida con `CustomTkinter` y `Matplotlib`.
3. **Modo CLI de Consola**: Ejecución rápida en terminal para análisis directo.

---

## 🚀 Cómo Ejecutar la Aplicación

### Opción 1: Versión Web (La más completa)
Puedes abrir la aplicación directamente en tu navegador o mediante el servidor local:

```bash
# Método rápido con el servidor Python integrado (abre tu navegador automáticamente):
python3 main.py --web

# O simplemente abriendo el archivo HTML directamente:
open index.html
```

### Opción 2: Versión de Escritorio Nativa (CustomTkinter + Matplotlib)
```bash
python3 main.py --desktop
```

### Opción 3: Predicción Rápida en Terminal (CLI)
```bash
# Simular España
python3 main.py --cli España

# Simular México
python3 main.py --cli México

# Simular Estados Unidos
python3 main.py --cli "Estados Unidos"
```

---

## 📊 Variables y Parámetros que Puedes Introducir

| Parámetro | Descripción | Unidad |
| :--- | :--- | :--- |
| **País de Selección** | Base de datos precargada con datos de más de 20 países (España, México, EE. UU., Argentina, Colombia, Chile, Perú, Brasil, Alemania, China, Japón...) o **País Personalizado**. | Selector |
| **PIB Actual** | Producto Interior Bruto nominal actual de la nación. | Miles de Millones USD ($B) |
| **Tasa de Interés Anual** | Tasa de referencia de política monetaria fijada por el Banco Central (ej. Fed, BCE, Banxico, BanRep, BCRA). | % Anual |
| **Tasa de Inflación** | Variación interanual del índice de precios al consumidor (IPC). | % Anual |
| **Crecimiento PIB Actual** | Ritmo de crecimiento económico reciente. | % Anual |
| **Tasa de Desempleo** | Porcentaje de la población activa desocupada. | % |
| **Deuda Pública / PIB** | Nivel total de endeudamiento del Estado en relación con el tamaño de su economía. | % del PIB |
| **Balance Fiscal Primario** | Diferencia entre ingresos públicos y gasto (superávit positivo, déficit negativo). | % del PIB |
| **Balanza por Cuenta Corriente**| Saldo neto del comercio exterior y transferencias. | % del PIB |
| **Tasa de Inversión Fija** | Formación bruta de capital productivo. | % del PIB |
| **Crecimiento Potencial** | Tasa tendencial de crecimiento de largo plazo determinada por la productividad y la demografía. | % Anual |
| **Escenarios de Shocks** | Escenario Base, Boom Económico, Recesión Mundial, Shock de Estanflación o Austeridad Fiscal. | Menú desplegable |
| **Horizonte Temporal** | Período de predicción a 3, 5 o 10 años. | Años |

---

## 🧠 Modelos Económicos y Fundamentos Teóricos

El motor de simulación no utiliza números aleatorios arbitrarios, sino un sistema integrado de ecuaciones macroeconómicas reconocidas por bancos centrales y organismos multilaterales (FMI, Banco Mundial):

### 1. Política Monetaria y Regla de Taylor
El Banco Central reacciona ajustando los tipos de interés según la inflación esperada y la brecha del producto (*Output Gap*):
$$i_t^{\text{Taylor}} = r^* + \pi_t + 0.6(\pi_t - \pi^*) + 0.4(g_t - g^*)$$
- $r^*$: Tasa de interés real neutral.
- $\pi_t - \pi^*$: Desviación de la inflación respecto a la meta.
- Se incorpora **suavizamiento de tasas** (*Interest Rate Smoothing*) para reflejar la gradualidad real de los bancos centrales.

### 2. Mecanismo de Transmisión IS (Demanda Agregada)
La tasa de interés real ex-ante ($r_t = i_t - \pi_t$) modula el ritmo de consumo e inversión privada. Si $r_t > r^*$, la política monetaria ejerce un freno deliberado sobre la actividad económica para enfriar las presiones de precios.

### 3. Sostenibilidad de la Deuda Pública (Ecuación de Domar)
Rige la evolución del ratio Deuda/PIB:
$$d_t = d_{t-1} \times \left(\frac{1 + i_t}{1 + g_t^{\text{nominal}}}\right) - \text{Balance Primario}_t$$
- Si la tasa de interés supera al crecimiento nominal ($i > g_{\text{nom}}$), se activa el peligroso **efecto bola de nieve**, requiriendo mayor superávit fiscal primario para evitar que la deuda se dispare.

### 4. Curva de Phillips Aumentada por Expectativas
Determina la trayectoria de la inflación en función de la inercia histórica, la credibilidad de la meta del banco central y las presiones de demanda (*holgura o sobrecalentamiento del PIB*).

### 5. Ley de Okun (Mercado Laboral)
Relaciona los desvíos del crecimiento respecto al potencial con la reducción o aumento del desempleo:
$$\Delta u_t = -\beta \cdot (g_t - g^*)$$

### 6. Simulación Estocástica Monte Carlo (Cono de Incertidumbre)
Ejecuta **500 iteraciones estocásticas** modelando shocks gaussianos y eventos imprevistos de cola (*Black Swans*) para generar las bandas de confianza del 80% (percentiles P10 y P90), visualizadas como un *fan chart* en la evolución del PIB.

---

## 📈 Indicadores y Diagnósticos Generados

1. **Evolución del PIB ($B USD) y Crecimiento Acumulado (%)**.
2. **Calificación de Riesgo Soberano**: Desde grado de inversión (**AAA, AA, A, BBB**) hasta grado especulativo (**BB, B, CCC, D**), junto con el diferencial de riesgo país (*Spread EMBI* en puntos básicos).
3. **Probabilidad de Recesión en 24 Meses**: Calculada mediante señales de curva de tipos, tasas reales y desaceleración.
4. **Índice de Estanflación (0 a 100)**: Evalúa el riesgo de convivir con estancamiento y alta inflación simultáneamente.
5. **Informe Ejecutivo Escrito por IA Cuantitativa**:
   - Diagnóstico de la postura monetaria (contractiva vs expansiva).
   - Diagnóstico de sostenibilidad fiscal y deuda.
   - Recomendaciones estratégicas de política pública.
6. **Comparador Lado a Lado**: Puedes pulsar **"Fijar Base"**, modificar las tasas de interés o la deuda, y ver instantáneamente los diferenciales $\Delta$ respecto a la política anterior.

---

## 📁 Estructura del Proyecto

```
.
├── index.html            # Aplicación web completa y moderna
├── main.py               # Lanzador principal (CLI, Web o Desktop)
├── desktop_app.py        # Aplicación GUI nativa en CustomTkinter y Matplotlib
├── css/
│   └── styles.css        # Estilos visuales, glassmorphism y optimización de impresión PDF
├── js/
│   ├── countries.js      # Base de datos macroeconómica de más de 20 países
│   ├── macro_model.js    # Motor de ecuaciones diferenciales y estocásticas
│   └── app.js            # Lógica reactiva de UI, Chart.js, comparador y exportaciones
└── README.md             # Documentación exhaustiva
```

---

## 📄 Exportación de Resultados
- **Descargar en CSV**: Exporta la serie temporal año por año con todas las variables numéricas para ser analizadas en Microsoft Excel, Google Sheets, R o Python.
- **Exportar en PDF / Imprimir**: Formato limpio corporativo adaptado para presentaciones y comités de inversión con un solo clic.
