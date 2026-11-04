package domain

import (
	"fmt"
	"math"
	"time"
)

type KenyanTaxBand struct {
	UpperLimit int64
	Rate       float64
}

type KenyanPayrollRates struct {
	EffectiveFrom                    string
	PAYEBands                        []KenyanTaxBand
	PersonalRelief                   int64
	InsuranceReliefRate              float64
	MaximumMonthlyInsuranceRelief    int64
	NSSFRate                         float64
	NSSFUpperEarningsLimit           int64
	SHIFRate                         float64
	MinimumMonthlySHIF               int64
	HousingLevyRate                  float64
	MaximumMonthlyPensionDeduction   int64
}

type KenyanPayrollTaxInput struct {
	GrossPay                      float64
	AdditionalPensionContribution float64
	MonthlyInsurancePremiums      float64
}

type KenyanPayrollTaxResult struct {
	GrossPay                      float64 `json:"gross_pay"`
	TaxablePay                    float64 `json:"taxable_pay"`
	PAYEBeforeReliefs             float64 `json:"paye_before_reliefs"`
	PersonalRelief                float64 `json:"personal_relief"`
	InsuranceRelief               float64 `json:"insurance_relief"`
	PAYE                          float64 `json:"paye"`
	EmployeeNSSF                  float64 `json:"employee_nssf"`
	EmployerNSSF                  float64 `json:"employer_nssf"`
	SHIF                          float64 `json:"shif"`
	EmployeeHousingLevy           float64 `json:"employee_housing_levy"`
	EmployerHousingLevy           float64 `json:"employer_housing_levy"`
	AdditionalPensionContribution float64 `json:"additional_pension_contribution"`
	NetPay                        float64 `json:"net_pay"`
	EmployerCost                  float64 `json:"employer_cost"`
}

var DefaultKenyanPayrollRates = KenyanPayrollRates{
	EffectiveFrom: "2026-02-01",
	PAYEBands: []KenyanTaxBand{
		{UpperLimit: 24_000, Rate: 0.10},
		{UpperLimit: 32_333, Rate: 0.25},
		{UpperLimit: 500_000, Rate: 0.30},
		{UpperLimit: 800_000, Rate: 0.325},
		{UpperLimit: 0, Rate: 0.35},
	},
	PersonalRelief:                 2_400,
	InsuranceReliefRate:            0.15,
	MaximumMonthlyInsuranceRelief:  5_000,
	NSSFRate:                       0.06,
	NSSFUpperEarningsLimit:         108_000,
	SHIFRate:                       0.0275,
	MinimumMonthlySHIF:             300,
	HousingLevyRate:                0.015,
	MaximumMonthlyPensionDeduction: 30_000,
}

func CalculateKenyanPayrollTax(input KenyanPayrollTaxInput, rates KenyanPayrollRates) (KenyanPayrollTaxResult, error) {
	for _, amount := range []float64{input.GrossPay, input.AdditionalPensionContribution, input.MonthlyInsurancePremiums} {
		if math.IsNaN(amount) || math.IsInf(amount, 0) || amount < 0 {
			return KenyanPayrollTaxResult{}, fmt.Errorf("payroll amounts must be finite and non-negative")
		}
	}
	if err := rates.Validate(); err != nil {
		return KenyanPayrollTaxResult{}, err
	}

	gross := roundKenyanMoney(input.GrossPay)
	employeeNSSF := roundKenyanMoney(math.Min(gross, float64(rates.NSSFUpperEarningsLimit)) * rates.NSSFRate)
	shif := float64(0)
	if gross > 0 {
		shif = roundKenyanMoney(math.Max(float64(rates.MinimumMonthlySHIF), gross*rates.SHIFRate))
	}
	employeeHousingLevy := roundKenyanMoney(float64(gross) * rates.HousingLevyRate)
	allowablePension := math.Min(
		float64(rates.MaximumMonthlyPensionDeduction),
		employeeNSSF+input.AdditionalPensionContribution,
	)
	taxablePay := roundKenyanMoney(math.Max(0, gross-allowablePension-shif-employeeHousingLevy))
	payeBeforeReliefs := calculateKenyanPAYE(taxablePay, rates.PAYEBands)
	insuranceRelief := math.Min(
		float64(rates.MaximumMonthlyInsuranceRelief),
		roundKenyanMoney(float64(input.MonthlyInsurancePremiums)*rates.InsuranceReliefRate),
	)
	paye := roundKenyanMoney(math.Max(0, payeBeforeReliefs-float64(rates.PersonalRelief)-insuranceRelief))

	return KenyanPayrollTaxResult{
		GrossPay:                      gross,
		TaxablePay:                    taxablePay,
		PAYEBeforeReliefs:             payeBeforeReliefs,
		PersonalRelief:                float64(rates.PersonalRelief),
		InsuranceRelief:               insuranceRelief,
		PAYE:                          paye,
		EmployeeNSSF:                  employeeNSSF,
		EmployerNSSF:                  employeeNSSF,
		SHIF:                          shif,
		EmployeeHousingLevy:           employeeHousingLevy,
		EmployerHousingLevy:           employeeHousingLevy,
		AdditionalPensionContribution: input.AdditionalPensionContribution,
		NetPay: gross - employeeNSSF - shif - employeeHousingLevy -
			input.AdditionalPensionContribution - paye,
		EmployerCost: gross + employeeNSSF + employeeHousingLevy,
	}, nil
}

func (r KenyanPayrollRates) Validate() error {
	if _, err := time.Parse("2006-01-02", r.EffectiveFrom); err != nil || len(r.PAYEBands) == 0 {
		return fmt.Errorf("effective date and PAYE bands are required")
	}
	if r.PersonalRelief < 0 || r.MaximumMonthlyInsuranceRelief < 0 ||
		r.NSSFUpperEarningsLimit < 0 || r.MinimumMonthlySHIF < 0 ||
		r.MaximumMonthlyPensionDeduction < 0 {
		return fmt.Errorf("payroll tax limits and reliefs cannot be negative")
	}
	for _, rate := range []float64{r.InsuranceReliefRate, r.NSSFRate, r.SHIFRate, r.HousingLevyRate} {
		if math.IsNaN(rate) || math.IsInf(rate, 0) || rate < 0 || rate > 1 {
			return fmt.Errorf("payroll tax rates must be between 0 and 1")
		}
	}
	var previousLimit int64
	for i, band := range r.PAYEBands {
		if band.Rate < 0 || band.Rate > 1 || math.IsNaN(band.Rate) || math.IsInf(band.Rate, 0) {
			return fmt.Errorf("PAYE band rates must be between 0 and 1")
		}
		if band.UpperLimit < 0 || (i > 0 && previousLimit == 0) {
			return fmt.Errorf("only the final PAYE band may be unbounded")
		}
		if band.UpperLimit != 0 && band.UpperLimit <= previousLimit {
			return fmt.Errorf("PAYE band limits must increase")
		}
		previousLimit = band.UpperLimit
	}
	if previousLimit != 0 {
		return fmt.Errorf("the final PAYE band must be unbounded")
	}
	return nil
}

func calculateKenyanPAYE(taxablePay float64, bands []KenyanTaxBand) float64 {
	var tax float64
	var lowerLimit float64
	for _, band := range bands {
		upperLimit := float64(band.UpperLimit)
		if band.UpperLimit == 0 || upperLimit > taxablePay {
			upperLimit = taxablePay
		}
		if upperLimit > lowerLimit {
			tax += (upperLimit - lowerLimit) * band.Rate
		}
		lowerLimit = float64(band.UpperLimit)
		if band.UpperLimit == 0 || taxablePay <= band.UpperLimit {
			break
		}
	}
	return roundKenyanMoney(tax)
}

func roundKenyanMoney(amount float64) float64 {
	return math.Round((amount+1e-9)*100) / 100
}
