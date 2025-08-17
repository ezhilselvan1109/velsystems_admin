import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { BrandFormData, Brand } from '../types/brand';
import CustomSelect from './CustomSelect';

const brandSchema = yup.object({
  name: yup
    .string()
    .required('Brand name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters'),
  logoUrl: yup
    .string()
    .url('Please enter a valid URL'),
  status: yup.string().required('Status is required').oneOf(['0', '1']),
  sortOrder: yup
    .number()
    .required('Sort order is required')
    .min(0, 'Sort order must be 0 or greater')
    .max(9999, 'Sort order must be less than 10000'),
});

interface BrandFormProps {
  brand?: Brand;
  onSubmit: (data: BrandFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BrandForm: React.FC<BrandFormProps> = ({
  brand,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [logoPreview, setLogoPreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BrandFormData>({
    resolver: yupResolver(brandSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      status: '1',
      sortOrder: 0,
    },
  });

  const watchLogoUrl = watch('logoUrl');

  // Update logo preview
  useEffect(() => {
    setLogoPreview(watchLogoUrl || '');
  }, [watchLogoUrl]);

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        description: brand.description,
        logoUrl: brand.logoUrl || '',
        status: brand.status.toString() as '0' | '1',
        sortOrder: brand.sortOrder,
      });
      setLogoPreview(brand.logoUrl || '');
    }
  }, [brand, reset]);

  const handleFormSubmit = (data: BrandFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Name *
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Apple"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <div className="block sm:hidden">
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <CustomSelect
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' }
              ]}
              value={watch('status')}
              onChange={(value) => setValue('status', value as '0' | '1')}
              placeholder="Select status"
            />
          </div>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Brand description..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <div className="space-y-3">
          <input
            {...register('logoUrl')}
            type="url"
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.logoUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
          )}
          
          {/* Logo Preview */}
          {logoPreview && (
            <div className="relative inline-block">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-24 h-24 object-contain rounded-lg border border-gray-300 bg-gray-50 p-2"
                onError={() => setLogoPreview('')}
              />
              <button
                type="button"
                onClick={() => {
                  setValue('logoUrl', '');
                  setLogoPreview('');
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort Order *
        </label>
        <input
          {...register('sortOrder')}
          type="number"
          min="0"
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {errors.sortOrder && (
          <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
        )}
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
          {isLoading ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
        </button>
      </div>
    </form>
  );
};

export default BrandForm;