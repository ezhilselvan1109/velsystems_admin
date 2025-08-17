import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { ProductTypeFormData, ProductType } from '../types/productType';
import { Category } from '../types/category';
import { categoryService } from '../services/category';
import CustomSelect from './CustomSelect';
import LoadingSpinner from './LoadingSpinner';

const productTypeSchema = yup.object({
  name: yup
    .string()
    .required('Product type name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  categoryId: yup
    .string()
    .required('Category is required'),
});

interface ProductTypeFormProps {
  productType?: ProductType;
  onSubmit: (data: ProductTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductTypeForm: React.FC<ProductTypeFormProps> = ({
  productType,
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
  } = useForm<ProductTypeFormData>({
    resolver: yupResolver(productTypeSchema),
    defaultValues: {
      name: '',
      categoryId: '',
    },
  });

  // Fetch categories for dropdown
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: categoryService.getAllCategories,
  });

  useEffect(() => {
    if (productType) {
      reset({
        name: productType.name,
        categoryId: productType.categoryId,
      });
    }
  }, [productType, reset]);

  const handleFormSubmit = (data: ProductTypeFormData) => {
    onSubmit(data);
  };

  const categoryOptions = categories?.map(category => ({
    value: category.id,
    label: category.name,
  })) || [];

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Product Type Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type Name *
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="Laptop"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <div className="block sm:hidden">
          <select
            {...register('categoryId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Select a category</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <CustomSelect
            options={[
              { value: '', label: 'Select a category' },
              ...categoryOptions
            ]}
            value={watch('categoryId')}
            onChange={(value) => setValue('categoryId', value)}
            placeholder="Select a category"
          />
        </div>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
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
          {isLoading ? 'Saving...' : productType ? 'Update Product Type' : 'Create Product Type'}
        </button>
      </div>
    </form>
  );
};

export default ProductTypeForm;