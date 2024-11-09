function validateInputs(input) {
    const errors = [];
    const {
        annualEnergyConsumption,
        dayTimeUsagePercentage,
        systemCost,
        loanInterestRate,
        loanTerm
    } = input;

    if (!annualEnergyConsumption || annualEnergyConsumption <= 0) errors.push('Annual energy consumption must be positive');
    if (dayTimeUsagePercentage < 0 || dayTimeUsagePercentage > 100) errors.push('Day time usage must be between 0 and 100');
    if (!systemCost || systemCost <= 0) errors.push('System cost must be positive');
    if (loanInterestRate < 0) errors.push('Loan interest rate cannot be negative');
    if (loanTerm < 0) errors.push('Loan term cannot be negative');

    return errors;
}

// src/services/calculator.js

function calculateSystemRequirements(input) {
    const {
        annualEnergyConsumption,
        dayTimeUsagePercentage = 50,
        peakSunHours = 5,
        panelWattage = 610
    } = input;

    // Daily calculations
    const dailyConsumption = annualEnergyConsumption / 365;
    const daytimeUsage = dailyConsumption * (dayTimeUsagePercentage / 100);
    const nighttimeUsage = dailyConsumption - daytimeUsage;

    // System sizing
    const solarRequirement = dailyConsumption / peakSunHours;
    const batteryRequirement = (nighttimeUsage * 8) / 24; // 8 hours backup
    const panelsRequired = Math.ceil(solarRequirement / (panelWattage / 1000));

    return {
        dailyConsumption,
        daytimeUsage,
        nighttimeUsage,
        solarRequirement,
        batteryRequirement,
        panelsRequired
    };
}

function calculateTariffCost(consumption, tariff) {
    const {
        energy_charge,
        demand_charge,
        fixed_charge
    } = tariff;

    // Monthly fixed charge
    let totalCost = parseFloat(fixed_charge);

    // Energy charge
    totalCost += consumption * parseFloat(energy_charge);

    // Demand charge if applicable
    if (parseFloat(demand_charge) > 0) {
        const estimatedPeakDemand = consumption / 730 * 2; // Rough estimation
        totalCost += parseFloat(demand_charge) * estimatedPeakDemand;
    }

    return totalCost;
}

function calculateBatteryStrategy({
    batteryCapacity,
    batteryEfficiency,
    strategy,
    peakPeriods,
    systemRequirements
}) {
    const usableCapacity = batteryCapacity * batteryEfficiency;
    const strategies = {
        'evening-peak': () => {
            // Simple evening peak strategy
            return {
                dailySavings: usableCapacity * parseFloat(peakPeriods[0].energy_charge),
                gridChargingCost: strategy === 'grid-charging' ? 
                    (usableCapacity / batteryEfficiency) * parseFloat(peakPeriods[1].energy_charge) : 0,
                peakShaved: usableCapacity,
                cyclesPerDay: 1
            };
        },
        'dual-peak': () => {
            // Morning and evening peak strategy
            const splitCapacity = usableCapacity / 2;
            return {
                dailySavings: splitCapacity * 2 * parseFloat(peakPeriods[0].energy_charge),
                gridChargingCost: strategy === 'grid-charging' ? 
                    (usableCapacity / batteryEfficiency) * parseFloat(peakPeriods[1].energy_charge) : 0,
                peakShaved: usableCapacity,
                cyclesPerDay: 2
            };
        },
        'grid-charging': () => {
            // Charge from grid during off-peak
            const offPeakChargingCost = (usableCapacity / batteryEfficiency) * 
                parseFloat(peakPeriods.find(p => p.name.includes('Off-Peak')).energy_charge);
            
            return {
                dailySavings: usableCapacity * parseFloat(peakPeriods[0].energy_charge),
                gridChargingCost: offPeakChargingCost,
                peakShaved: usableCapacity,
                cyclesPerDay: 1,
                netSavings: (usableCapacity * parseFloat(peakPeriods[0].energy_charge)) - offPeakChargingCost
            };
        }
    };

    return strategies[strategy]();
}

// Add to module.exports
module.exports = {
    // ... existing exports
    calculateBatteryStrategy
};

function calculateFinancials(input, systemRequirements, tariff) {
    const {
        annualEnergyConsumption,
        systemCost,
        loanInterestRate,
        loanTerm,
        deposit = 0
    } = input;

    // Calculate loan payments
    const loanAmount = systemCost - deposit;
    const monthlyInterestRate = (loanInterestRate / 100) / 12;
    const numberOfPayments = loanTerm * 12;
    
    const monthlyLoanPayment = loanAmount * 
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    const totalLoanCost = monthlyLoanPayment * numberOfPayments + deposit;

    // Calculate costs and savings with tariff
    const annualConsumption = systemRequirements.dailyConsumption * 365;
    const monthlyConsumption = annualConsumption / 12;
    
    const monthlyCostWithoutSolar = calculateTariffCost(monthlyConsumption, tariff);
    const annualCostWithoutSolar = monthlyCostWithoutSolar * 12;

    // Project savings over 20 years
    const projections = [];
    let cumulativeSavings = -systemCost;

    for (let year = 1; year <= 20; year++) {
        // Calculate degraded production (0.5% per year)
        const degradationFactor = Math.pow(0.995, year - 1);
        const annualProduction = annualConsumption * degradationFactor;
        const remainingConsumption = Math.max(0, annualConsumption - annualProduction);
        
        // Calculate costs with increased rates (assume 5% annual increase)
        const yearlyTariff = {
            ...tariff,
            energy_charge: (parseFloat(tariff.energy_charge) * Math.pow(1.05, year - 1)).toString(),
            fixed_charge: (parseFloat(tariff.fixed_charge) * Math.pow(1.05, year - 1)).toString()
        };

        const monthlyCostWithSolar = calculateTariffCost(remainingConsumption / 12, yearlyTariff);
        const annualCostWithSolar = monthlyCostWithSolar * 12;
        const annualSavings = (annualCostWithoutSolar * Math.pow(1.05, year - 1)) - annualCostWithSolar;
        
        cumulativeSavings += annualSavings;

        projections.push({
            year,
            costPerKwh: parseFloat(yearlyTariff.energy_charge),
            annualCostWithoutSolar: annualCostWithoutSolar * Math.pow(1.05, year - 1),
            annualProduction,
            annualCostWithSolar,
            annualSavings,
            cumulativeSavings,
            cumulativeCashFlow: cumulativeSavings - (year <= loanTerm ? monthlyLoanPayment * 12 * year : 0),
            monthlyLoanPayment: year <= loanTerm ? monthlyLoanPayment : 0
        });
    }

    // Calculate simple payback period
    const paybackPeriod = Math.ceil(-systemCost / projections[0].annualSavings);

    return {
        monthlyLoanPayment,
        totalLoanCost,
        annualCostWithoutSolar,
        paybackPeriod,
        projections
    };
}

function calculateEnvironmentalImpact(input, systemRequirements) {
    const {
        carbonIntensity = 0.97,
        annualReductionRate = 1
    } = input;

    const annualProduction = systemRequirements.dailyConsumption * 365;
    const projections = [];
    let cumulativeOffset = 0;

    for (let year = 1; year <= 20; year++) {
        const yearlyIntensity = carbonIntensity * Math.pow(1 - annualReductionRate / 100, year - 1);
        const degradationFactor = Math.pow(0.995, year - 1);
        const yearlyProduction = annualProduction * degradationFactor;
        
        const annualOffset = (yearlyProduction * yearlyIntensity) / 1000; // Convert to tons
        cumulativeOffset += annualOffset;

        projections.push({
            year,
            carbonIntensity: yearlyIntensity,
            annualProduction: yearlyProduction,
            annualOffset,
            cumulativeOffset,
            treesEquivalent: Math.round(annualOffset * 45) // Average tree absorbs ~22kg CO2 per year
        });
    }

    return {
        firstYearOffset: projections[0].annualOffset,
        twentyYearOffset: cumulativeOffset,
        projections
    };
}

module.exports = {
    calculateSystemRequirements,
    calculateFinancials,
    calculateEnvironmentalImpact,
    validateInputs
};