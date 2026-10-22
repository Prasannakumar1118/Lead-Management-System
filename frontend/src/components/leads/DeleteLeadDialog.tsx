import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Lead } from '../../types';
import { AlertTriangle } from 'lucide-react';

export interface DeleteLeadDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const DeleteLeadDialog: React.FC<DeleteLeadDialogProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!lead) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Lead" maxWidth="sm">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong className="text-slate-900">{lead.name}</strong>
            {lead.company ? ` from ${lead.company}` : ''}?
          </p>
          <p className="text-xs text-rose-600 mt-2 font-medium">
            This action is permanent and cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
};
