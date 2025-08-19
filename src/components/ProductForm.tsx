import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { ProductFormData, Product } from '../types/product';
import { brandService } from '../services/brand';
import { categoryService } from '../services/category';
import CustomSelect from './CustomSelect';
import LoadingSpinner from './LoadingSpinner';

const productSchema = yup.object({
  name: yup
    .string()
    .required('Product name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters'),
  slug: yup
    .string()
    .required('Slug is required')
    .min(2, 'Slug must be at least 2 characters')
    .max(200, 'Slug must be less than 200 characters')
    .matches(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  brandId: yup.string().required('Brand is required'),
  categoryId: yup.string().required('Category is required'),
  options: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Option name is required'),
        values: yup
          .array()
          .of(
            yup.object({
              value: yup.string().required('Option value is required'),
            })
          )
          .min(1, 'At least one option value is required'),
      })
    )
    .min(0),
  specificationGroups: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Group name is required'),
        specifications: yup
          .array()
          .of(
            yup.object({
              attributeName: yup.string().required('Attribute name is required'),
              attributeValue: yup.string().required('Attribute value is required'),
            })
          )
          .min(1, 'At least one specification is required'),
      })
    )
    .min(0),
});

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
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
    control,
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      brandId: '',
      categoryId: '',
      options: [],
      specificationGroups: [
        {
          name: '',
          specifications: [{ attributeName: '', attributeValue: '' }],
        },
      ],
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: 'options',
  });

  const {
    fields: specGroupFields,
    append: appendSpecGroup,
    remove: removeSpecGroup,
  } = useFieldArray({
    control,
    name: 'specificationGroups',
  });

  const watchName = watch('name');

  // Fetch brands and categories
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getBrands,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: categoryService.getAllCategories,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (watchName && !product) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [watchName, setValue, product]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        brandId: product.brand.id,
        categoryId: product.category.id,
        options: product.options.length > 0 ? product.options : [],
        specificationGroups: product.specificationGroups.length > 0 
          ? product.specificationGroups 
          : [{ name: '', specifications: [{ attributeName: '', attributeValue: '' }] }],
      });
    }
  }, [product, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit(data);
  };

  const addOptionValue = useCallback((optionIndex: number) => {
    const currentOptions = watch('options');
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex].values.push({ value: '' });
    setValue('options', updatedOptions);
  }, [watch, setValue]);

  const removeOptionValue = useCallback((optionIndex: number, valueIndex: number) => {
    const currentOptions = watch('options');
    const updatedOptions = [...currentOptions];
    if (updatedOptions[optionIndex].values.length > 1) {
      updatedOptions[optionIndex].values.splice(valueIndex, 1);
      setValue('options', updatedOptions);
    }
  }, [watch, setValue]);

  const addSpecification = useCallback((groupIndex: number) => {
    const currentGroups = watch('specificationGroups');
    const updatedGroups = [...currentGroups];
    updatedGroups[groupIndex].specifications.push({
      attributeName: '',
      attributeValue: '',
    });
    setValue('specificationGroups', updatedGroups);
  }, [watch, setValue]);

  const removeSpecification = useCallback((groupIndex: number, specIndex: number) => {
    const currentGroups = watch('specificationGroups');
    const updatedGroups = [...currentGroups];
    if (updatedGroups[groupIndex].specifications.length > 1) {
      updatedGroups[groupIndex].specifications.splice(specIndex, 1);
      setValue('specificationGroups', updatedGroups);
    }
  }, [watch, setValue]);

  const brandOptions = brands?.filter(brand => brand.status === 1).map(brand => ({
    value: brand.id,
    label: brand.name,
  })) || [];

  const categoryOptions = categories?.map(category => ({
    value: category.id,
    label: category.name,
  })) || [];

  if (brandsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="p-2 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="iPhone 15 Pro"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              {...register('slug')}
              type="text"
              placeholder="iphone-15-pro"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <div className="block sm:hidden">
              <select
                {...register('brandId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select a brand</option>
                {brandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <CustomSelect
                options={[{ value: '', label: 'Select a brand' }, ...brandOptions]}
                value={watch('brandId')}
                onChange={(value) => setValue('brandId', value)}
                placeholder="Select a brand"
              />
            </div>
            {errors.brandId && (
              <p className="mt-1 text-sm text-red-600">{errors.brandId.message}</p>
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
                options={[{ value: '', label: 'Select a category' }, ...categoryOptions]}
                value={watch('categoryId')}
                onChange={(value) => setValue('categoryId', value)}
                placeholder="Select a category"
              />
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Product description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Product Options */}
      <div className="p-2 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Product Options</h3>
          <button
            type="button"
            onClick={() => appendOption({ name: '', values: [{ value: '' }] })}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </button>
        </div>

        <div className="space-y-4">
          {optionFields.map((field, optionIndex) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <input
                  {...register(`options.${optionIndex}.name`)}
                  type="text"
                  placeholder="Option name (e.g., Color, Size)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors mr-4"
                />
                <button
                  type="button"
                  onClick={() => removeOption(optionIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Option Values</label>
                {watch(`options.${optionIndex}.values`)?.map((_, valueIndex) => (
                  <div key={valueIndex} className="flex items-center gap-2">
                    <input
                      {...register(`options.${optionIndex}.values.${valueIndex}.value`)}
                      type="text"
                      placeholder="Option value (e.g., Red, Large)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionValue(optionIndex, valueIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      disabled={watch(`options.${optionIndex}.values`)?.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOptionValue(optionIndex)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Value
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specifications */}
      <div className="p-2 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Specifications</h3>
          <button
            type="button"
            onClick={() =>
              appendSpecGroup({
                name: '',
                specifications: [{ attributeName: '', attributeValue: '' }],
              })
            }
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Group
          </button>
        </div>

        <div className="space-y-6">
          {specGroupFields.map((groupField, groupIndex) => (
            <div key={groupField.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <input
                  {...register(`specificationGroups.${groupIndex}.name`)}
                  type="text"
                  placeholder="Group name (e.g., Display, Performance)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors mr-4"
                />
                {specGroupFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecGroup(groupIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {watch(`specificationGroups.${groupIndex}.specifications`)?.map((_, specIndex) => (
                  <div key={specIndex} className="flex items-center gap-3">
                    <input
                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.attributeName`)}
                      type="text"
                      placeholder="Attribute name (e.g., Screen Size)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <input
                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.attributeValue`)}
                      type="text"
                      placeholder="Attribute value (e.g., 6.1 inches)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecification(groupIndex, specIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      disabled={watch(`specificationGroups.${groupIndex}.specifications`)?.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSpecification(groupIndex)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specification
                </button>
              </div>
            </div>
          ))}
        </div>
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
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;