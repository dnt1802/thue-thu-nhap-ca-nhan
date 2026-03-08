export interface TaxBracket {
  limit: number;
  rate: number;
  subtraction: number;
}

export interface InsuranceRates {
  social: number;
  health: number;
  unemployment: number;
}

export interface SalaryParams {
  baseSalary: number; // Lương cơ sở (for social/health cap)
  maxUnemploymentSalary: number; // Lương tối thiểu vùng * 20 (for unemployment cap)
  personalDeduction: number;
  dependentDeduction: number;
  insuranceRates: InsuranceRates;
  taxBrackets: TaxBracket[];
}

export interface CalculationResult {
  gross: number;
  net: number;
  insurance: {
    social: number;
    health: number;
    unemployment: number;
    total: number;
  };
  taxableIncome: {
    beforeDeduction: number;
    afterDeduction: number;
  };
  pit: number;
  deductions: {
    personal: number;
    dependents: number;
    total: number;
  };
}
