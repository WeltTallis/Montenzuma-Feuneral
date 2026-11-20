export interface KenyanPayrollRates {
    effectiveFrom: string;
    payeBands: readonly { width: number; rate: number }[];
    personalRelief: number;
    insuranceReliefRate: number;
    maximumMonthlyInsuranceRelief: number;
    nssfRate: number;
    nssfLowerEarningsLimit: number;
    nssfUpperEarningsLimit: number;
    shifRate: number;
    minimumMonthlyShif: number;
    housingLevyRate: number;
    maximumMonthlyPensionDeduction: number;
}

export const KENYAN_PAYROLL_RATES: KenyanPayrollRates = {
    effectiveFrom: '2026-02-01',
    payeBands: [
        { width: 24_000, rate: 0.1 },
        { width: 8_333, rate: 0.25 },
        { width: 467_667, rate: 0.3 },
        { width: 300_000, rate: 0.325 },
        { width: Number.POSITIVE_INFINITY, rate: 0.35 },
    ],

    personalRelief: 2_400,
    insuranceReliefRate: 0.15,
    maximumMonthlyInsuranceRelief: 5_000,
    nssfRate: 0.06,
    nssfLowerEarningsLimit: 9_000,
    nssfUpperEarningsLimit: 108_000,
    shifRate: 0.0275,
    minimumMonthlyShif: 300,
    housingLevyRate: 0.015,
    maximumMonthlyPensionDeduction: 30_000,

} as const;

export interface KenyanPayrollTaxInput {
    grossPay: number;
    additionalPensionContribution?: number;
    monthlyInsurancePremiums?: number;
}

export interface KenyanPayrollTaxResult {
    grossPay: number;
    taxablePay: number;
    payeBeforeReliefs: number;
    personalRelief: number;
    insuranceRelief: number;
    paye: number;
    employeeNssf: number;
    employerNssf: number;
    shif: number;
    employeeHousingLevy: number;
    employerHousingLevy: number;
    additionalPensionContribution: number;
    netPay: number;
    employerCost: number;
}

const roundMoney = (amount: number): number =>
    Math.round((amount + Number.EPSILON) * 100) / 100;

const validateAmount = (name: string, value: number): void => {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a finite, non-negative amount.`);
    }
};

function calculatePaye(taxablePay: number, rates: KenyanPayrollRates): number {
    let remainingPay = taxablePay;
    let tax = 0;

    for (const band of rates.payeBands) {
        const incomeInBand = Math.min(remainingPay, band.width);
        tax += incomeInBand * band.rate;
        remainingPay -= incomeInBand;
        if (remainingPay <= 0) break;
    }

    return roundMoney(tax);
}

export function calculateKenyanPayrollTax(
    input: KenyanPayrollTaxInput,
    rates: KenyanPayrollRates = KENYAN_PAYROLL_RATES,
): KenyanPayrollTaxResult {
    const additionalPensionContribution = input.additionalPensionContribution ?? 0;
    const monthlyInsurancePremiums = input.monthlyInsurancePremiums ?? 0;
    validateAmount('Gross pay', input.grossPay);
    validateAmount('Additional pension contribution', additionalPensionContribution);
    validateAmount('Monthly insurance premiums', monthlyInsurancePremiums);

    const grossPay = roundMoney(input.grossPay);
    const employeeNssf = roundMoney(
        Math.min(grossPay, rates.nssfUpperEarningsLimit)
        * rates.nssfRate,
    );
    const employerNssf = employeeNssf;
    const shif = grossPay === 0
        ? 0
        : roundMoney(Math.max(
            rates.minimumMonthlyShif,
            grossPay * rates.shifRate,
        ));
    const employeeHousingLevy = roundMoney(
        grossPay * rates.housingLevyRate,
    );
    const employerHousingLevy = employeeHousingLevy;
    const allowablePensionDeduction = Math.min(
        rates.maximumMonthlyPensionDeduction,
        employeeNssf + additionalPensionContribution,
    );
    const taxablePay = roundMoney(Math.max(
        0,
        grossPay
        - allowablePensionDeduction
        - shif
        - employeeHousingLevy,
    ));
    const payeBeforeReliefs = calculatePaye(taxablePay, rates);
    const insuranceRelief = roundMoney(Math.min(
        rates.maximumMonthlyInsuranceRelief,
        monthlyInsurancePremiums * rates.insuranceReliefRate,
    ));
    const paye = roundMoney(Math.max(
        0,
        payeBeforeReliefs
        - rates.personalRelief
        - insuranceRelief,
    ));
    const netPay = roundMoney(
        grossPay
        - employeeNssf
        - shif
        - employeeHousingLevy
        - additionalPensionContribution
        - paye,
    );

    return {
        grossPay,
        taxablePay,
        payeBeforeReliefs,
        personalRelief: rates.personalRelief,
        insuranceRelief,
        paye,
        employeeNssf,
        employerNssf,
        shif,
        employeeHousingLevy,
        employerHousingLevy,
        additionalPensionContribution,
        netPay,
        employerCost: roundMoney(grossPay + employerNssf + employerHousingLevy),
    };
}