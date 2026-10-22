import { z } from 'zod';

export const leadFormSchema = z
  .object({
    name: z.string().min(1, 'Lead name is required').max(255),
    email: z
      .string()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),
    phone_number: z
      .string()
      .max(50, 'Phone number is too long')
      .optional()
      .or(z.literal('')),
    company: z.string().max(255).optional().or(z.literal('')),
    service_interested: z.string().max(255).optional().or(z.literal('')),
    source: z.string().max(100).optional().or(z.literal('')),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Converted', 'Lost']),
    follow_up_date: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasEmail = !!data.email && data.email.trim() !== '';
      const hasPhone = !!data.phone_number && data.phone_number.trim() !== '';
      return hasEmail || hasPhone;
    },
    {
      message: 'At least one contact method (Email or Phone Number) must be provided.',
      path: ['email'],
    }
  );

export type LeadFormData = z.infer<typeof leadFormSchema>;
