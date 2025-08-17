import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, X, Star } from 'lucide-react';
import { ProductFormData, Product, ProductImage, ProductSpecificationGroup } from '../types/product';
import { brandService } from '../services/brand';
import { productTypeService } from '../services/productType';
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
  brandId: yup.string().required('Brand is required'),
  productTypeId: yup.string().required('Product type is required'),
  price: yup
    .number()
    .required('Price is required')
    .min(0, 'Price must be 0 or greater'),
  stock: yup
    .number()
    .required('Stock is required')
    .min(0, 'Stock must be 0 or greater'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  imageUrls: yup
    .array()
    .of(
      yup.object({
        imageUrl: yup.string().required('Image URL is required').url('Must be a valid URL'),
        isPrimary: yup.boolean().required(),
      })
    )
    .min(1, 'At least one image is required'),
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
    .min(1, 'At least one specification group is required'),
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
      brandId: '',
      productTypeId: '',
      price: 0,
      stock: 0,
      description: '',
      imageUrls: [{ imageUrl: '', isPrimary: true }],
      specificationGroups: [
        {
          name: '',
          specifications: [{ attributeName: '', attributeValue: '' }],
        },
      ],
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: 'imageUrls',
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
  const watchImageUrls = watch('imageUrls');

  // Fetch brands and product types
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getBrands,
  });

  const { data: productTypes, isLoading: productTypesLoading } = useQuery({
    queryKey: ['product-types'],
    queryFn: productTypeService.getProductTypes,
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

  // Update image previews
  useEffect(() => {
    const previews = watchImageUrls?.map(img => img.imageUrl || '') || [];
    setImagePreviews(previews);
  }, [watchImageUrls]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        brandId: product.brand.id,
        productTypeId: product.productType.id,
        price: product.price,
        stock: product.stock,
        description: product.description,
        imageUrls: product.image.length > 0 ? product.image : [{ imageUrl: '', isPrimary: true }],
        specificationGroups: product.specificationGroup.length > 0 
          ? product.specificationGroup 
          : [{ name: '', specifications: [{ attributeName: '', attributeValue: '' }] }],
      });
    }
  }, [product, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    // Ensure at least one image is marked as primary
    const hasPrimary = data.imageUrls.some(img => img.isPrimary);
    if (!hasProperty && data.imageUrls.length > 0) {
      data.imageUrls[0].isPrimary = true;
    }
    onSubmit(data);
  };

  const handleSetPrimaryImage = useCallback((index: number) => {
    const currentImages = watch('imageUrls');
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue('imageUrls', updatedImages);
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

  const productTypeOptions = productTypes?.map(type => ({
    value: type.id,
    label: type.name,
  })) || [];

  if (brandsLoading || productTypesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
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

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type *
            </label>
            <div className="block sm:hidden">
              <select
                {...register('productTypeId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select a product type</option>
                {productTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <CustomSelect
                options={[{ value: '', label: 'Select a product type' }, ...productTypeOptions]}
                value={watch('productTypeId')}
                onChange={(value) => setValue('productTypeId', value)}
                placeholder="Select a product type"
              />
            </div>
            {errors.productTypeId && (
              <p className="mt-1 text-sm text-red-600">{errors.productTypeId.message}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                {...register('price')}
                type="number"
                step="0.01"
                min="0"
                placeholder="999.99"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock *
            </label>
            <input
              {...register('stock')}
              type="number"
              min="0"
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
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

      {/* Images */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
          <button
            type="button"
            onClick={() => appendImage({ imageUrl: '', isPrimary: false })}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Image
          </button>
        </div>

        <div className="space-y-4">
          {imageFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    {...register(`imageUrls.${index}.imageUrl`)}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  {errors.imageUrls?.[index]?.imageUrl && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.imageUrls[index]?.imageUrl?.message}
                    </p>
                  )}
                </div>

                {/* Image Preview */}
                {imagePreviews[index] && (
                  <div className="relative">
                    <img
                      src={imagePreviews[index]}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {watch(`imageUrls.${index}.isPrimary`) && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(index)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      watch(`imageUrls.${index}.isPrimary`)
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Primary
                  </button>
                  {imageFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.imageUrls && (
          <p className="mt-2 text-sm text-red-600">{errors.imageUrls.message}</p>
        )}
      </div>

      {/* Specifications */}
      <div className="bg-gray-50 p-4 rounded-lg">
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
              {errors.specificationGroups?.[groupIndex]?.name && (
                <p className="mb-2 text-sm text-red-600">
                  {errors.specificationGroups[groupIndex]?.name?.message}
                </p>
              )}

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
        {errors.specificationGroups && (
          <p className="mt-2 text-sm text-red-600">{errors.specificationGroups.message}</p>
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
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;