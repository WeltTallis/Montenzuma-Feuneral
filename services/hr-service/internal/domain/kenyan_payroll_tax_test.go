package domain

import "testing"

func TestCalculateKenyanPayrollTax(t *testing.T) {
	tests := []struct {
		name  string
		input KenyanPayrollTaxInput
		want  KenyanPayrollTaxResult
	}{
		{
			name: "zero pay",
			want: KenyanPayrollTaxResult{PersonalRelief: 2_400},
		},
		{
			name:  "pay below PAYE relief",
			input: KenyanPayrollTaxInput{GrossPay: 24_000},
			want: KenyanPayrollTaxResult{
				GrossPay: 24_000, TaxablePay: 21_540, PAYEBeforeReliefs: 2_154,
				PersonalRelief: 2_400, EmployeeNSSF: 1_440, EmployerNSSF: 1_440,
				SHIF: 660, EmployeeHousingLevy: 360, EmployerHousingLevy: 360,
				NetPay: 21_540, EmployerCost: 25_800,
			},
		},
		{
			name: "ordinary salary",
			input: KenyanPayrollTaxInput{GrossPay: 50_000},
			want: KenyanPayrollTaxResult{
				GrossPay: 50_000, TaxablePay: 44_875, PAYEBeforeReliefs: 8_245.85,
				PersonalRelief: 2_400, PAYE: 5_845.85, EmployeeNSSF: 3_000, EmployerNSSF: 3_000,
				SHIF: 1_375, EmployeeHousingLevy: 750, EmployerHousingLevy: 750,
				NetPay: 39_029.15, EmployerCost: 53_750,
			},
		},
		{
			name: "insurance and extra pension relief",
			input: KenyanPayrollTaxInput{
				GrossPay: 50_000, AdditionalPensionContribution: 5_000, MonthlyInsurancePremiums: 10_000,
			},
			want: KenyanPayrollTaxResult{
				GrossPay: 50_000, TaxablePay: 39_875, PAYEBeforeReliefs: 6_745.85,
				PersonalRelief: 2_400, InsuranceRelief: 1_500, PAYE: 2_845.85,
				EmployeeNSSF: 3_000, EmployerNSSF: 3_000, SHIF: 1_375,
				EmployeeHousingLevy: 750, EmployerHousingLevy: 750,
				AdditionalPensionContribution: 5_000, NetPay: 37_029.15, EmployerCost: 53_750,
			},
		},
		{
			name: "NSSF capped at upper earnings limit",
			input: KenyanPayrollTaxInput{GrossPay: 250_000},
			want: KenyanPayrollTaxResult{
				GrossPay: 250_000, TaxablePay: 232_895, PAYEBeforeReliefs: 64_651.85,
				PersonalRelief: 2_400, PAYE: 62_251.85, EmployeeNSSF: 6_480, EmployerNSSF: 6_480,
				SHIF: 6_875, EmployeeHousingLevy: 3_750, EmployerHousingLevy: 3_750,
				NetPay: 170_643.15, EmployerCost: 260_230,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CalculateKenyanPayrollTax(tt.input, DefaultKenyanPayrollRates)
			if err != nil {
				t.Fatal(err)
			}
			if got != tt.want {
				t.Fatalf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestCalculateKenyanPayrollTaxRejectsInvalidInputAndRates(t *testing.T) {
	if _, err := CalculateKenyanPayrollTax(
		KenyanPayrollTaxInput{GrossPay: -1}, DefaultKenyanPayrollRates,
	); err == nil {
		t.Fatal("negative gross pay must be rejected")
	}

	rates := DefaultKenyanPayrollRates
	rates.PAYEBands = append([]KenyanTaxBand(nil), rates.PAYEBands...)
	rates.PAYEBands[len(rates.PAYEBands)-1].UpperLimit = 900_000
	if _, err := CalculateKenyanPayrollTax(KenyanPayrollTaxInput{GrossPay: 1}, rates); err == nil {
		t.Fatal("bounded final PAYE band must be rejected")
	}
}
