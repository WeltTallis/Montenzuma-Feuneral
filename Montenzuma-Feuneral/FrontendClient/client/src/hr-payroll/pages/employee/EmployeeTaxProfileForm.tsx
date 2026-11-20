import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hr/components/ui/card';
import { Input } from '@hr/components/ui/input';
import { Label } from '@hr/components/ui/label';
import { Button } from '@hr/components/ui/button';
import { useEmployeeProfile, useUpdateEmployeeProfile } from '@hr/hooks/api/useEmployeePortal';

const EmployeeTaxProfileForm = () => {
  const { data: profile } = useEmployeeProfile();
  const updateProfile = useUpdateEmployeeProfile();
  const [kraPIN, setKraPIN] = useState('');
  const [nssfNumber, setNssfNumber] = useState('');
  const [shaNumber, setSHANumber] = useState('');

  useEffect(() => {
    setKraPIN(profile?.kra_pin ?? '');
    setNssfNumber(profile?.nssf_number ?? '');
    setSHANumber(profile?.sha_number ?? '');
  }, [profile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      kra_pin: kraPIN.trim().toUpperCase(),
      nssf_number: nssfNumber.trim(),
      sha_number: shaNumber.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax and statutory details</CardTitle>
        <CardDescription>
          Add or update your Kenyan KRA, NSSF and SHA membership details. Only you can edit this profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="employee-kra-pin">KRA PIN</Label>
            <Input
              id="employee-kra-pin"
              value={kraPIN}
              onChange={(event) => setKraPIN(event.target.value.toUpperCase())}
              maxLength={11}
              autoComplete="off"
              placeholder="A000000000Z"
              pattern="[A-Za-z][A-Za-z0-9]{9}[A-Za-z]"
              title="Enter an 11-character KRA PIN."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-nssf-number">NSSF number</Label>
            <Input
              id="employee-nssf-number"
              value={nssfNumber}
              onChange={(event) => setNssfNumber(event.target.value)}
              maxLength={32}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-sha-number">SHA / SHIF member number</Label>
            <Input
              id="employee-sha-number"
              value={shaNumber}
              onChange={(event) => setSHANumber(event.target.value)}
              maxLength={32}
              autoComplete="off"
            />
          </div>
          {updateProfile.isError && (
            <p className="text-sm text-destructive" role="alert">
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Unable to save your statutory details.'}
            </p>
          )}
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save statutory details'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmployeeTaxProfileForm;
