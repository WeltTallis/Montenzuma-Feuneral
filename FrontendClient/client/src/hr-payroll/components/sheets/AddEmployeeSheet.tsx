import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@hr/components/ui/button';
import { Input } from '@hr/components/ui/input';
import { Label } from '@hr/components/ui/label';
import { BankSelector } from '@hr/components/ui/bank-selector';
import { Alert, AlertDescription } from '@hr/components/ui/alert';
import { X, User, CreditCard, UserPlus, Plus, Loader2, AlertTriangle, Search, HandHeart, FileText } from 'lucide-react';
import { toast } from '@hr/components/ui/sonner';
import { CreateEmployeeData, DuplicateCheckMatch } from '@hr/types/api/employee.types';
import { useCreateEmployee, useDuplicateCheck, useRequestEmployeeAccess } from '@hr/hooks/api/useEmployees';
import { useSettingByKey } from '@hr/hooks/api/useSettings';
import { useDebounce } from '@hr/hooks/useDebounce';
import { SlideSheetTemplate } from './templates/SlideSheetTemplate';
import { useModalNavigation } from '@hr/hooks/useModalNavigation';
import { authManager } from '@hr/lib/auth';
import {
  validateFullname,
  formatKenyanName,
  validateKenyanNationalId,
  validatePhoneNumber,
  validateMobileNotNationalID,
} from '@hr/lib/validation';
import { cn } from '@hr/lib/utils';
import type { Bank } from '@hr/types/api/bank.types';
import type { ModalConfig } from '@hr/types/modal-config.types';

/** Match card: masked existing employee + claim action for partners. */
function DuplicateMatchCard({
  match,
  onClaim,
  isClaiming,
  showClaim,
}: {
  match: DuplicateCheckMatch;
  onClaim: (id: number) => void;
  isClaiming: boolean;
  showClaim: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="typography-body-medium font-semibold text-foreground truncate">
            {match.fullname}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
            {match.cccd_masked && (
              <span className="typography-label-medium font-mono">{match.cccd_masked}</span>
            )}
            {match.mobile_masked && (
              <span className="typography-label-medium font-mono">{match.mobile_masked}</span>
            )}
            {match.email_masked && (
              <span className="typography-label-medium">{match.email_masked}</span>
            )}
          </div>
          <p className="typography-label-medium text-muted-foreground">
            {[
              match.created_by_name && `Manager: ${match.created_by_name}`,
              match.current_project_names?.length
                ? `Current assignment: ${match.current_project_names.join(', ')}`
                : null,
              match.created_at
                ? `Registered: ${new Date(match.created_at).toLocaleDateString('en-KE')}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {showClaim && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onClaim(match.id)}
            disabled={isClaiming}
            className="shrink-0 gap-1.5"
          >
            {isClaiming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <HandHeart className="h-3.5 w-3.5" />
            )}
            Request access
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="h-6 w-6 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="typography-headline-small text-foreground">{label}</span>
    </div>
  );
}

function Field({ id, label, required, children }: { id?: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="typography-label-medium text-muted-foreground">
        {label}{required && <span className="text-red-700 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function normalizeKenyanMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('254')) return `0${digits.slice(3)}`;
  return digits;
}

export const modalConfig: ModalConfig = {
  id: 'add-employee-sheet',
  name: 'Add Employee',
  description: 'Create a new employee',
  category: 'employee',
  permissions: {
    action: 'create',
    subject: 'Employee',
    roles: ['admin', 'partner'],
  },
  deeplink: {
    enabled: true,
    params: [],
    example: '?modal=add-employee-sheet',
  },
  requiresAuth: true,
  encryptData: false,
};

interface AddEmployeeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddEmployeeSheetComponentProps extends AddEmployeeSheetProps { }

function AddEmployeeSheetComponent({
  isOpen,
  onClose
}: AddEmployeeSheetComponentProps) {
  const createEmployee = useCreateEmployee();
  const userRole = authManager.getUserRole();
  const isAdmin = userRole === 'admin';
  const requestAccess = useRequestEmployeeAccess();
  // Missing row = OFF: only a stored 'true' makes mobile mandatory on create.
  const { data: mobileRequiredSetting } = useSettingByKey('employee.mobile_required');
  const mobileRequired = mobileRequiredSetting?.value === 'true';

  const [formData, setFormData] = useState<CreateEmployeeData>({
    fullname: '',
    email: '',
    cccd: '',
    kra_pin: '',
    nssf_number: '',
    sha_number: '',
    address: '',
    mobile: '',
    bank_id: undefined,
    bank_account_number: '',
    bank_account_name: '',
    date_of_birth: ''
  });

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Duplicate detection (global, pre-create) ---
  // Debounced check on the three stable identifiers; National ID and mobile matches
  // are hard blocks (backend 409s anyway), email matches stay soft warnings.
  const debouncedCCCD = useDebounce(formData.cccd?.trim() || '', 500);
  const debouncedMobile = useDebounce(normalizeKenyanMobileNumber(formData.mobile || ''), 500);
  const debouncedEmail = useDebounce(formData.email?.trim() || '', 500);

  const checkParams = useMemo(() => {
    const params: { cccd?: string; mobile?: string; email?: string } = {};
    // Only check once identifiers are plausibly complete to avoid noisy
    // partial-input matches.
    if (debouncedCCCD.length >= 7) params.cccd = debouncedCCCD;
    if (debouncedMobile.length >= 9) params.mobile = debouncedMobile;
    if (debouncedEmail.includes('@') && debouncedEmail.includes('.')) params.email = debouncedEmail;
    return params;
  }, [debouncedCCCD, debouncedMobile, debouncedEmail]);

  const duplicateCheck = useDuplicateCheck(checkParams);
  const duplicates = useMemo(
    () => (duplicateCheck.data?.has_duplicates ? duplicateCheck.data.data : []),
    [duplicateCheck.data],
  );
  const cccdBlocked = useMemo(
    () => duplicates.some((m) => m.matched_on.includes('cccd')),
    [duplicates],
  );
  const mobileBlockedMatches = useMemo(
    () => duplicates.filter((m) => m.matched_on.includes('mobile')),
    [duplicates],
  );
  const mobileBlocked = mobileBlockedMatches.length > 0;
  const softWarnings = useMemo(
    () => duplicates.filter((m) => !m.matched_on.includes('cccd') && !m.matched_on.includes('mobile')),
    [duplicates],
  );

  const handleClaim = async (employeeId: number) => {
    try {
      await requestAccess.mutateAsync(employeeId);
      toast({ title: 'Employee added to your managed list.' });
      handleClose();
    } catch {
      // Error notification handled globally
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form when sheet opens
      setFormData({
        fullname: '',
        email: '',
        cccd: '',
        kra_pin: '',
        nssf_number: '',
        sha_number: '',
        address: '',
        mobile: '',
        bank_id: undefined,
        bank_account_number: '',
        bank_account_name: '',
        date_of_birth: ''
      });
      setSelectedBank(null);
      setErrors({});
    }
  }, [isOpen]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    // Required fields according to API documentation
    const fullnameValidation = validateFullname(formData.fullname || '');
    if (!fullnameValidation.valid) {
      newErrors.fullname = fullnameValidation.error || 'Enter a valid full name.';
    }

    if (!formData.cccd?.trim()) {
      newErrors.cccd = 'National ID is required.';
    } else {
      const nationalIdValidation = validateKenyanNationalId(formData.cccd);
      if (!nationalIdValidation.valid) {
        newErrors.cccd = nationalIdValidation.error || 'Enter a valid Kenyan National ID.';
      }
    }

    // Optional fields validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (formData.kra_pin?.trim() && !/^[A-Za-z][A-Za-z0-9]{9}[A-Za-z]$/.test(formData.kra_pin.trim())) {
      newErrors.kra_pin = 'Enter a valid 11-character KRA PIN.';
    }

    if (mobileRequired && !formData.mobile?.trim()) {
      newErrors.mobile = 'Phone number is required.';
    } else if (formData.mobile) {
      const phoneValidation = validatePhoneNumber(formData.mobile);
      if (!phoneValidation.valid) {
        newErrors.mobile = phoneValidation.error || 'Enter a valid Kenyan mobile number.';
      } else {
        const nationalIdGuard = validateMobileNotNationalID(formData.mobile);
        if (!nationalIdGuard.valid) {
          newErrors.mobile = nationalIdGuard.error || 'Enter a mobile number, not a National ID.';
        }
      }
    }

    if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Enter a valid date of birth.';
    }

    // Bank validation - if any bank field is provided, all are required
    const hasBankInfo = selectedBank || formData.bank_account_number?.trim() || formData.bank_account_name?.trim();
    if (hasBankInfo) {
      if (!selectedBank) {
        newErrors.bank_id = 'Select a bank.';
      }
      if (!formData.bank_account_number?.trim()) {
        newErrors.bank_account_number = 'Account number is required when bank details are provided.';
      }
      if (!formData.bank_account_name?.trim()) {
        newErrors.bank_account_name = 'Account holder name is required when bank details are provided.';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Only include fields that have values, excluding empty optional fields
    const requestData: CreateEmployeeData = {
      fullname: formData.fullname,
      cccd: formData.cccd.trim()
    };

    // Add optional fields only if they have values
    if (formData.email?.trim()) {
      requestData.email = formData.email.trim();
    }
    if (formData.address?.trim()) {
      requestData.address = formData.address.trim();
    }
    if (formData.kra_pin?.trim()) {
      requestData.kra_pin = formData.kra_pin.trim().toUpperCase();
    }
    if (formData.nssf_number?.trim()) {
      requestData.nssf_number = formData.nssf_number.trim();
    }
    if (formData.sha_number?.trim()) {
      requestData.sha_number = formData.sha_number.trim();
    }
    if (formData.mobile?.trim() || mobileRequired) {
      requestData.mobile = normalizeKenyanMobileNumber(formData.mobile || '');
    }
    if (selectedBank) {
      requestData.bank_id = selectedBank.id;
    }
    if (formData.bank_account_number?.trim()) {
      requestData.bank_account_number = formData.bank_account_number.trim();
    }
    if (formData.bank_account_name?.trim()) {
      requestData.bank_account_name = formData.bank_account_name.trim();
    }
    if (formData.date_of_birth?.trim()) {
      requestData.date_of_birth = formData.date_of_birth.trim();
    }

    try {
      await createEmployee.mutateAsync(requestData);
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleInputChange = (field: keyof CreateEmployeeData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Wrapped close handler
  const handleClose = () => {
    onClose();
  };


  return (
    <SlideSheetTemplate
      isOpen={isOpen}
      onClose={handleClose}
      avatar={{ icon: UserPlus }}
      title="Register employee"
      description="Create an employee record for your funeral home."
      footer={
        <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="min-h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createEmployee.isPending || cccdBlocked || mobileBlocked}
            className="min-h-11 px-5 gap-1.5"
          >
            {createEmployee.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {createEmployee.isPending ? 'Registering…' : 'Register employee'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Personal Info Section */}
        <FieldGroup>
          <SectionTitle icon={User} label="Personal details" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="fullname" label="Full legal name" required>
              <Input
                id="fullname"
                placeholder="e.g. Amina Wanjiku"
                value={formData.fullname || ''}
                onChange={(e) => handleInputChange("fullname", e.target.value)}
                onBlur={(e) => {
                  const formatted = formatKenyanName(e.target.value);
                  if (formatted !== e.target.value) {
                    handleInputChange("fullname", formatted);
                  }
                }}
                className={cn("h-11 typography-body-medium", errors.fullname && "border-red-500")}
              />
              {errors.fullname && <p role="alert" className="typography-body-small text-financial-negative">{errors.fullname}</p>}
            </Field>
            <Field id="email" label="Email address">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="employee@example.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn("h-11 typography-body-medium", errors.email && "border-red-500")}
              />
              {errors.email && <p role="alert" className="typography-body-small text-financial-negative">{errors.email}</p>}
            </Field>

            <Field id="date_of_birth" label="Date of birth">
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                className={cn("h-11 typography-body-medium", errors.date_of_birth && "border-red-500")}
              />
              {errors.date_of_birth && <p role="alert" className="typography-body-small text-financial-negative">{errors.date_of_birth}</p>}
            </Field>
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="cccd" label="Kenyan National ID" required>
              <Input
                id="cccd"
                placeholder="National ID number"
                value={formData.cccd || ''}
                onChange={(e) => handleInputChange("cccd", e.target.value)}
                className={cn("h-11 typography-body-medium font-mono tracking-wide", errors.cccd && "border-red-500")}
              />
              {errors.cccd && <p role="alert" className="typography-body-small text-financial-negative">{errors.cccd}</p>}
            </Field>

            <Field id="mobile" label="Phone number" required={mobileRequired}>
              <Input
                id="mobile"
                placeholder="0712 345 678 or +254 712 345 678"
                value={formData.mobile || ''}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                className={cn("h-11 typography-body-medium font-mono", errors.mobile && "border-red-500")}
              />
              {errors.mobile && <p role="alert" className="typography-body-small text-financial-negative">{errors.mobile}</p>}
            </Field>
          </div>

          <Field id="address" label="Home address">
            <Input
              id="address"
              placeholder="Estate, town, county"
              value={formData.address || ''}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="h-11 typography-body-medium"
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <SectionTitle icon={FileText} label="Kenyan statutory details" />
          <p className="typography-body-small text-muted-foreground">
            Add these identifiers for payroll records. Automatic statutory deduction calculations are not yet connected to payroll.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="kra_pin" label="KRA PIN">
              <Input
                id="kra_pin"
                autoComplete="off"
                maxLength={11}
                placeholder="A000000000Z"
                value={formData.kra_pin || ''}
                onChange={(e) => handleInputChange('kra_pin', e.target.value.toUpperCase())}
                className={cn("h-11 typography-body-medium font-mono", errors.kra_pin && "border-red-500")}
              />
              {errors.kra_pin && <p role="alert" className="typography-body-small text-financial-negative">{errors.kra_pin}</p>}
            </Field>
            <Field id="nssf_number" label="NSSF number">
              <Input
                id="nssf_number"
                autoComplete="off"
                maxLength={32}
                value={formData.nssf_number || ''}
                onChange={(e) => handleInputChange('nssf_number', e.target.value)}
                className="h-11 typography-body-medium font-mono"
              />
            </Field>
            <Field id="sha_number" label="SHA / SHIF member number">
              <Input
                id="sha_number"
                autoComplete="off"
                maxLength={32}
                value={formData.sha_number || ''}
                onChange={(e) => handleInputChange('sha_number', e.target.value)}
                className="h-11 typography-body-medium font-mono"
              />
            </Field>
          </div>
        </FieldGroup>

        {/* Duplicate detection results */}
        {cccdBlocked && duplicates.length > 0 && (
          <Alert variant="destructive" className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="typography-body-medium font-semibold">
                  An employee with this National ID already exists.
                </p>
                <AlertDescription>
                  This ID cannot be registered twice. If you need access to this employee, ask their current manager to share the record.
                </AlertDescription>
              </div>
            </div>
            <div className="space-y-2 pl-6">
              {duplicates.map((match) => (
                <DuplicateMatchCard
                  key={match.id}
                  match={match}
                  onClaim={handleClaim}
                  isClaiming={requestAccess.isPending}
                  showClaim={!isAdmin}
                />
              ))}
            </div>
          </Alert>
        )}

        {mobileBlocked && (
          <Alert variant="destructive" className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="typography-body-medium font-semibold">
                  This phone number is already assigned to another employee.
                </p>
                <AlertDescription>
                  Enter a different phone number to continue.
                </AlertDescription>
              </div>
            </div>
            <div className="space-y-2 pl-6">
              {mobileBlockedMatches.map((match) => (
                <DuplicateMatchCard
                  key={match.id}
                  match={match}
                  onClaim={handleClaim}
                  isClaiming={requestAccess.isPending}
                  showClaim={!isAdmin}
                />
              ))}
            </div>
          </Alert>
        )}

        {!cccdBlocked && !mobileBlocked && softWarnings.length > 0 && (
          <Alert className="space-y-3 border-warning/40 bg-warning/5 text-foreground">
            <div className="flex items-start gap-2">
              <Search className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
              <div className="space-y-1">
                <p className="typography-body-medium font-semibold">
                  Some contact details are already in use.
                </p>
                <AlertDescription>
                  This person may already be registered. Check the details before creating another record.
                </AlertDescription>
              </div>
            </div>
            <div className="space-y-2 pl-6">
              {softWarnings.map((match) => (
                <DuplicateMatchCard
                  key={match.id}
                  match={match}
                  onClaim={handleClaim}
                  isClaiming={requestAccess.isPending}
                  showClaim={!isAdmin}
                />
              ))}
            </div>
          </Alert>
        )}

        {/* Bank Info Section */}
        <FieldGroup>
          <SectionTitle icon={CreditCard} label="Bank details for salary payments" />

          <Field label="Bank">
            <BankSelector
              value={selectedBank}
              onSelect={(bank) => {
                setSelectedBank(bank);
                handleInputChange("bank_id", bank?.id);
              }}
              placeholder="Select a bank"
              className={errors.bank_id ? 'border-red-500' : ''}
              canCreateBank={isAdmin}
            />
            {errors.bank_id && <p role="alert" className="typography-body-small text-financial-negative">{errors.bank_id}</p>}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="bank_account_number" label="Account number">
              <Input
                id="bank_account_number"
                placeholder="Employee bank account number"
                value={formData.bank_account_number || ''}
                onChange={(e) => handleInputChange("bank_account_number", e.target.value)}
                className={cn("h-11 typography-body-medium font-mono", errors.bank_account_number && "border-red-500")}
              />
              {errors.bank_account_number && <p role="alert" className="typography-body-small text-financial-negative">{errors.bank_account_number}</p>}
            </Field>

            <Field id="bank_account_name" label="Account holder name">
              <Input
                id="bank_account_name"
                placeholder="Name as shown on bank account"
                value={formData.bank_account_name || ''}
                onChange={(e) => handleInputChange("bank_account_name", e.target.value)}
                onBlur={(e) => {
                  const formatted = formatKenyanName(e.target.value);
                  if (formatted !== e.target.value) {
                    handleInputChange("bank_account_name", formatted);
                  }
                }}
                className={cn("h-11 typography-body-medium", errors.bank_account_name && "border-red-500")}
              />
              {errors.bank_account_name && <p role="alert" className="typography-body-small text-financial-negative">{errors.bank_account_name}</p>}
            </Field>
          </div>
        </FieldGroup>
      </div>
    </SlideSheetTemplate>
  );
}

/**
 * Container component that provides URL synchronization for AddEmployeeSheet
 * Updated to work with modal navigation system
 */
export function AddEmployeeSheet({
  isOpen: propIsOpen,
  onClose: propOnClose
}: AddEmployeeSheetProps) {
  const [searchParams] = useSearchParams();
  const { closeModal } = useModalNavigation();
  // Check if modal is open via URL
  const modalId = searchParams.get('modal');
  const isOpenViaUrl = modalId === 'add_employee';

  // Use URL state if available, otherwise use props
  const isOpen = isOpenViaUrl || propIsOpen;

  // Close modal using centralized navigation or provided onClose
  const handleClose = () => {
    if (isOpenViaUrl) {
      closeModal();
    } else {
      propOnClose();
    }
  };

  return (
    <AddEmployeeSheetComponent
      isOpen={isOpen}
      onClose={handleClose}
    />
  );
}

export default AddEmployeeSheet;
