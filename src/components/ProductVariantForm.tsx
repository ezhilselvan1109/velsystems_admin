import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { ProductVariantFormData, ProductVariant, ProductOption } from '../types/product';

const variantSchema = yup.object({
  sku: yup
    .string()
    .required('SKU is required')
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU must be less than 50 characters'),
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be positive')
    .max(999999, 'Price is too large'),
  options: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required('Option is required'),
        optionValueId: yup.string().required('Option value is required'),
      })
    )
    .min(0),
  images: yup
    .array()
    .of(
      yup.object({
        imageUrl: yup.string().required('Image URL is required').url('Must be a valid URL'),
        isPrimary: yup.boolean().required(),
        sortOrder: yup.number().min(0, 'Sort order must be 0 or greater'),
      })
    )
    .min(0),
});

interface ProductVariantFormProps {
  variant?: ProductVariant;
  productOptions: ProductOption[];
  onSubmit: (data: ProductVariantFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductVariantForm: React.FC<ProductVariantFormProps> = ({
  variant,
  productOptions,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    control,
  } = useForm<ProductVariantFormData>({
    resolver: yupResolver(variantSchema),
    defaultValues: {
      sku: '',
      price: 0,
      options: [],
      images: [],
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
    update: updateImage,
  } = useFieldArray({
    control,
    name: 'images',
  });

  const watchImages = watch('images');

  // Update image previews
  useEffect(() => {
    const previews = watchImages?.map(img => img.imageUrl || '') || [];
    setImagePreview(previews);
  }, [watchImages]);

  useEffect(() => {
    if (variant) {
      reset({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        options: productOptions.map(option => {
          const variantOption = variant.options.find(vo => vo.optionId === option.id);
          return {
            id: option.id,
            optionValueId: variantOption?.optionValue || '',
          };
        }),
        images: variant.images || [],
      });
    }
  }, [variant, reset, productOptions]);

  const handleFormSubmit = (data: ProductVariantFormData) => {
    onSubmit(data);
  };

  const addImage = useCallback(() => {
    appendImage({
      imageUrl: '',
      isPrimary: imageFields.length === 0,
      sortOrder: imageFields.length,
    });
  }, [appendImage, imageFields.length]);

  const removeImageAtIndex = useCallback((index: number) => {
    removeImage(index);
  }, [removeImage]);

  const setPrimaryImage = useCallback((index: number) => {
    const currentImages = watch('images');
    const updatedImages = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue('images', updatedImages);
  }, [watch, setValue]);

  const updateImageUrl = useCallback((index: number, url: string) => {
    updateImage(index, {
      ...watch(`images.${index}`),
      imageUrl: url,
    });
  }, [updateImage, watch]);

  const generateSKU = useCallback(() => {
    const options = watch('options');
    const selectedValues = options
      .filter(opt => opt.optionValueId)
      .map(opt => {
        const option = productOptions.find(po => po.id === opt.id);
        const value = option?.values.find(v => v.id === opt.optionValueId);
        return value?.value?.substring(0, 3).toUpperCase();
      })
      .join('-');
    
    const timestamp = Date.now().toString().slice(-4);
    const generatedSKU = selectedValues ? `${selectedValues}-${timestamp}` : `VAR-${timestamp}`;
    setValue('sku', generatedSKU);
  }, [watch, setValue, productOptions]);
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
          </label>
          <div className="flex gap-2">
            <input
              {...register('sku')}
              type="text"
              placeholder="PROD-001-RED-L"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={generateSKU}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
              title="Generate SKU"
            >
              Generate
            </button>
          </div>
          {errors.sku && (
            <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              {...register('price')}
              type="number"
              step="0.01"
              min="0"
              placeholder="999.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Option Values */}
      {productOptions.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Option Values</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {productOptions.map((option, optionIndex) => (
              <div key={option.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {option.name}
                </label>
                <div className="block sm:hidden">
                  <select
                    {...register(`options.${optionIndex}.optionValueId`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    <option value="">Select {option.name}</option>
                    {option.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <select
                    {...register(`options.${optionIndex}.optionValueId`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select {option.name}</option>
                    {option.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.value}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="hidden"
                  {...register(`options.${optionIndex}.id`)}
                  value={option.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Images</h3>
          <button
            type="button"
            onClick={addImage}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center shadow-sm"
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            Add Image
          </button>
        </div>

        <div className="space-y-4">
          {imageFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-0">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={watch(`images.${index}.isPrimary`)}
                    onChange={() => setPrimaryImage(index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Primary Image
                  </label>
                  {watch(`images.${index}.isPrimary`) && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImageAtIndex(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    {...register(`images.${index}.imageUrl`)}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                  />
                  {errors.images?.[index]?.imageUrl && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.images[index]?.imageUrl?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    {...register(`images.${index}.sortOrder`)}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview[index] && (
                <div className="mt-3 flex justify-center sm:justify-start">
                  <div className="relative">
                    <img
                      src={imagePreview[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {watch(`images.${index}.isPrimary`) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {imageFields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-500 mb-2">No images added yet</p>
              <button
                type="button"
                onClick={addImage}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Add your first image
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
        </button>
      </div>
    </form>
  );
};

export default ProductVariantForm;