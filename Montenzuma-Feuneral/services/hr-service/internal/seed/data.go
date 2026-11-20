package seed

import (
	"api-server/internal/pkg/clock"
	"context"
	"fmt"
	mathrand "math/rand/v2"
	"strings"
	"time"

	"api-server/internal/domain"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserProfile represents a complete user profile for generation
type UserProfile struct {
	FullName    string
	Username    string
	Email       string
	Phone       string
	Address     string
	CCCD        string
	BankAccount string
}

var kenyanFirstNames = []string{
	"Achieng", "Akinyi", "Atieno", "Chebet", "Chepngeno", "Kamau", "Kariuki",
	"Maina", "Muthoni", "Mwangi", "Njeri", "Njoki", "Odhiambo", "Otieno",
	"Wafula", "Wanjiku", "Wanjiru", "Wekesa",
}

var kenyanLastNames = []string{
	"Abdi", "Barasa", "Cheruiyot", "Kamau", "Kipchoge", "Kiptoo", "Koech",
	"Maina", "Moraa", "Muli", "Mutua", "Mwangi", "Njoroge", "Ochieng",
	"Odhiambo", "Onyango", "Wambui", "Waweru",
}

var kenyanCompanies = []string{
	"Nairobi Manufacturing Ltd",
	"Coastline Foods Ltd",
	"Rift Valley Logistics Ltd",
	"Lakeview Textiles Ltd",
	"Highland Fresh Produce Ltd",
	"Eastlands Construction Ltd",
	"Greenfields Agribusiness Ltd",
	"Kenya Digital Services Ltd",
}

var kenyanBanks = []struct {
	Name string
}{
	{"KCB Bank - Nairobi"},
	{"Equity Bank - Nairobi"},
	{"Co-operative Bank - Nairobi"},
	{"Absa Bank Kenya - Nairobi"},
	{"NCBA Bank - Nairobi"},
	{"Family Bank - Nairobi"},
	{"I&M Bank - Nairobi"},
	{"DTB Kenya - Nairobi"},
}

func GenerateKenyanName() string {
	firstName := kenyanFirstNames[mathrand.IntN(len(kenyanFirstNames))]
	lastName := kenyanLastNames[mathrand.IntN(len(kenyanLastNames))]
	return firstName + " " + lastName
}

func GenerateNationalID() string {
	return fmt.Sprintf("%08d", mathrand.IntN(100000000))
}

func GenerateBankAccount() string {
	return fmt.Sprintf("%010d", gofakeit.Number(0, 9999999999))
}

func GenerateKenyanAddress() string {
	locations := []string{
		"Westlands, Nairobi", "Kibera, Nairobi", "Eastleigh, Nairobi",
		"Nyali, Mombasa", "Milimani, Kisumu", "Section 58, Nakuru",
		"Langas, Eldoret", "Makupa, Mombasa",
	}
	return fmt.Sprintf("%d %s", gofakeit.Number(1, 999), gofakeit.RandomString(locations))
}

func GenerateRealisticEmail(name string) string {
	domains := []string{"company.co.ke", "gmail.com", "outlook.com"}
	emailDomain := gofakeit.RandomString(domains)

	nameSlug := strings.ToLower(strings.ReplaceAll(name, " ", ""))

	if gofakeit.Bool() {
		return fmt.Sprintf("%s%d@%s", nameSlug, gofakeit.Number(1, 999), emailDomain)
	}
	return fmt.Sprintf("%s@%s", nameSlug, emailDomain)
}

func GenerateRealisticPhone() string {
	prefixes := []string{"09", "08", "07", "03"}
	prefix := gofakeit.RandomString(prefixes)
	return fmt.Sprintf("%s%08d", prefix, gofakeit.Number(10000000, 99999999))
}

func GenerateCompanyName() string {
	if gofakeit.Bool() {
		return gofakeit.RandomString(kenyanCompanies)
	}
	return gofakeit.Company()
}

func GenerateProjectName() string {
	return fmt.Sprintf("Project %s", gofakeit.BuzzWord())
}

func GenerateJobTitle() string {
	kenyanRoles := []string{
		"Payroll Clerk", "HR Officer", "Accountant", "Site Supervisor",
		"Warehouse Assistant", "Driver", "Security Guard", "Production Operator",
	}

	if gofakeit.Bool() {
		return gofakeit.RandomString(kenyanRoles)
	}
	return gofakeit.JobTitle()
}

func GenerateWorkingHours() float64 {
	baseHours := 8.0
	variation := (gofakeit.Float64() - 0.5) * 2.0
	hours := baseHours + variation
	if hours < 0.5 {
		hours = 0.5
	}
	if hours > 12.0 {
		hours = 12.0
	}
	return float64(int(hours*100)) / 100
}

func GenerateUniqueUsername(prefix string, existingUsernames map[string]bool) string {
	for i := 1; i <= 1000; i++ {
		username := fmt.Sprintf("%s%d", prefix, i)
		if !existingUsernames[username] {
			existingUsernames[username] = true
			return username
		}
	}
	// Fallback to random generation if all numbered options are taken
	for {
		randomSuffix := gofakeit.Number(10000, 99999)
		username := fmt.Sprintf("%s%d", prefix, randomSuffix)
		if !existingUsernames[username] {
			existingUsernames[username] = true
			return username
		}
	}
}

func GenerateUniqueEmail(name string, existingEmails map[string]bool) string {
	domains := []string{"company.co.ke", "gmail.com", "outlook.com"}

	nameSlug := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	nameSlug = strings.ReplaceAll(nameSlug, "ă", "a")
	nameSlug = strings.ReplaceAll(nameSlug, "â", "a")
	nameSlug = strings.ReplaceAll(nameSlug, "đ", "d")
	nameSlug = strings.ReplaceAll(nameSlug, "ê", "e")
	nameSlug = strings.ReplaceAll(nameSlug, "ô", "o")
	nameSlug = strings.ReplaceAll(nameSlug, "ơ", "o")
	nameSlug = strings.ReplaceAll(nameSlug, "ư", "u")

	emailDomain := gofakeit.RandomString(domains)

	// Try basic email first
	baseEmail := fmt.Sprintf("%s@%s", nameSlug, emailDomain)
	if !existingEmails[baseEmail] {
		existingEmails[baseEmail] = true
		return baseEmail
	}

	// Try with numbers
	for i := 1; i <= 999; i++ {
		email := fmt.Sprintf("%s%d@%s", nameSlug, i, emailDomain)
		if !existingEmails[email] {
			existingEmails[email] = true
			return email
		}
	}

	// Fallback to random suffix
	for {
		randomSuffix := gofakeit.Number(1000, 99999)
		email := fmt.Sprintf("%s%d@%s", nameSlug, randomSuffix, emailDomain)
		if !existingEmails[email] {
			existingEmails[email] = true
			return email
		}
	}
}

func GenerateUniqueNationalID(existingIDs map[string]bool) string {
	for i := 0; i < 1000; i++ {
		id := GenerateNationalID()
		if !existingIDs[id] {
			existingIDs[id] = true
			return id
		}
	}
	panic("unable to generate a unique national ID after 1000 attempts")
}

func GenerateUniqueProjectCode(existingCodes map[string]bool) string {
	year := clock.Now().Year() % 100

	for i := 1; i <= 9999; i++ {
		code := fmt.Sprintf("PRJ%02d%02d", year, i)
		if !existingCodes[code] {
			existingCodes[code] = true
			return code
		}
	}

	// Fallback to random generation
	for {
		randomSuffix := gofakeit.Number(1000, 9999)
		code := fmt.Sprintf("PRJ%02d%d", year, randomSuffix)
		if !existingCodes[code] {
			existingCodes[code] = true
			return code
		}
	}
}

// GenerateRealisticUserProfile creates a complete user profile with collision avoidance
func GenerateRealisticUserProfile(existingUsernames, existingEmails, existingCCCDs map[string]bool) *UserProfile {
	fullName := GenerateKenyanName()
	return &UserProfile{
		FullName:    fullName,
		Username:    GenerateUniqueUsername("user", existingUsernames),
		Email:       GenerateUniqueEmail(fullName, existingEmails),
		Phone:       GenerateRealisticPhone(),
		Address:     GenerateKenyanAddress(),
		CCCD:        GenerateUniqueNationalID(existingCCCDs),
		BankAccount: GenerateBankAccount(),
	}
}

// GenerateUniqueUsernameWithDB provides enhanced collision detection with database verification
func GenerateUniqueUsernameWithDB(ctx context.Context, db *gorm.DB, prefix string, existingUsernames map[string]bool) string {
	for i := 1; i <= 1000; i++ {
		username := fmt.Sprintf("%s%d", prefix, i)
		if !existingUsernames[username] {
			// Double-check against database
			var count int64
			db.Model(&domain.User{}).Where("username = ?", username).Count(&count)
			if count == 0 {
				existingUsernames[username] = true
				return username
			}
		}
	}
	// Fallback to UUID-based generation for ultimate uniqueness
	return fmt.Sprintf("%s_%s", prefix, strings.ReplaceAll(uuid.New().String()[:8], "-", ""))
}

// GenerateUniqueEmailWithDB provides enhanced collision detection with database verification
func GenerateUniqueEmailWithDB(ctx context.Context, db *gorm.DB, name string, existingEmails map[string]bool) string {
	domains := []string{"company.co.ke", "gmail.com", "outlook.com"}

	nameSlug := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	nameSlug = strings.ReplaceAll(nameSlug, "ă", "a")
	nameSlug = strings.ReplaceAll(nameSlug, "â", "a")
	nameSlug = strings.ReplaceAll(nameSlug, "đ", "d")
	nameSlug = strings.ReplaceAll(nameSlug, "ê", "e")
	nameSlug = strings.ReplaceAll(nameSlug, "ô", "o")
	nameSlug = strings.ReplaceAll(nameSlug, "ơ", "o")
	nameSlug = strings.ReplaceAll(nameSlug, "ư", "u")

	emailDomain := gofakeit.RandomString(domains)

	// Try basic email first
	baseEmail := fmt.Sprintf("%s@%s", nameSlug, emailDomain)
	if !existingEmails[baseEmail] {
		var count int64
		db.Model(&domain.User{}).Where("email = ?", baseEmail).Count(&count)
		if count == 0 {
			existingEmails[baseEmail] = true
			return baseEmail
		}
	}

	// Try with numbers
	for i := 1; i <= 999; i++ {
		email := fmt.Sprintf("%s%d@%s", nameSlug, i, emailDomain)
		if !existingEmails[email] {
			var count int64
			db.Model(&domain.User{}).Where("email = ?", email).Count(&count)
			if count == 0 {
				existingEmails[email] = true
				return email
			}
		}
	}

	// Fallback to UUID-based generation
	return fmt.Sprintf("%s_%s@%s", nameSlug, strings.ReplaceAll(uuid.New().String()[:8], "-", ""), emailDomain)
}

// EmployeeProfile represents a complete employee profile with career progression
type EmployeeProfile struct {
	*UserProfile
	Position       string
	Experience     string
	Seniority      int // years of experience
	BasePayRate    int // KES per hour
	IsReliable     bool
	AttendanceRate float64
}

// ProjectProfile represents realistic project data
type ProjectProfile struct {
	Name             string
	ClientName       string
	Code             string
	Description      string
	Status           string
	Budget           float64
	ExpectedDuration int // months
	TeamSize         int
}

// Position hierarchy with representative Kenyan hourly rates in KES.
var kenyanPositions = map[string]struct {
	BaseRate    int
	MinExp      int
	MaxExp      int
	Description string
}{
	"Intern":             {150, 0, 1, "Entry-level employee"},
	"General Worker":     {250, 0, 3, "General worker"},
	"Experienced Worker": {350, 2, 8, "Experienced worker"},
	"Skilled Worker":     {450, 3, 10, "Skilled worker"},
	"Team Leader":        {550, 5, 15, "Leads a small team"},
	"Supervisor":         {650, 7, 20, "Supervises a work shift"},
	"Technician":         {750, 4, 15, "Operates and maintains equipment"},
}

var kenyanProjectTypes = []struct {
	Industry     string
	ProjectTypes []string
	AvgBudget    float64 // million KES
	AvgDuration  int     // months
}{
	{
		"Textiles",
		[]string{"Uniform production", "Cotton processing", "Garment production", "Fabric finishing"},
		25,
		8,
	},
	{
		"Agriculture",
		[]string{"Fresh produce packing", "Tea processing", "Dairy production", "Grain milling"},
		18,
		6,
	},
	{
		"Food",
		[]string{"Food processing", "Bakery production", "Dairy processing", "Beverage production"},
		32,
		10,
	},
	{
		"Construction",
		[]string{"Residential construction", "Road maintenance", "Building renovation", "Site preparation"},
		45,
		12,
	},
	{
		"Logistics",
		[]string{"Warehouse operations", "Last-mile delivery", "Freight handling", "Fleet maintenance"},
		20,
		9,
	},
}

// GenerateRealisticEmployeeProfile creates a comprehensive employee profile
func GenerateRealisticEmployeeProfile(existingUsernames, existingEmails, existingCCCDs map[string]bool) *EmployeeProfile {
	baseProfile := GenerateRealisticUserProfile(existingUsernames, existingEmails, existingCCCDs)

	// Determine seniority and position based on age-like factors
	age := 20 + mathrand.IntN(40) // 20-60 years old
	seniority := max(0, age-22)   // assuming start working at 22

	// Select position based on experience
	var position string
	var baseRate int

	switch {
	case seniority <= 1:
		if mathrand.Float64() < 0.3 {
			position = "Intern"
		} else {
			position = "General Worker"
		}
	case seniority <= 3:
		positions := []string{"General Worker", "Experienced Worker"}
		position = gofakeit.RandomString(positions)
	case seniority <= 8:
		positions := []string{"Experienced Worker", "Skilled Worker", "Team Leader"}
		position = gofakeit.RandomString(positions)
	default:
		positions := []string{"Skilled Worker", "Team Leader", "Supervisor", "Technician"}
		position = gofakeit.RandomString(positions)
	}

	posInfo := kenyanPositions[position]
	baseRate = posInfo.BaseRate

	// Add variation based on individual performance
	variation := mathrand.Float64()*0.3 - 0.15 // ±15% variation
	baseRate = int(float64(baseRate) * (1 + variation))

	// Determine reliability and attendance
	isReliable := mathrand.Float64() < 0.75 // 75% of workers are reliable
	var attendanceRate float64
	if isReliable {
		attendanceRate = 0.85 + mathrand.Float64()*0.13 // 85-98%
	} else {
		attendanceRate = 0.60 + mathrand.Float64()*0.25 // 60-85%
	}

	return &EmployeeProfile{
		UserProfile:    baseProfile,
		Position:       position,
		Experience:     posInfo.Description,
		Seniority:      seniority,
		BasePayRate:    baseRate,
		IsReliable:     isReliable,
		AttendanceRate: attendanceRate,
	}
}

// GenerateRealisticProjectProfile creates a comprehensive project profile
func GenerateRealisticProjectProfile(existingCodes map[string]bool) *ProjectProfile {
	industryData := kenyanProjectTypes[mathrand.IntN(len(kenyanProjectTypes))]
	projectType := gofakeit.RandomString(industryData.ProjectTypes)

	// Generate realistic client company name
	companyTypes := []string{"Ltd", "PLC", "Company"}
	companyType := gofakeit.RandomString(companyTypes)

	industryNames := []string{
		industryData.Industry + " Kenya",
		industryData.Industry + " Services",
		industryData.Industry + " Enterprises",
		industryData.Industry + " Solutions",
	}
	industryName := gofakeit.RandomString(industryNames)
	clientName := fmt.Sprintf("%s %s", companyType, industryName)

	// Generate budget with realistic variation
	budgetVariation := 0.5 + mathrand.Float64()                  // 0.5x to 1.5x base budget
	budget := industryData.AvgBudget * budgetVariation * 1000000

	// Generate duration with variation
	durationVariation := 0.7 + mathrand.Float64()*0.6 // 0.7x to 1.3x
	duration := int(float64(industryData.AvgDuration) * durationVariation)
	if duration < 1 {
		duration = 1
	}

	// Team size based on budget and duration
	teamSize := int(budget / float64(duration) / 12 / 30 / 8 / 350) // rough calculation based on average worker cost
	if teamSize < 5 {
		teamSize = 5 + mathrand.IntN(10)
	}
	if teamSize > 100 {
		teamSize = 50 + mathrand.IntN(50)
	}

	// Generate project status based on realistic distribution
	statusRand := mathrand.Float64()
	var status string
	switch {
	case statusRand < 0.1:
		status = "draft"
	case statusRand < 0.6:
		status = "active"
	case statusRand < 0.85:
		status = "completed"
	default:
		status = "cancelled"
	}

	description := fmt.Sprintf(
		"%s project operated by %s with a team of %d employees over %d months and a budget of KES %.0f.",
		projectType, clientName, teamSize, duration, budget,
	)

	return &ProjectProfile{
		Name:             projectType,
		ClientName:       clientName,
		Code:             GenerateUniqueProjectCode(existingCodes),
		Description:      description,
		Status:           status,
		Budget:           budget,
		ExpectedDuration: duration,
		TeamSize:         teamSize,
	}
}

// GenerateRealisticPayrates creates realistic pay rate structures
func GenerateRealisticPayrates(position string, baseRate int) map[string]int {
	rates := make(map[string]int)

	rates["normal"] = baseRate
	rates["overtime"] = int(float64(baseRate) * 1.5)
	rates["weekend"] = int(float64(baseRate) * 2.0)  // 200% for weekend work
	rates["holiday"] = int(float64(baseRate) * 3.0)  // 300% for holiday work

	// Add some position-specific variations
	switch position {
	case "Supervisor", "Technician":
		// Supervisors get slightly higher weekend/holiday premiums
		rates["weekend"] = int(float64(baseRate) * 2.2)
		rates["holiday"] = int(float64(baseRate) * 3.5)
	case "Intern":
		// Interns get lower premiums
		rates["overtime"] = int(float64(baseRate) * 1.3)
		rates["weekend"] = int(float64(baseRate) * 1.8)
		rates["holiday"] = int(float64(baseRate) * 2.5)
	}

	return rates
}

// GenerateKenyanHolidays returns public holidays with fixed calendar dates.
func GenerateKenyanHolidays(year int) []time.Time {
	holidays := []time.Time{
		time.Date(year, 1, 1, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 5, 1, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 6, 1, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 10, 20, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 12, 12, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 12, 25, 0, 0, 0, 0, clock.DefaultLocation),
		time.Date(year, 12, 26, 0, 0, 0, 0, clock.DefaultLocation),
	}
	return holidays
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func init() {
	_ = gofakeit.Seed(clock.Now().UnixNano())
}
