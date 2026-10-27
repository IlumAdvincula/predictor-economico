/**
 * Aplicación de Predicción Macroeconómica
 * Control de interfaz, enlace de datos, renderizado de gráficos con Chart.js
 * y generación de informes ejecutivos.
 */

// Instancia del modelo económico
const macroModel = new MacroeconomicModel();

// Referencias a los gráficos
let gdpChart = null;
let inflationRatesChart = null;
let debtChart = null;
let growthGapChart = null;
let unemploymentChart = null;

// Estado de la aplicación
let currentSimulation = null;
let savedBaseline = null;
let isComparing = false;

// Configuración de paleta de colores para gráficos
const CHART_COLORS = {
  primary: '#38bdf8',
  primaryAlpha: 'rgba(56, 189, 248, 0.25)',
  secondary: '#818cf8',
  secondaryAlpha: 'rgba(129, 140, 248, 0.25)',
  accent: '#34d399',
  accentAlpha: 'rgba(52, 211, 153, 0.25)',
  warning: '#fbbf24',
  warningAlpha: 'rgba(251, 191, 36, 0.25)',
  danger: '#f43f5e',
  dangerAlpha: 'rgba(244, 63, 94, 0.25)',
  grid: 'rgba(255, 255, 255, 0.07)',
  text: '#94a3b8'
};

// Opciones globales por defecto para Chart.js
function getCommonChartOptions(title, yAxisLabel, isPercentage = true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: CHART_COLORS.text,
          boxWidth: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += isPercentage ? `${context.parsed.y.toFixed(2)}%` : context.parsed.y.toLocaleString('es-ES');
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: CHART_COLORS.grid },
        ticks: { color: CHART_COLORS.text }
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: CHART_COLORS.text
        },
        grid: { color: CHART_COLORS.grid },
        ticks: {
          color: CHART_COLORS.text,
          callback: function(value) {
            return isPercentage ? `${value}%` : value.toLocaleString('es-ES');
          }
        }
      }
    }
  };
}

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  initCountrySelector();
  setupEventListeners();
  loadCountryData('ES'); // Iniciar por defecto con España
});

/**
 * Llena el selector de países
 */
function initCountrySelector() {
  const select = document.getElementById('countrySelect');
  if (!select) return;

  select.innerHTML = '';
  COUNTRIES_DATABASE.forEach(country => {
    const option = document.createElement('option');
    option.value = country.id;
    option.textContent = `${country.flag} ${country.name} (${country.region})`;
    select.appendChild(option);
  });
}

/**
 * Carga los datos de un país en los campos de entrada
 */
function loadCountryData(countryId) {
  const country = COUNTRIES_DATABASE.find(c => c.id === countryId) || COUNTRIES_DATABASE[0];
  
  // Asignar valores
  setInputValue('gdp', country.gdp);
  setInputValue('interestRate', country.interestRate);
  setInputValue('inflation', country.inflation);
  setInputValue('gdpGrowth', country.gdpGrowth);
  setInputValue('unemployment', country.unemployment);
  setInputValue('debtToGdp', country.debtToGdp);
  setInputValue('fiscalBalance', country.fiscalBalance);
  setInputValue('currentAccount', country.currentAccount);
  setInputValue('investmentRate', country.investmentRate);
  setInputValue('potentialGrowth', country.potentialGrowth);
  setInputValue('populationGrowth', country.populationGrowth);
  setInputValue('targetInflation', country.targetInflation);
  setInputValue('neutralRealRate', country.neutralRealRate);

  // Actualizar etiqueta del país activo
  const activeCountryLabel = document.getElementById('activeCountryLabel');
  if (activeCountryLabel) {
    activeCountryLabel.textContent = `${country.flag} ${country.name}`;
  }

  const activeCountryRegion = document.getElementById('activeCountryRegion');
  if (activeCountryRegion) {
    activeCountryRegion.textContent = `${country.region} • Moneda: ${country.currency}`;
  }

  // Ejecutar simulación
  runSimulation();
}

/**
 * Asigna valor tanto al campo numérico como al slider correspondiente
 */
function setInputValue(id, val) {
  const numInput = document.getElementById(id);
  const rangeInput = document.getElementById(`${id}Range`);
  
  if (numInput) numInput.value = val;
  if (rangeInput) rangeInput.value = val;
}

/**
 * Sincroniza inputs y sliders y escucha cambios
 */
function setupEventListeners() {
  const fields = [
    'gdp', 'interestRate', 'inflation', 'gdpGrowth', 'unemployment',
    'debtToGdp', 'fiscalBalance', 'currentAccount', 'investmentRate',
    'potentialGrowth', 'populationGrowth', 'targetInflation', 'neutralRealRate'
  ];

  fields.forEach(field => {
    const numInput = document.getElementById(field);
    const rangeInput = document.getElementById(`${field}Range`);

    if (numInput && rangeInput) {
      numInput.addEventListener('input', () => {
        rangeInput.value = numInput.value;
        runSimulation();
      });

      rangeInput.addEventListener('input', () => {
        numInput.value = rangeInput.value;
        runSimulation();
      });
    }
  });

  // Selector de País
  const countrySelect = document.getElementById('countrySelect');
  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      loadCountryData(e.target.value);
    });
  }

  // Selector de Escenario
  const scenarioSelect = document.getElementById('scenarioSelect');
  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', () => {
      runSimulation();
    });
  }

  // Selector de Horizonte (Años)
  const horizonSelect = document.getElementById('horizonSelect');
  if (horizonSelect) {
    horizonSelect.addEventListener('change', () => {
      runSimulation();
    });
  }

  // Botón Guardar Escenario Base para Comparación
  const btnSaveBaseline = document.getElementById('btnSaveBaseline');
  if (btnSaveBaseline) {
    btnSaveBaseline.addEventListener('click', () => {
      saveCurrentAsBaseline();
    });
  }

  // Botón Limpiar Comparación
  const btnClearBaseline = document.getElementById('btnClearBaseline');
  if (btnClearBaseline) {
    btnClearBaseline.addEventListener('click', () => {
      clearBaseline();
    });
  }

  // Botón Exportar CSV
  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      exportToCsv();
    });
  }

  // Botón Imprimir / PDF
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

/**
 * Recopila los valores de la interfaz
 */
function getInputs() {
  const countrySelect = document.getElementById('countrySelect');
  const selectedCountryName = countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : "País";

  return {
    country: selectedCountryName,
    gdp: parseFloat(document.getElementById('gdp')?.value) || 1000,
    interestRate: parseFloat(document.getElementById('interestRate')?.value) || 5.0,
    inflation: parseFloat(document.getElementById('inflation')?.value) || 3.0,
    gdpGrowth: parseFloat(document.getElementById('gdpGrowth')?.value) || 2.0,
    unemployment: parseFloat(document.getElementById('unemployment')?.value) || 6.0,
    debtToGdp: parseFloat(document.getElementById('debtToGdp')?.value) || 60.0,
    fiscalBalance: parseFloat(document.getElementById('fiscalBalance')?.value) || -3.0,
    currentAccount: parseFloat(document.getElementById('currentAccount')?.value) || 0.0,
    investmentRate: parseFloat(document.getElementById('investmentRate')?.value) || 22.0,
    potentialGrowth: parseFloat(document.getElementById('potentialGrowth')?.value) || 2.2,
    populationGrowth: parseFloat(document.getElementById('populationGrowth')?.value) || 0.6,
    targetInflation: parseFloat(document.getElementById('targetInflation')?.value) || 2.5,
    neutralRealRate: parseFloat(document.getElementById('neutralRealRate')?.value) || 2.0,
    scenario: document.getElementById('scenarioSelect')?.value || 'base',
    horizon: parseInt(document.getElementById('horizonSelect')?.value) || 5
  };
}

/**
 * Ejecuta el modelo y actualiza toda la interfaz
 */
function runSimulation() {
  const params = getInputs();
  const results = macroModel.simulate(params);
  currentSimulation = results;

  updateKPIs(results);
  renderCharts(results);
  updateDiagnosis(results);
  updateDataTable(results);

  if (isComparing && savedBaseline) {
    renderComparisonIndicators(results, savedBaseline);
  }
}

/**
 * Actualiza tarjetas de KPIs
 */
function updateKPIs(results) {
  const kpi = results.kpi;
  const series = results.series;
  const lastIdx = series.gdpLevels.length - 1;

  // Crecimiento Acumulado
  const kpiGdpEl = document.getElementById('kpiCumulativeGdp');
  if (kpiGdpEl) {
    kpiGdpEl.textContent = `${kpi.cumulativeGdpGrowth >= 0 ? '+' : ''}${kpi.cumulativeGdpGrowth.toFixed(1)}%`;
    kpiGdpEl.className = `text-2xl font-bold ${kpi.cumulativeGdpGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }

  // PIB Final Nominal
  const kpiFinalGdpEl = document.getElementById('kpiFinalGdp');
  if (kpiFinalGdpEl) {
    kpiFinalGdpEl.textContent = `$${series.gdpLevels[lastIdx].toLocaleString('es-ES')} B USD`;
  }

  // Inflación Final
  const kpiInflationEl = document.getElementById('kpiFinalInflation');
  if (kpiInflationEl) {
    kpiInflationEl.textContent = `${kpi.finalInflation.toFixed(1)}%`;
    kpiInflationEl.className = `text-2xl font-bold ${kpi.finalInflation <= 3.5 ? 'text-emerald-400' : (kpi.finalInflation <= 6 ? 'text-amber-400' : 'text-rose-400')}`;
  }

  // Deuda Pública Final
  const kpiDebtEl = document.getElementById('kpiFinalDebt');
  if (kpiDebtEl) {
    kpiDebtEl.textContent = `${kpi.finalDebtToGdp.toFixed(1)}%`;
    kpiDebtEl.className = `text-2xl font-bold ${kpi.finalDebtToGdp <= 60 ? 'text-emerald-400' : (kpi.finalDebtToGdp <= 90 ? 'text-amber-400' : 'text-rose-400')}`;
  }

  // Tasa de Interés Final
  const kpiRateEl = document.getElementById('kpiFinalRate');
  if (kpiRateEl) {
    kpiRateEl.textContent = `${kpi.finalInterestRate.toFixed(1)}%`;
  }

  // Calificación de Riesgo País
  const kpiRatingEl = document.getElementById('kpiRiskRating');
  if (kpiRatingEl) {
    kpiRatingEl.textContent = kpi.riskRating;
    const isInvestmentGrade = ['AAA', 'AA', 'A', 'BBB'].includes(kpi.riskRating);
    kpiRatingEl.className = `text-2xl font-bold ${isInvestmentGrade ? 'text-emerald-400' : 'text-amber-400'}`;
  }

  const kpiSpreadEl = document.getElementById('kpiRiskSpread');
  if (kpiSpreadEl) {
    kpiSpreadEl.textContent = `Spread: +${kpi.riskSpreadBps} p.b.`;
  }

  // Probabilidad de Recesión
  const kpiRecessionEl = document.getElementById('kpiRecessionProb');
  if (kpiRecessionEl) {
    kpiRecessionEl.textContent = `${kpi.recessionProbability}%`;
    kpiRecessionEl.className = `text-2xl font-bold ${kpi.recessionProbability <= 25 ? 'text-emerald-400' : (kpi.recessionProbability <= 50 ? 'text-amber-400' : 'text-rose-400')}`;
  }

  // Índice de Estanflación
  const kpiStagflationEl = document.getElementById('kpiStagflation');
  if (kpiStagflationEl) {
    kpiStagflationEl.textContent = `${kpi.stagflationIndex}/100`;
    kpiStagflationEl.className = `text-2xl font-bold ${kpi.stagflationIndex <= 30 ? 'text-emerald-400' : (kpi.stagflationIndex <= 60 ? 'text-amber-400' : 'text-rose-400')}`;
  }
}

/**
 * Renderiza los 5 gráficos analíticos
 */
function renderCharts(results) {
  const years = results.years;
  const series = results.series;
  const mc = results.monteCarlo;

  // 1. Gráfico de PIB con Cono de Incertidumbre Monte Carlo
  renderGdpChart(years, series.gdpLevels, mc);

  // 2. Gráfico de Crecimiento del PIB vs Brecha de Producto
  renderGrowthGapChart(years, series.gdpGrowthRates, series.outputGaps);

  // 3. Gráfico de Inflación vs Tasa de Interés (Dilema del Banco Central)
  renderInflationRatesChart(years, series.inflationRates, series.interestRates, series.realInterestRates);

  // 4. Gráfico de Sostenibilidad de la Deuda vs Balance Fiscal
  renderDebtChart(years, series.debtToGdpRatios, series.fiscalBalances);

  // 5. Gráfico de Desempleo (Ley de Okun)
  renderUnemploymentChart(years, series.unemploymentRates);
}

function renderGdpChart(years, gdpLevels, mc) {
  const ctx = document.getElementById('gdpChart')?.getContext('2d');
  if (!ctx) return;

  if (gdpChart) gdpChart.destroy();

  const datasets = [
    {
      label: 'PIB Proyectado (Esperado)',
      data: gdpLevels,
      borderColor: CHART_COLORS.primary,
      backgroundColor: CHART_COLORS.primary,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.25,
      zIndex: 10
    }
  ];

  if (mc && mc.p90 && mc.p10) {
    datasets.push({
      label: 'Banda Superior (P90)',
      data: mc.p90,
      borderColor: 'rgba(56, 189, 248, 0.4)',
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
      tension: 0.25
    });
    datasets.push({
      label: 'Banda Inferior (P10)',
      data: mc.p10,
      borderColor: 'rgba(244, 63, 94, 0.4)',
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: '-1', // Rellena hasta la banda P90
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      tension: 0.25
    });
  }

  gdpChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: datasets
    },
    options: getCommonChartOptions('Evolución del PIB', 'Miles de millones USD', false)
  });
}

function renderGrowthGapChart(years, growthRates, outputGaps) {
  const ctx = document.getElementById('growthGapChart')?.getContext('2d');
  if (!ctx) return;

  if (growthGapChart) growthGapChart.destroy();

  growthGapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          type: 'line',
          label: 'Crecimiento PIB Real (%)',
          data: growthRates,
          borderColor: CHART_COLORS.accent,
          backgroundColor: CHART_COLORS.accent,
          borderWidth: 3,
          tension: 0.2,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Brecha del Producto (Output Gap %)',
          data: outputGaps,
          backgroundColor: outputGaps.map(v => v >= 0 ? 'rgba(52, 211, 153, 0.35)' : 'rgba(244, 63, 94, 0.35)'),
          borderColor: outputGaps.map(v => v >= 0 ? CHART_COLORS.accent : CHART_COLORS.danger),
          borderWidth: 1,
          yAxisID: 'y'
        }
      ]
    },
    options: getCommonChartOptions('Crecimiento y Brecha', '% Anual', true)
  });
}

function renderInflationRatesChart(years, inflation, rates, realRates) {
  const ctx = document.getElementById('inflationRatesChart')?.getContext('2d');
  if (!ctx) return;

  if (inflationRatesChart) inflationRatesChart.destroy();

  inflationRatesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Inflación Proyectada (%)',
          data: inflation,
          borderColor: CHART_COLORS.danger,
          backgroundColor: CHART_COLORS.dangerAlpha,
          borderWidth: 2.5,
          tension: 0.2
        },
        {
          label: 'Tasa de Interés Nominal (%)',
          data: rates,
          borderColor: CHART_COLORS.secondary,
          backgroundColor: CHART_COLORS.secondaryAlpha,
          borderWidth: 2.5,
          tension: 0.2
        },
        {
          label: 'Tasa de Interés Real (%)',
          data: realRates,
          borderColor: CHART_COLORS.warning,
          borderDash: [4, 4],
          borderWidth: 2,
          tension: 0.2
        }
      ]
    },
    options: getCommonChartOptions('Inflación vs Tasas', '% Anual', true)
  });
}

function renderDebtChart(years, debt, fiscal) {
  const ctx = document.getElementById('debtChart')?.getContext('2d');
  if (!ctx) return;

  if (debtChart) debtChart.destroy();

  debtChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Deuda Pública (% del PIB)',
          data: debt,
          borderColor: CHART_COLORS.warning,
          backgroundColor: CHART_COLORS.warningAlpha,
          borderWidth: 3,
          tension: 0.2,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Balance Fiscal (% del PIB)',
          data: fiscal,
          backgroundColor: fiscal.map(v => v >= 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(244, 63, 94, 0.4)'),
          borderColor: fiscal.map(v => v >= 0 ? '#34d399' : '#f43f5e'),
          borderWidth: 1,
          yAxisID: 'yFiscal'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: CHART_COLORS.text, boxWidth: 12, usePointStyle: true }
        }
      },
      scales: {
        x: {
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text }
        },
        y: {
          position: 'left',
          title: { display: true, text: 'Deuda / PIB (%)', color: CHART_COLORS.text },
          grid: { color: CHART_COLORS.grid },
          ticks: {
            color: CHART_COLORS.text,
            callback: (v) => `${v}%`
          }
        },
        yFiscal: {
          position: 'right',
          title: { display: true, text: 'Balance Fiscal (% PIB)', color: CHART_COLORS.text },
          grid: { drawOnChartArea: false },
          ticks: {
            color: CHART_COLORS.text,
            callback: (v) => `${v}%`
          }
        }
      }
    }
  });
}

function renderUnemploymentChart(years, unemployment) {
  const ctx = document.getElementById('unemploymentChart')?.getContext('2d');
  if (!ctx) return;

  if (unemploymentChart) unemploymentChart.destroy();

  unemploymentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Tasa de Desempleo (%)',
          data: unemployment,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          fill: true,
          borderWidth: 2.5,
          tension: 0.2
        }
      ]
    },
    options: getCommonChartOptions('Tasa de Desempleo', '% Población Activa', true)
  });
}

/**
 * Actualiza el informe y diagnóstico ejecutivo en prosa
 */
function updateDiagnosis(results) {
  const diag = results.diagnosis;

  const statusBadge = document.getElementById('healthStatusBadge');
  if (statusBadge) {
    statusBadge.textContent = diag.healthStatus;
    statusBadge.className = `px-3 py-1 text-sm font-semibold rounded-full border ${diag.statusClass}`;
  }

  const scenarioDesc = document.getElementById('scenarioDescription');
  if (scenarioDesc) {
    scenarioDesc.textContent = diag.scenarioNotes;
  }

  const monetaryDiag = document.getElementById('monetaryDiagnosisText');
  if (monetaryDiag) {
    monetaryDiag.textContent = diag.monetaryDiagnosis;
  }

  const fiscalDiag = document.getElementById('fiscalDiagnosisText');
  if (fiscalDiag) {
    fiscalDiag.textContent = diag.fiscalDiagnosis;
  }

  const recList = document.getElementById('recommendationsList');
  if (recList) {
    recList.innerHTML = '';
    diag.recommendations.forEach(rec => {
      const li = document.createElement('li');
      li.className = 'flex items-start space-x-2 text-slate-300 text-sm leading-relaxed';
      li.innerHTML = `
        <span class="text-sky-400 font-bold">•</span>
        <span>${rec}</span>
      `;
      recList.appendChild(li);
    });
  }
}

/**
 * Actualiza la tabla detallada de proyección año a año
 */
function updateDataTable(results) {
  const tableBody = document.getElementById('projectionTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  const years = results.years;
  const series = results.series;

  for (let i = 0; i < years.length; i++) {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'bg-slate-800/20 hover:bg-slate-800/50';

    const gdpGrowth = series.gdpGrowthRates[i];
    const growthColor = gdpGrowth >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium';

    tr.innerHTML = `
      <td class="px-4 py-2.5 font-semibold text-slate-200">${years[i]} ${i === 0 ? '<span class="text-xs text-sky-400 ml-1">(Base)</span>' : ''}</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">$${series.gdpLevels[i].toLocaleString('es-ES')} B</td>
      <td class="px-4 py-2.5 text-right font-mono ${growthColor}">${gdpGrowth >= 0 ? '+' : ''}${gdpGrowth.toFixed(2)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.inflationRates[i].toFixed(2)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.interestRates[i].toFixed(2)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.realInterestRates[i].toFixed(2)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.unemploymentRates[i].toFixed(2)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.debtToGdpRatios[i].toFixed(1)}%</td>
      <td class="px-4 py-2.5 text-right font-mono text-slate-300">${series.fiscalBalances[i].toFixed(1)}%</td>
    `;
    tableBody.appendChild(tr);
  }
}

/**
 * Guarda el escenario actual como referencia para comparación lado a lado
 */
function saveCurrentAsBaseline() {
  if (!currentSimulation) return;
  savedBaseline = JSON.parse(JSON.stringify(currentSimulation));
  isComparing = true;

  const compareBanner = document.getElementById('comparisonBanner');
  if (compareBanner) compareBanner.classList.remove('hidden');

  const baselineName = document.getElementById('savedBaselineName');
  if (baselineName) {
    const inputs = getInputs();
    baselineName.textContent = `${inputs.country} (${inputs.scenario})`;
  }

  renderComparisonIndicators(currentSimulation, savedBaseline);
}

/**
 * Limpia el estado de comparación
 */
function clearBaseline() {
  savedBaseline = null;
  isComparing = false;
  const compareBanner = document.getElementById('comparisonBanner');
  if (compareBanner) compareBanner.classList.add('hidden');

  const comparisonBadges = document.querySelectorAll('.comparison-badge');
  comparisonBadges.forEach(el => el.remove());
}

/**
 * Renderiza etiquetas diferenciales vs el escenario guardado
 */
function renderComparisonIndicators(current, baseline) {
  if (!current || !baseline) return;

  const diffGdp = current.kpi.cumulativeGdpGrowth - baseline.kpi.cumulativeGdpGrowth;
  const diffDebt = current.kpi.finalDebtToGdp - baseline.kpi.finalDebtToGdp;
  const diffInf = current.kpi.finalInflation - baseline.kpi.finalInflation;

  updateDiffBadge('kpiCumulativeGdp', diffGdp, '% vs Base', true);
  updateDiffBadge('kpiFinalDebt', diffDebt, '% vs Base', false);
  updateDiffBadge('kpiFinalInflation', diffInf, '% vs Base', false);
}

function updateDiffBadge(parentId, diff, suffix, higherIsBetter) {
  const parent = document.getElementById(parentId);
  if (!parent) return;

  let existing = parent.parentNode.querySelector('.comparison-badge');
  if (!existing) {
    existing = document.createElement('span');
    existing.className = 'comparison-badge text-xs px-2 py-0.5 ml-2 rounded-full font-medium inline-block';
    parent.parentNode.appendChild(existing);
  }

  const isPositive = diff > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  const colorClass = Math.abs(diff) < 0.1 
    ? 'bg-slate-700 text-slate-300' 
    : (isGood ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30');

  existing.className = `comparison-badge text-xs px-2 py-0.5 ml-2 rounded-full font-medium inline-block ${colorClass}`;
  existing.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ${suffix}`;
}

/**
 * Exporta la serie temporal a formato CSV para Excel o análisis externo
 */
function exportToCsv() {
  if (!currentSimulation) return;

  const years = currentSimulation.years;
  const s = currentSimulation.series;
  const inputs = getInputs();

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += `Simulacion Macroeconomica - ${inputs.country}\n`;
  csvContent += `Escenario: ${inputs.scenario}, Tasa de Interes Inicial: ${inputs.interestRate}%, Inflacion Inicial: ${inputs.inflation}%\n\n`;
  csvContent += "Ano,PIB_Miles_Millones_USD,Crecimiento_PIB_Real_Pct,Inflacion_Pct,Tasa_Interes_Nominal_Pct,Tasa_Interes_Real_Pct,Desempleo_Pct,Deuda_PIB_Pct,Balance_Fiscal_Pct,Brecha_Producto_Pct\n";

  for (let i = 0; i < years.length; i++) {
    const row = [
      years[i],
      s.gdpLevels[i],
      s.gdpGrowthRates[i],
      s.inflationRates[i],
      s.interestRates[i],
      s.realInterestRates[i],
      s.unemploymentRates[i],
      s.debtToGdpRatios[i],
      s.fiscalBalances[i],
      s.outputGaps[i]
    ].join(",");
    csvContent += row + "\n";
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `prediccion_economica_${inputs.country.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
