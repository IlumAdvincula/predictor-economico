/**
 * Motor de Simulación Macroeconómica Avanzada
 * Modela la interacción entre política monetaria (Regla de Taylor),
 * política fiscal (Dinámica de deuda de Domar), curva de Phillips,
 * ley de Okun y crecimiento potencial (Solow-Swan).
 */

class MacroeconomicModel {
  constructor() {
    this.DEFAULT_HORIZON = 5;
    this.MAX_HORIZON = 10;
  }

  /**
   * Ejecuta la simulación económica determinista y estocástica
   * @param {Object} params Parámetros de entrada
   * @returns {Object} Resultados de proyección año a año, métricas y diagnósticos
   */
  simulate(params) {
    const horizon = Math.min(Math.max(params.horizon || this.DEFAULT_HORIZON, 3), 10);
    const country = params.country || "País";
    const initialGdp = Number(params.gdp) || 1000; // Miles de millones USD
    const initialInterest = Number(params.interestRate) || 5.0; // %
    const initialInflation = Number(params.inflation) || 3.0; // %
    const initialGrowth = Number(params.gdpGrowth) !== undefined ? Number(params.gdpGrowth) : 2.0; // %
    const initialUnemployment = Number(params.unemployment) || 6.0; // %
    const initialDebtToGdp = Number(params.debtToGdp) || 60.0; // %
    const fiscalBalance = Number(params.fiscalBalance) !== undefined ? Number(params.fiscalBalance) : -3.0; // % PIB
    const currentAccount = Number(params.currentAccount) !== undefined ? Number(params.currentAccount) : 0.0; // % PIB
    const investmentRate = Number(params.investmentRate) || 22.0; // % PIB
    const targetInflation = Number(params.targetInflation) || 2.5; // %
    const neutralRealRate = Number(params.neutralRealRate) || 2.0; // %
    const potentialGrowth = Number(params.potentialGrowth) || 2.2; // %
    const populationGrowth = Number(params.populationGrowth) !== undefined ? Number(params.populationGrowth) : 0.6; // %
    const scenario = params.scenario || "base"; // "base", "optimistic", "pessimistic", "stagflation", "fiscal_austerity"

    // Factores de ajuste según escenario
    const scenarioModifiers = this.getScenarioModifiers(scenario);

    // Vectores de proyección anual
    const years = [];
    const gdpLevels = []; // PIB en miles de millones USD
    const gdpGrowthRates = []; // %
    const inflationRates = []; // %
    const interestRates = []; // %
    const realInterestRates = []; // %
    const unemploymentRates = []; // %
    const debtToGdpRatios = []; // %
    const fiscalBalances = []; // %
    const outputGaps = []; // %

    // Año base (Año 0)
    const baseYear = new Date().getFullYear();
    years.push(baseYear);
    gdpLevels.push(initialGdp);
    gdpGrowthRates.push(initialGrowth);
    inflationRates.push(initialInflation);
    interestRates.push(initialInterest);
    realInterestRates.push(initialInterest - initialInflation);
    unemploymentRates.push(initialUnemployment);
    debtToGdpRatios.push(initialDebtToGdp);
    fiscalBalances.push(fiscalBalance);
    outputGaps.push(initialGrowth - potentialGrowth);

    // Variables de estado
    let currentGdp = initialGdp;
    let prevGrowth = initialGrowth;
    let prevInflation = initialInflation;
    let prevInterest = initialInterest;
    let prevUnemployment = initialUnemployment;
    let prevDebt = initialDebtToGdp;
    let prevFiscal = fiscalBalance;

    // Simulación paso a paso anual
    for (let t = 1; t <= horizon; t++) {
      const year = baseYear + t;
      years.push(year);

      // 1. Crecimiento Potencial base (Solow modificado)
      const investmentBonus = Math.max(-1.0, (investmentRate - 21.0) * 0.08);
      const effPotentialGrowth = Math.max(0.5, potentialGrowth + investmentBonus + scenarioModifiers.potentialGrowthShock(t));

      // 2. Tasa de Interés Real Ex-ante y Postura Monetaria
      const realRateExAnte = prevInterest - prevInflation;
      const effectiveNeutralRate = neutralRealRate + (prevDebt > 80 ? (prevDebt - 80) * 0.02 : 0);
      const monetaryStanceGap = realRateExAnte - effectiveNeutralRate; // Positivo = Contractiva

      // 3. Arrastre de deuda (Efecto expulsión / Crowding out si la deuda es elevada)
      const debtThreshold = 80.0;
      const debtDrag = prevDebt > debtThreshold ? Math.min(1.5, (prevDebt - debtThreshold) * 0.015) : 0;

      // 4. Impulso fiscal
      const fiscalDelta = prevFiscal - fiscalBalances[0]; // Variación respecto al inicio
      const fiscalImpulse = fiscalDelta * 0.35 + scenarioModifiers.fiscalShock(t);

      // 5. Crecimiento del PIB Real efectivo
      // Mecanismo IS: El crecimiento se desacelera con tasas reales altas y arrastre de deuda
      const interestElasticity = 0.38;
      const cyclicalInertia = 0.30;
      let newGrowth = effPotentialGrowth 
        - (interestElasticity * monetaryStanceGap) 
        + fiscalImpulse 
        - debtDrag 
        + (cyclicalInertia * (prevGrowth - effPotentialGrowth))
        + scenarioModifiers.gdpGrowthShock(t);

      // Suelo para evitar anomalías irrealistas en simulación determinista estándar
      newGrowth = Math.max(-8.0, Math.min(12.0, newGrowth));

      // 6. Brecha del Producto (Output Gap)
      const outputGap = newGrowth - effPotentialGrowth;

      // 7. Dinámica de Inflación (Curva de Phillips Aumentada por Expectativas)
      // π_t = α * π_{t-1} + (1 - α) * π_target + κ * OutputGap + shock_oferta
      const persistenceAlpha = 0.50;
      const phillipsKappa = 0.28;
      let newInflation = (persistenceAlpha * prevInflation) 
        + ((1 - persistenceAlpha) * targetInflation) 
        + (phillipsKappa * outputGap) 
        + scenarioModifiers.inflationShock(t);

      newInflation = Math.max(0.1, newInflation);

      // 8. Regla de Taylor para la Tasa de Interés del Banco Central
      // i_Taylor = r* + π_t + 0.5*(π_t - π_target) + 0.5*OutputGap
      const taylorRate = effectiveNeutralRate + newInflation 
        + 0.6 * (newInflation - targetInflation) 
        + 0.4 * outputGap;

      // Suavizamiento de tasas (Interest Rate Smoothing): los bancos centrales no mueven bruscamente la tasa
      const smoothingRho = 0.60;
      let newInterest = (smoothingRho * prevInterest) + ((1 - smoothingRho) * taylorRate);
      newInterest = Math.max(0.0, Math.min(50.0, newInterest)); // Zero Lower Bound

      // Tasa de interés real ex-post
      const newRealRate = newInterest - newInflation;

      // 9. Ley de Okun para el Desempleo
      // Δu = - β * (g - g*)
      const okunBeta = 0.40;
      const nairu = Math.max(3.0, initialUnemployment * 0.9); // Tasa estructural
      let newUnemployment = prevUnemployment - (okunBeta * (newGrowth - effPotentialGrowth)) + 0.15 * (nairu - prevUnemployment);
      newUnemployment = Math.max(1.8, Math.min(28.0, newUnemployment));

      // 10. Dinámica de la Deuda Pública sobre PIB (Ecuación de Domar)
      // d_t = d_{t-1} * (1 + i_t) / (1 + g_nom_t) - Balance_Primario_t
      const nominalGrowth = ((1 + newGrowth / 100) * (1 + newInflation / 100) - 1) * 100;
      const nominalInterest = newInterest;
      
      // Evolución gradual del déficit fiscal hacia meta o según escenario
      let currentFiscal = prevFiscal + (scenarioModifiers.fiscalAdjustment(t));
      currentFiscal = Math.max(-12.0, Math.min(6.0, currentFiscal));

      const snowballEffect = ((1 + nominalInterest / 100) / (1 + nominalGrowth / 100)) - 1;
      let newDebt = (prevDebt * (1 + snowballEffect)) - currentFiscal;
      newDebt = Math.max(5.0, Math.min(300.0, newDebt));

      // 11. Nivel del PIB Nominal
      currentGdp = currentGdp * (1 + (nominalGrowth / 100));

      // Guardar estados en vectores
      gdpLevels.push(Math.round(currentGdp * 10) / 10);
      gdpGrowthRates.push(Math.round(newGrowth * 100) / 100);
      inflationRates.push(Math.round(newInflation * 100) / 100);
      interestRates.push(Math.round(newInterest * 100) / 100);
      realInterestRates.push(Math.round(newRealRate * 100) / 100);
      unemploymentRates.push(Math.round(newUnemployment * 100) / 100);
      debtToGdpRatios.push(Math.round(newDebt * 100) / 100);
      fiscalBalances.push(Math.round(currentFiscal * 100) / 100);
      outputGaps.push(Math.round(outputGap * 100) / 100);

      // Actualizar referencias
      prevGrowth = newGrowth;
      prevInflation = newInflation;
      prevInterest = newInterest;
      prevUnemployment = newUnemployment;
      prevDebt = newDebt;
      prevFiscal = currentFiscal;
    }

    // 12. Métricas de Vulnerabilidad y Riesgo País
    const finalYearIdx = horizon;
    const finalDebt = debtToGdpRatios[finalYearIdx];
    const finalGrowth = gdpGrowthRates[finalYearIdx];
    const finalInflation = inflationRates[finalYearIdx];
    const avgGrowth = gdpGrowthRates.slice(1).reduce((a, b) => a + b, 0) / horizon;
    const maxDebt = Math.max(...debtToGdpRatios);

    const riskScore = this.calculateCountryRiskScore({
      debt: finalDebt,
      inflation: finalInflation,
      growth: avgGrowth,
      currentAccount: currentAccount,
      fiscalBalance: fiscalBalances[finalYearIdx],
      unemployment: unemploymentRates[finalYearIdx]
    });

    const recessionProbability = this.calculateRecessionProbability({
      growth: gdpGrowthRates[1],
      realRate: realInterestRates[1],
      debt: initialDebtToGdp,
      scenario: scenario
    });

    const stagflationIndex = this.calculateStagflationIndex(gdpGrowthRates, inflationRates);

    // 13. Simulación Monte Carlo para Cono de Incertidumbre (Fan Chart)
    const monteCarloResults = this.runMonteCarlo({
      horizon: horizon,
      baseGdp: initialGdp,
      baseGrowth: initialGrowth,
      potentialGrowth: potentialGrowth,
      volatility: country === "Argentina" ? 4.5 : (country === "Estados Unidos" ? 1.4 : 2.2),
      iterations: 500
    });

    // 14. Diagnóstico Ejecutivo Inteligente
    const diagnosis = this.generateExecutiveDiagnosis({
      country,
      initialGrowth,
      finalGrowth,
      avgGrowth,
      initialInflation,
      finalInflation,
      initialDebt: initialDebtToGdp,
      finalDebt,
      initialInterest,
      finalInterest: interestRates[finalYearIdx],
      riskScore,
      recessionProbability,
      stagflationIndex,
      scenario
    });

    return {
      years,
      series: {
        gdpLevels,
        gdpGrowthRates,
        inflationRates,
        interestRates,
        realInterestRates,
        unemploymentRates,
        debtToGdpRatios,
        fiscalBalances,
        outputGaps
      },
      kpi: {
        cumulativeGdpGrowth: Math.round(((gdpLevels[finalYearIdx] / gdpLevels[0]) - 1) * 1000) / 10,
        averageAnnualGrowth: Math.round(avgGrowth * 10) / 10,
        finalInflation: finalInflation,
        finalDebtToGdp: finalDebt,
        finalUnemployment: unemploymentRates[finalYearIdx],
        finalInterestRate: interestRates[finalYearIdx],
        riskScore: riskScore.score,
        riskRating: riskScore.rating,
        riskSpreadBps: riskScore.spreadBps,
        recessionProbability: recessionProbability,
        stagflationIndex: stagflationIndex
      },
      monteCarlo: monteCarloResults,
      diagnosis
    };
  }

  /**
   * Modificadores exógenos para escenarios macroeconómicos
   */
  getScenarioModifiers(scenario) {
    switch (scenario) {
      case "optimistic":
        return {
          potentialGrowthShock: () => 0.5,
          gdpGrowthShock: (t) => (t === 1 ? 0.8 : 0.5),
          inflationShock: () => -0.4,
          fiscalShock: () => 0.3,
          fiscalAdjustment: () => 0.3
        };
      case "pessimistic":
        return {
          potentialGrowthShock: () => -0.4,
          gdpGrowthShock: (t) => (t === 1 ? -2.2 : -1.0),
          inflationShock: () => 0.2,
          fiscalShock: () => -0.8,
          fiscalAdjustment: () => -0.2
        };
      case "stagflation":
        return {
          potentialGrowthShock: () => -0.8,
          gdpGrowthShock: (t) => (t === 1 ? -2.5 : -1.5),
          inflationShock: (t) => (t <= 2 ? 3.5 : 1.8),
          fiscalShock: () => -0.5,
          fiscalAdjustment: () => -0.1
        };
      case "fiscal_austerity":
        return {
          potentialGrowthShock: () => 0.0,
          gdpGrowthShock: (t) => (t === 1 ? -1.0 : (t > 2 ? 0.6 : 0.0)),
          inflationShock: () => -0.3,
          fiscalShock: () => -0.5,
          fiscalAdjustment: () => 0.8 // Fuerte consolidación fiscal positiva
        };
      case "base":
      default:
        return {
          potentialGrowthShock: () => 0.0,
          gdpGrowthShock: () => 0.0,
          inflationShock: () => 0.0,
          fiscalShock: () => 0.0,
          fiscalAdjustment: () => 0.1 // Gradual consolidación neutral
        };
    }
  }

  /**
   * Calificación de Riesgo País (Credit Rating & EMBI Spread Model)
   */
  calculateCountryRiskScore(metrics) {
    let score = 100; // 100 = Máxima solidez (AAA), 0 = Insolvente / Default

    // Penalización por deuda
    if (metrics.debt > 60) score -= (metrics.debt - 60) * 0.45;
    if (metrics.debt > 110) score -= (metrics.debt - 110) * 0.35;

    // Penalización por inflación
    if (metrics.inflation > 3.0) score -= (metrics.inflation - 3.0) * 2.2;
    if (metrics.inflation > 15.0) score -= 25;

    // Penalización por déficit fiscal
    if (metrics.fiscalBalance < -3.0) score -= Math.abs(metrics.fiscalBalance + 3.0) * 3.0;

    // Bonificación o penalización por crecimiento
    if (metrics.growth < 1.0) score -= (1.0 - metrics.growth) * 4.0;
    else if (metrics.growth > 3.0) score += (metrics.growth - 3.0) * 2.5;

    // Balanza en cuenta corriente
    if (metrics.currentAccount < -3.0) score -= Math.abs(metrics.currentAccount + 3.0) * 2.0;

    score = Math.max(10, Math.min(98, Math.round(score)));

    // Mapeo a letras de rating crediticio
    let rating = "BBB";
    let spreadBps = 180;

    if (score >= 90) { rating = "AAA"; spreadBps = 25; }
    else if (score >= 82) { rating = "AA"; spreadBps = 65; }
    else if (score >= 73) { rating = "A"; spreadBps = 115; }
    else if (score >= 62) { rating = "BBB"; spreadBps = 190; }
    else if (score >= 50) { rating = "BB"; spreadBps = 320; }
    else if (score >= 38) { rating = "B"; spreadBps = 540; }
    else if (score >= 25) { rating = "CCC"; spreadBps = 950; }
    else { rating = "D / Restructurado"; spreadBps = 1800; }

    return { score, rating, spreadBps };
  }

  /**
   * Probabilidad de Recesión en 24 meses
   */
  calculateRecessionProbability(inputs) {
    let prob = 18; // Tasa base normal en cualquier ciclo

    // Si la tasa real es muy alta (freno monetario fuerte)
    if (inputs.realRate > 3.5) prob += (inputs.realRate - 3.5) * 8.5;
    else if (inputs.realRate > 2.0) prob += (inputs.realRate - 2.0) * 4.0;

    // Si el crecimiento reciente es anémico o negativo
    if (inputs.growth < 0) prob += 45;
    else if (inputs.growth < 1.0) prob += 25;
    else if (inputs.growth < 2.0) prob += 10;

    if (inputs.debt > 110) prob += 8;

    if (inputs.scenario === "pessimistic") prob += 28;
    if (inputs.scenario === "stagflation") prob += 35;
    if (inputs.scenario === "optimistic") prob -= 12;

    return Math.max(5, Math.min(95, Math.round(prob)));
  }

  /**
   * Índice de Estanflación (Bajo crecimiento + Alta inflación)
   */
  calculateStagflationIndex(growthList, inflationList) {
    // Media de los primeros 3 años
    const avgG = (growthList[1] + growthList[2]) / 2;
    const avgInf = (inflationList[1] + inflationList[2]) / 2;

    let index = (avgInf * 1.5) - (avgG * 2.0);
    index = Math.max(0, Math.min(100, Math.round(index * 4 + 20)));
    return index;
  }

  /**
   * Simulación Monte Carlo (Generación de abanicos probabilísticos de PIB)
   */
  runMonteCarlo(options) {
    const horizon = options.horizon;
    const baseGdp = options.baseGdp;
    const potentialGrowth = options.potentialGrowth;
    const volatility = options.volatility || 2.0;
    const iterations = options.iterations || 500;

    const yearlyValues = Array.from({ length: horizon + 1 }, () => []);
    yearlyValues[0].push(...Array(iterations).fill(baseGdp));

    for (let i = 0; i < iterations; i++) {
      let gdp = baseGdp;
      for (let t = 1; t <= horizon; t++) {
        // Shock estocástico normal (Box-Muller)
        const u1 = Math.random() || 0.0001;
        const u2 = Math.random() || 0.0001;
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Salto aleatorio de cola (Black Swan event, 8% de probabilidad)
        const jump = Math.random() < 0.08 ? (Math.random() - 0.7) * 3.0 : 0;

        const shock = (z0 * volatility) + jump;
        const growth = (potentialGrowth + shock) / 100;
        gdp = gdp * (1 + growth);
        yearlyValues[t].push(gdp);
      }
    }

    // Calcular percentiles P10, P25, P50, P75, P90 para cada año
    const p10 = [];
    const p25 = [];
    const p50 = [];
    const p75 = [];
    const p90 = [];

    for (let t = 0; t <= horizon; t++) {
      const sorted = yearlyValues[t].slice().sort((a, b) => a - b);
      p10.push(Math.round(sorted[Math.floor(iterations * 0.10)]));
      p25.push(Math.round(sorted[Math.floor(iterations * 0.25)]));
      p50.push(Math.round(sorted[Math.floor(iterations * 0.50)]));
      p75.push(Math.round(sorted[Math.floor(iterations * 0.75)]));
      p90.push(Math.round(sorted[Math.floor(iterations * 0.90)]));
    }

    return { p10, p25, p50, p75, p90 };
  }

  /**
   * Genera el diagnóstico narrativo ejecutivo macroeconómico
   */
  generateExecutiveDiagnosis(data) {
    const {
      country,
      initialGrowth,
      finalGrowth,
      avgGrowth,
      initialInflation,
      finalInflation,
      initialDebt,
      finalDebt,
      initialInterest,
      finalInterest,
      riskScore,
      recessionProbability,
      stagflationIndex,
      scenario
    } = data;

    let healthStatus = "Estable";
    let statusClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";

    if (stagflationIndex > 65 || recessionProbability > 60 || riskScore.score < 40) {
      healthStatus = "Riesgo Severo / Alerta de Crisis";
      statusClass = "text-rose-500 bg-rose-500/10 border-rose-500/30";
    } else if (stagflationIndex > 45 || recessionProbability > 40 || riskScore.score < 60 || finalDebt > 100) {
      healthStatus = "Vulnerabilidad Moderada";
      statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/30";
    } else if (avgGrowth > 2.5 && finalInflation <= 3.0 && riskScore.score >= 75) {
      healthStatus = "Sólida y en Expansión";
      statusClass = "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    }

    // Análisis de Política Monetaria
    let monetaryDiagnosis = "";
    const realInitialRate = initialInterest - initialInflation;
    if (realInitialRate > 3.0) {
      monetaryDiagnosis = `La política monetaria actual es fuertemente restrictiva (tasa real de +${realInitialRate.toFixed(1)}%). Si bien ayuda a doblegar la inflación hacia el ${finalInflation.toFixed(1)}%, genera un lastre inicial sobre la inversión privada y el consumo de las familias. A mediano plazo, se proyecta un descenso gradual de la tasa de referencia hacia el ${finalInterest.toFixed(1)}% siguiendo la Regla de Taylor.`;
    } else if (realInitialRate < 0.5) {
      monetaryDiagnosis = `La tasa de interés real se encuentra en terreno expansivo o neutral-bajo (+${realInitialRate.toFixed(1)}%). Esto estimula la demanda interna a corto plazo, pero expone a la economía a riesgos de persistencia inflacionaria si la brecha del producto permanece en positivo.`;
    } else {
      monetaryDiagnosis = `La tasa de interés nominal se alinea con una postura equilibrada (+${realInitialRate.toFixed(1)}% real). Permite contener las expectativas de precios sin asfixiar innecesariamente la actividad económica real.`;
    }

    // Análisis de Sostenibilidad de la Deuda
    let fiscalDiagnosis = "";
    const debtDiff = finalDebt - initialDebt;
    if (debtDiff > 8.0) {
      fiscalDiagnosis = `La trayectoria de la deuda pública es expansiva (aumenta de ${initialDebt.toFixed(1)}% a ${finalDebt.toFixed(1)}% del PIB). La combinación de déficit fiscal y efecto 'bola de nieve' (tasa de interés superior a la tasa de crecimiento nominal) pone en peligro la sostenibilidad a largo plazo y presiona la prima de riesgo.`;
    } else if (debtDiff < -3.0) {
      fiscalDiagnosis = `Se evidencia una disciplina de consolidación fiscal favorable, reduciendo el ratio de endeudamiento desde ${initialDebt.toFixed(1)}% hacia ${finalDebt.toFixed(1)}% del PIB. Esto amplía el espacio fiscal para afrontar futuros shocks imprevistos.`;
    } else {
      fiscalDiagnosis = `La deuda sobre PIB se estabiliza en torno al ${finalDebt.toFixed(1)}%. Se mantiene un balance entre el servicio de la deuda y la capacidad de recaudación tributaria.`;
    }

    // Recomendaciones estratégicas
    const recommendations = [];
    if (finalInflation > 3.5) {
      recommendations.push("Mantener el anclaje de expectativas inflacionarias mediante comunicación transparente del Banco Central y moderación del ritmo de recortes de tasas.");
    }
    if (finalDebt > 75) {
      recommendations.push("Implementar una regla fiscal estructural creíble que contenga el gasto primario corriente e impulse la eficiencia recaudatoria.");
    }
    if (avgGrowth < 2.0) {
      recommendations.push("Impulsar reformas estructurales pro-competitividad (reducción de cargas burocráticas, digitalización y fomento de la inversión en capital productivo e I+D).");
    }
    if (recessionProbability > 40) {
      recommendations.push("Constituir fondos de estabilización contracíclica para amortiguar el impacto social de posibles caídas en el empleo.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Continuar con el marco de metas de inflación y preservar la certidumbre jurídica para atraer inversión extranjera directa de largo plazo.");
    }

    return {
      healthStatus,
      statusClass,
      monetaryDiagnosis,
      fiscalDiagnosis,
      recommendations,
      scenarioNotes: this.getScenarioDescription(scenario)
    };
  }

  getScenarioDescription(scenario) {
    switch (scenario) {
      case "optimistic":
        return "Escenario de vientos a favor: Mayor productividad global, shock positivo de inversión y condiciones financieras internacionales relajadas.";
      case "pessimistic":
        return "Escenario adverso: Caída del comercio mundial, endurecimiento de condiciones de crédito y desaceleración de socios comerciales.";
      case "stagflation":
        return "Escenario de estanflación: Shock de oferta negativo severo (encarecimiento de materias primas o energía) con inflación alta y estancamiento del PIB.";
      case "fiscal_austerity":
        return "Escenario de shock de consolidación fiscal: Recorte de gasto público para estabilizar la deuda, con contracción a corto plazo y recuperación a medio plazo.";
      default:
        return "Escenario de referencia: Continuidad de las tendencias macroeconómicas actuales con convergencia gradual hacia el equilibrio de largo plazo.";
    }
  }
}

// Exportar para entorno browser o Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MacroeconomicModel;
}
