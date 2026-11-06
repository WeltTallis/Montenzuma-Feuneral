import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@hr/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hr/components/ui/card';
import { Input } from '@hr/components/ui/input';
import { Label } from '@hr/components/ui/label';
import {
  calculateKenyanPayrollTax,
  KENYAN_PAYROLL_RATES,
} from '@hr/utils/kenyan-payroll-tax';

const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatKes = (amount: number): string => kesFormatter.format(amount);

const getCurrentPayrollMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const TaxCalculatorPage = () => {
  const [grossPay, setGrossPay] = useState('100000');
  const [additionalPension, setAdditionalPension] = useState('0');
  const [monthlyInsurancePremiums, setMonthlyInsurancePremiums] = useState('0');
  const [payrollMonth, setPayrollMonth] = useState(getCurrentPayrollMonth);

  const calculation = useMemo(() => {
    const rawValues = [grossPay, additionalPension, monthlyInsurancePremiums];
    if (rawValues.some((value) => value.trim() === '')) {
      return { result: null, error: 'Enter an amount for each field.' };
    }

    const values = rawValues.map(Number);
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      return { result: null, error: 'Enter valid, non-negative amounts in Kenyan shillings.' };
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payrollMonth)) {
      return { result: null, error: 'Select a valid payroll month.' };
    }

    try {
      return {
        result: calculateKenyanPayrollTax({
          grossPay: values[0],
          additionalPensionContribution: values[1],
          monthlyInsurancePremiums: values[2],
        }),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Unable to calculate payroll deductions.',
      };
    }
  }, [
    additionalPension,
    grossPay,
    monthlyInsurancePremiums,
    payrollMonth,
  ]);

  const resultRows = calculation.result
    ? [
      { label: 'Taxable pay', value: calculation.result.taxablePay },
      { label: 'PAYE before reliefs', value: calculation.result.payeBeforeReliefs },
      { label: 'Personal relief', value: calculation.result.personalRelief },
      { label: 'Insurance relief', value: calculation.result.insuranceRelief },
      { label: 'PAYE', value: calculation.result.paye },
      { label: 'NSSF (employee)', value: calculation.result.employeeNssf },
      { label: 'SHIF', value: calculation.result.shif },
      { label: 'Affordable Housing Levy (employee)', value: calculation.result.employeeHousingLevy },
      { label: 'Additional pension contribution', value: calculation.result.additionalPensionContribution },
    ]
    : [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
          <Calculator aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Kenya Payroll Tax Calculator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Estimate monthly deductions for a Kenya-resident employee using KES gross pay.
          </p>
        </div>
      </header>

      <Alert>
        <AlertTitle>Rates used</AlertTitle>
        <AlertDescription>
          PAYE bands and personal relief follow the Kenya Revenue Authority. NSSF Tier I and Tier II
          limits are the Year 4 (2026) rates, effective February 2026. SHIF is estimated at 2.75%
          of gross pay (KES 300 minimum); the employee and employer Affordable Housing Levy rates
          are each 1.5%. This calculator is an estimate, not a tax filing or payroll instruction.
          {' '}
          <a className="font-medium underline" href="https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye" target="_blank" rel="noreferrer">
            KRA PAYE guidance
          </a>
          {' · '}
          <a className="font-medium underline" href="https://www.nssf.or.ke/notice-to-employers-year-4-2026-nssf-contribution-rates" target="_blank" rel="noreferrer">
            NSSF Year 4 (2026) notice
          </a>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly pay inputs</CardTitle>
            <CardDescription>Amounts for this calculator are in Kenyan shillings (KES).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-month">Payroll month</Label>
              <Input
                id="payroll-month"
                type="month"
                value={payrollMonth}
                onChange={(event) => setPayrollMonth(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gross-pay">Gross monthly employment pay (KES)</Label>
              <Input
                id="gross-pay"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={grossPay}
                onChange={(event) => setGrossPay(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Include taxable cash allowances and benefits in gross pay.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional-pension">Additional registered pension contribution (KES/month)</Label>
              <Input
                id="additional-pension"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={additionalPension}
                onChange={(event) => setAdditionalPension(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Tax relief is limited to KES {KENYAN_PAYROLL_RATES.maximumMonthlyPensionDeduction.toLocaleString('en-KE')}
                {' '}per month, including employee NSSF.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-premiums">Qualifying monthly insurance premiums (KES)</Label>
              <Input
                id="insurance-premiums"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={monthlyInsurancePremiums}
                onChange={(event) => setMonthlyInsurancePremiums(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Insurance relief is 15% of qualifying premiums, capped at KES 5,000 per month.
              </p>
            </div>
            {calculation.error && (
              <p className="text-sm font-medium text-red-700" role="alert">{calculation.error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated monthly deductions</CardTitle>
            <CardDescription>Confirm employee-specific allowances, exemptions and deductions before processing payroll.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-medium tabular-nums text-slate-900">{formatKes(row.value)}</span>
              </div>
            ))}
            {calculation.result && (
              <>
                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 font-semibold">
                  <span>Estimated net pay</span>
                  <span className="tabular-nums text-emerald-800">{formatKes(calculation.result.netPay)}</span>
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">Estimated employer cost</p>
                  <p className="mt-1 tabular-nums text-slate-700">{formatKes(calculation.result.employerCost)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Includes employer NSSF and employer Affordable Housing Levy. Employer SHIF is not included.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default TaxCalculatorPage;
