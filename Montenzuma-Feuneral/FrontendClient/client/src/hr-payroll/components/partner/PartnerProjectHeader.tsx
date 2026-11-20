import { Button } from "@hr/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PartnerProject } from "@hr/types/partnerProject";

interface PartnerProjectHeaderProps {
  project: PartnerProject;
  onBack: () => void;
}

export const PartnerProjectHeader = ({
  project,
  onBack
}: PartnerProjectHeaderProps) => {
  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div>
        <h1 className="typography-headline-medium sm:typography-headline-large md:typography-display-small text-foreground">
          {project.name}
        </h1>
        <p className="typography-body-small sm:typography-body-medium text-muted-foreground">
          Details dự án và Timesheet
        </p>
      </div>
    </div>
  );
};
