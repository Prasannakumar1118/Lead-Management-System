import React from 'react';
import { Modal } from '../ui/Modal';
import { LeadForm } from '../forms/LeadForm';
import { Lead } from '../../types';
import { LeadFormData } from '../../schemas/leadSchema';

export interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  initialData?: Lead | null;
  isLoading?: boolean;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const isEditing = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Lead Details' : 'Create New Lead'}
      description={
        isEditing
          ? 'Update contact details, qualification stage, or follow-up notes.'
          : 'Add a new sales lead to your pipeline.'
      }
      maxWidth="lg"
    >
      <LeadForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
};
