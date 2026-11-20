import { memo } from 'react';
import { Alert, AlertDescription } from '@hr/components/ui/alert';
import { Info } from 'lucide-react';

interface RatePreviewCardProps {
  ratePreview?: number;
  hoursWorked: number;
}

export const RatePreviewCard = memo(({ ratePreview, hoursWorked }: RatePreviewCardProps) => {
  if (!ratePreview) return null;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Estimated rate: <strong>KES {ratePreview.toLocaleString('en-KE')} per hour</strong>
        {hoursWorked > 0 && (
          <span> → Total: <strong>KES {(ratePreview * hoursWorked).toLocaleString('en-KE')}</strong></span>
        )}
      </AlertDescription>
    </Alert>
  );
});

RatePreviewCard.displayName = 'RatePreviewCard';
