import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, LeadFormData } from '../../schemas/leadSchema';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, LeadStatus } from '../../types';

export interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  initialData?: Lead | null;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Converted', label: 'Converted' },
  { value: 'Lost', label: 'Lost' },
];

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      company: '',
      service_interested: '',
      status: 'New',
      follow_up_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      let formattedFollowUp = '';
      if (initialData.follow_up_date) {
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        try {
          const d = new Date(initialData.follow_up_date);
          formattedFollowUp = d.toISOString().slice(0, 16);
        } catch {
          formattedFollowUp = '';
        }
      }

      reset({
        name: initialData.name,
        email: initialData.email || '',
        phone_number: initialData.phone_number || '',
        company: initialData.company || '',
        service_interested: initialData.service_interested || '',
        status: initialData.status,
        follow_up_date: formattedFollowUp,
        notes: initialData.notes || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone_number: '',
        company: '',
        service_interested: '',
        status: 'New',
        follow_up_date: '',
        notes: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: LeadFormData) => {
    // If follow_up_date is provided, convert to ISO
    const payload = {
      ...data,
      follow_up_date: data.follow_up_date ? new Date(data.follow_up_date).toISOString() : undefined,
    };
    await onSubmit(payload as any);
  };

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
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Notice on contact requirements */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 leading-relaxed">
          <strong>Contact Policy:</strong> Please provide at least one contact method (email address or phone number).
        </div>

        {/* Lead Name */}
        <Input
          label="Lead Name"
          required
          placeholder="e.g. Marcus Vance"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="marcus@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1-555-019-2831"
            error={errors.phone_number?.message}
            {...register('phone_number')}
          />
        </div>

        {/* Company & Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company"
            placeholder="e.g. Apex Logistics"
            error={errors.company?.message}
            {...register('company')}
          />
          <Input
            label="Service Interested"
            placeholder="e.g. Full-Stack Web Platform"
            error={errors.service_interested?.message}
            {...register('service_interested')}
          />
        </div>

        {/* Status & Follow-up Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            required
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Follow-up Date & Time
            </label>
            <input
              type="datetime-local"
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              {...register('follow_up_date')}
            />
            {errors.follow_up_date?.message && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.follow_up_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            placeholder="Add relevant business context, requirements, budget, or call summary..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder:text-slate-400"
            {...register('notes')}
          />
          {errors.notes?.message && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.notes.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
