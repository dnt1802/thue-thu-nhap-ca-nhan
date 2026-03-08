import { SalaryParams } from './types';

export const DEFAULT_PARAMS: SalaryParams = {
  baseSalary: 2340000, // Lương cơ sở từ 01/07/2024
  maxUnemploymentSalary: 99200000, // Ví dụ Vùng 1: 4.960.000 * 20
  personalDeduction: 11000000,
  dependentDeduction: 4400000,
  insuranceRates: {
    social: 0.08,
    health: 0.015,
    unemployment: 0.01,
  },
  taxBrackets: [
    { limit: 5000000, rate: 0.05, subtraction: 0 },
    { limit: 10000000, rate: 0.1, subtraction: 250000 },
    { limit: 18000000, rate: 0.15, subtraction: 750000 },
    { limit: 32000000, rate: 0.2, subtraction: 1650000 },
    { limit: 52000000, rate: 0.25, subtraction: 3250000 },
    { limit: 80000000, rate: 0.3, subtraction: 5850000 },
    { limit: Infinity, rate: 0.35, subtraction: 9850000 },
  ],
};
