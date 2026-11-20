import { RadioGroup, RadioGroupItem } from '@hr/components/ui/radio-group';
import { Label } from '@hr/components/ui/label';
import { AlertTriangle, Calendar, Sun } from 'lucide-react';
import { DayType } from '@hr/types/api/payrate.types';
import { getDayTypeOrNull, isKenyanPublicHoliday, isSaturdayRequiringDayType } from '@hr/utils/dateHelpers';

interface DayTypeIndicatorProps {
  date: Date;
  dayType: DayType | null;
  onDayTypeChange: (dayType: DayType) => void;
}

export function DayTypeIndicator({
  date,
  dayType,
  onDayTypeChange
}: DayTypeIndicatorProps) {
  const dateString = date.toISOString().split('T')[0];
  const isSaturday = isSaturdayRequiringDayType(dateString);
  const isHoliday = isKenyanPublicHoliday(dateString);
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;

  // Auto-determined day type (if not Saturday)
  const autoDayType = !isSaturday ? getDayTypeOrNull(dateString) : null;

  const getDayTypeIcon = (type: DayType) => {
    switch (type) {
      case 'ngày lễ':
        return <Calendar className="h-4 w-4" />;
      case 'ngày nghỉ':
        return <Sun className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getDayTypeDescription = (type: DayType) => {
    switch (type) {
      case 'ngày thường':
        return 'Regular working day (Monday to Friday)';
      case 'ngày nghỉ':
        return 'Rest day (Sunday or a Saturday off)';
      case 'ngày lễ':
        return 'Public holiday';
      default:
        return '';
    }
  };

  // If not Saturday, show auto-determined day type
  if (!isSaturday && autoDayType) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="typography-body-medium">Day type</Label>
          <div className={`flex items-center gap-1 typography-body-medium font-medium ${
            autoDayType === 'ngày lễ' ? 'text-red-700' :
            autoDayType === 'ngày nghỉ' ? 'text-muted-foreground' : 'text-blue-700'
          }`}>
            {getDayTypeIcon(autoDayType)}
            {autoDayType === 'ngày thường' ? 'Regular day' :
             autoDayType === 'ngày nghỉ' ? 'Rest day' : 'Public holiday'}
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-3">
          <p className="typography-body-small text-muted-foreground">
            {getDayTypeDescription(autoDayType)}
          </p>
        </div>
      </div>
    );
  }

  // Saturday - requires user selection
  if (isSaturday) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="typography-body-medium">Day type</Label>
          <div className="flex items-center gap-1 typography-body-medium font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Needs selection
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
          <p className="typography-body-small text-warning-foreground mb-3">
            <strong>Saturday:</strong> Select a day type
          </p>

          <RadioGroup
            value={dayType || ''}
            onValueChange={(value) => onDayTypeChange(value as DayType)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ngày thường" id="weekday" />
              <Label htmlFor="weekday" className="typography-body-medium">
                Regular working day
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ngày nghỉ" id="weekend" />
              <Label htmlFor="weekend" className="typography-body-medium">
                Rest day
              </Label>
            </div>
          </RadioGroup>
        </div>

        {dayType && (
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="typography-body-small text-muted-foreground">
              {getDayTypeDescription(dayType)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback for edge cases
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="typography-body-medium">Day type</Label>
        <span className="typography-body-medium font-medium text-muted-foreground">
          Unknown
        </span>
      </div>
    </div>
  );
}