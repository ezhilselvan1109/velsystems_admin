import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CouponFormData, Coupon } from '../types/coupon';

const couponSchema = yup.object({
  code: yup
    .string()
    .required('Coupon code is required')
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .matches(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters'),
  type: yup.string().required('Discount type is required').oneOf(['0', '1']),
  value: yup
    .number()
    .required('Discount value is required')
    .positive('Value must be positive')
    .max(100000, 'Value is too large'),
  active: yup.boolean().required(),
  startsAt: yup
    .string()
    .required('Start date is required')
    .test('future-date', 'Start date must be in the future', function (value) {
      if (!value) return false;
      const startDate = new Date(value);
      const now = new Date();
      return startDate > now;
    }),
  endsAt: yup
    .string()
    .required('End date is required')
    .test('after-start', 'End date must be after start date', function (value) {
      const { startsAt } = this.parent;
      if (!value || !startsAt) return false;
      return new Date(value) > new Date(startsAt);
    }),
  maxUses: yup
    .number()
    .required('Maximum uses is required')
    .min(1, 'Maximum uses must be at least 1')
    .max(100000, 'Maximum uses is too large'),
});

interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: CouponFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CouponForm: React.FC<CouponFormProps> = ({
  coupon,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CouponFormData>({
    resolver: yupResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      type: '0',
      value: 0,
      active: true,
      startsAt: '',
      endsAt: '',
      maxUses: 1,
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        description: coupon.description,
        type: coupon.type.toString() as '0' | '1',
        value: coupon.value,
        active: coupon.active,
        startsAt: new Date(coupon.startsAt).toISOString().slice(0, 16),
        endsAt: new Date(coupon.endsAt).toISOString().slice(0, 16),
        maxUses: coupon.maxUses,
      });
    }
  }, [coupon, reset]);

  const handleFormSubmit = (data: CouponFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coupon Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Code *
          </label>
          <input
            {...register('code')}
            type="text"
            placeholder="SAVE20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Type *
          </label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="0">Percentage (%)</option>
            <option value="1">Fixed Amount ($)</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Describe what this coupon offers..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discount Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Value *
          </label>
          <div className="relative">
            <input
              {...register('value')}
              type="number"
              step="0.01"
              min="0"
              placeholder={watchType === '0' ? '20' : '10.00'}
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm">
                {watchType === '0' ? '%' : '$'}
              </span>
            </div>
          </div>
          {errors.value && (
            <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
          )}
        </div>

        {/* Maximum Uses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Uses *
          </label>
          <input
            {...register('maxUses')}
            type="number"
            min="1"
            placeholder="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.maxUses && (
            <p className="mt-1 text-sm text-red-600">{errors.maxUses.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            {...register('startsAt')}
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.startsAt && (
            <p className="mt-1 text-sm text-red-600">{errors.startsAt.message}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            {...register('endsAt')}
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.endsAt && (
            <p className="mt-1 text-sm text-red-600">{errors.endsAt.message}</p>
          )}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          {...register('active')}
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Active (coupon can be used)
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
};

export default CouponForm;