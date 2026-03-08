import { SalaryParams, CalculationResult } from '../types';

export function calculateGrossToNet(gross: number, dependents: number, params: SalaryParams): CalculationResult {
  // 1. Insurance
  const socialBasis = Math.min(gross, params.baseSalary * 20);
  const healthBasis = Math.min(gross, params.baseSalary * 20);
  const unemploymentBasis = Math.min(gross, params.maxUnemploymentSalary);

  const social = socialBasis * params.insuranceRates.social;
  const health = healthBasis * params.insuranceRates.health;
  const unemployment = unemploymentBasis * params.insuranceRates.unemployment;
  const totalInsurance = social + health + unemployment;

  // 2. Taxable Income
  const incomeBeforeDeduction = gross - totalInsurance;
  const personalDeduction = params.personalDeduction;
  const dependentDeduction = dependents * params.dependentDeduction;
  const totalDeduction = personalDeduction + dependentDeduction;
  
  const taxableIncome = Math.max(0, incomeBeforeDeduction - totalDeduction);

  // 3. PIT
  let pit = 0;
  if (taxableIncome > 0) {
    const bracket = params.taxBrackets.find((b, i) => {
      const prevLimit = i === 0 ? 0 : params.taxBrackets[i-1].limit;
      return taxableIncome <= b.limit;
    }) || params.taxBrackets[params.taxBrackets.length - 1];
    
    pit = taxableIncome * bracket.rate - bracket.subtraction;
  }

  const net = gross - totalInsurance - pit;

  return {
    gross,
    net,
    insurance: {
      social,
      health,
      unemployment,
      total: totalInsurance,
    },
    taxableIncome: {
      beforeDeduction: incomeBeforeDeduction,
      afterDeduction: taxableIncome,
    },
    pit,
    deductions: {
      personal: personalDeduction,
      dependents: dependentDeduction,
      total: totalDeduction,
    },
  };
}

export function calculateNetToGross(net: number, dependents: number, params: SalaryParams): CalculationResult {
  // Iterative approach to find Gross from Net
  let low = net;
  let high = net * 2; // Reasonable upper bound
  let gross = net;
  
  // Binary search for gross
  for (let i = 0; i < 50; i++) {
    gross = (low + high) / 2;
    const result = calculateGrossToNet(gross, dependents, params);
    if (result.net < net) {
      low = gross;
    } else {
      high = gross;
    }
  }
  
  return calculateGrossToNet(gross, dependents, params);
}
