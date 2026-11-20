import { memo, useState } from 'react';
import { FileSpreadsheet, Download, Loader2, ArrowUpFromLine } from 'lucide-react';
import { useExportAdvancePayments } from '@hr/hooks/api/useAdvancePayments';
import { Button } from '@hr/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogNavyHeader,
} from '@hr/components/ui/dialog';
import { AdvancePaymentResultUploadDialog } from './AdvancePaymentResultUploadDialog';

interface AdvancePaymentTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvancePaymentTransferDialog = memo(
  function AdvancePaymentTransferDialog({
    open,
    onOpenChange,
  }: AdvancePaymentTransferDialogProps) {
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const exportMutation = useExportAdvancePayments();

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md gap-0 overflow-hidden" contentPadding="none" hideCloseButton>
            <DialogNavyHeader
              title="Bulk salary advance transfers"
              description="Manage and track salary advance transfers"
            />

            {/* Actions */}
            <div className="px-5 py-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => exportMutation.mutate(undefined)}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />
                }
                Export bulk transfer
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Import transfer results
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AdvancePaymentResultUploadDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
      </>
    );
  },
);
