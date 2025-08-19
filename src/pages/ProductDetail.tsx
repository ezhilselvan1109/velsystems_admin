import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Package, ChevronLeft, ChevronRight, ZoomIn, X, Plus, Trash2, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService } from '../services/product';
import { ProductVariant, ProductVariantFormData } from '../types/product';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductVariantForm from '../components/ProductVariantForm';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [isDeleteVariantDialogOpen, setIsDeleteVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProduct(id!),
    enabled: !!id,
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (data: ProductVariantFormData) =>
      productService.createProductVariant(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      setIsVariantModalOpen(false);
      toast.success('Variant created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create variant');
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: (data: ProductVariantFormData) =>
      productService.updateProductVariant(selectedVariant!.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      setIsEditVariantModalOpen(false);
      setSelectedVariant(null);
      toast.success('Variant updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update variant');
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      productService.deleteProductVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      setIsDeleteVariantDialogOpen(false);
      setSelectedVariant(null);
      toast.success('Variant deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete variant');
    },
  });

  // Handlers
  const handleCreateVariant = (data: ProductVariantFormData) => {
    createVariantMutation.mutate(data);
  };

  const handleUpdateVariant = (data: ProductVariantFormData) => {
    updateVariantMutation.mutate(data);
  };

  const handleDeleteVariant = () => {
    if (selectedVariant?.id) {
      deleteVariantMutation.mutate(selectedVariant.id);
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsEditVariantModalOpen(true);
  };

  const handleDeleteVariantClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsDeleteVariantDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '1': return 'bg-green-100 text-green-800';
      case '0': return 'bg-gray-100 text-gray-800';
      case '2': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '1': return 'Active';
      case '0': return 'Inactive';
      case '2': return 'Draft';
      default: return 'Unknown';
    }
  };

  // Get all images from all variants
  const getAllImages = () => {
    if (!product?.variants.length) return [];
    
    const allImages: any[] = [];
    product.variants.forEach(variant => {
      if (variant.images?.length) {
        variant.images.forEach(image => {
          if (!allImages.find(img => img.imageUrl === image.imageUrl)) {
            allImages.push(image);
          }
        });
      }
    });
    
    // Sort by isPrimary and sortOrder
    return allImages.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  };

  const allImages = getAllImages();
  const currentImage = allImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const getLowestPrice = () => {
    if (!product?.variants.length) return 0;
    return Math.min(...product.variants.map(v => v.price || 0));
  };

  const getHighestPrice = () => {
    if (!product?.variants.length) return 0;
    return Math.max(...product.variants.map(v => v.price || 0));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load product</p>
          <button
            onClick={() => navigate('/products')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const lowestPrice = getLowestPrice();
  const highestPrice = getHighestPrice();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600 font-mono">{product.slug}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/products/${product.id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Product
        </button>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          {currentImage ? (
            <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square">
              <img
                src={currentImage.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setIsZoomOpen(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              
              {/* Navigation arrows for multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Zoom icon */}
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Image counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Thumbnail Images */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square bg-gray-50 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Brand</span>
                <span className="font-medium text-gray-900">
                  {product.brand?.name}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium text-gray-900">
                  {product.category?.name}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price Range</span>
                <div className="text-right">
                  {lowestPrice === highestPrice ? (
                    <span className="font-bold text-xl text-gray-900">{formatPrice(lowestPrice)}</span>
                  ) : (
                    <span className="font-bold text-xl text-gray-900">
                      {formatPrice(lowestPrice)} - {formatPrice(highestPrice)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Variants</span>
                <span className="font-medium text-gray-900">{product.variants.length}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Variants</p>
              <p className="text-lg font-bold text-blue-900">{product.variants.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Options</p>
              <p className="text-lg font-bold text-green-900">{product.options.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center col-span-2 sm:col-span-1">
              <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Images</p>
              <p className="text-lg font-bold text-purple-900">{allImages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Variants */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Product Variants ({product.variants.length})</h2>
          <button
            onClick={() => setIsVariantModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </button>
        </div>

        {product.variants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.variants.map((variant, index) => (
              <div key={variant.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm block truncate">{variant.sku}</span>
                    <span className="font-bold text-blue-600 text-lg">{formatPrice(variant.price)}</span>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEditVariant(variant)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit variant"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVariantClick(variant)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Variant Options */}
                {variant.options.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {variant.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex justify-between text-sm">
                        <span className="text-gray-600">{option.optionName}:</span>
                        <span className="text-gray-900">{option.optionValue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variant Images */}
                {variant.images && variant.images.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {variant.images.slice(0, 3).map((image, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={image.imageUrl}
                        alt={`${variant.sku} ${imgIndex + 1}`}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ))}
                    {variant.images.length > 3 && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                        +{variant.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* No Images State */}
                {(!variant.images || variant.images.length === 0) && (
                  <div className="flex items-center justify-center h-12 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                    <Package className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-xs text-gray-500">No images</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No variants created yet</p>
            <button
              onClick={() => setIsVariantModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first variant
            </button>
          </div>
        )}
      </div>

      {/* Product Options */}
      {product.options.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {product.options.map((option, index) => (
              <div key={option.id || index}>
                <h3 className="text-md font-medium text-gray-900 mb-3">{option.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value, valueIndex) => (
                    <span
                      key={value.id || valueIndex}
                      className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full"
                    >
                      {value.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specifications */}
      {product.specificationGroups.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Specifications</h2>
          <div className="space-y-6">
            {product.specificationGroups.map((group, groupIndex) => (
              <div key={group.id || groupIndex}>
                <h3 className="text-md font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  {group.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.specifications.map((spec, specIndex) => (
                    <div key={spec.id || specIndex} className="flex justify-between items-center py-2">
                      <span className="text-gray-600">{spec.attributeName}</span>
                      <span className="font-medium text-gray-900">{spec.attributeValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isZoomOpen && currentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            <img
              src={currentImage.imageUrl}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation in zoom mode */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Create Product Variant"
        size="lg"
      >
        <ProductVariantForm
          productOptions={product.options}
          onSubmit={handleCreateVariant}
          onCancel={() => setIsVariantModalOpen(false)}
          isLoading={createVariantMutation.isPending}
        />
      </Modal>

      {/* Edit Variant Modal */}
      <Modal
        isOpen={isEditVariantModalOpen}
        onClose={() => {
          setIsEditVariantModalOpen(false);
          setSelectedVariant(null);
        }}
        title="Edit Product Variant"
        size="lg"
      >
        <ProductVariantForm
          variant={selectedVariant || undefined}
          productOptions={product.options}
          onSubmit={handleUpdateVariant}
          onCancel={() => {
            setIsEditVariantModalOpen(false);
            setSelectedVariant(null);
          }}
          isLoading={updateVariantMutation.isPending}
        />
      </Modal>

      {/* Delete Variant Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteVariantDialogOpen}
        onClose={() => {
          setIsDeleteVariantDialogOpen(false);
          setSelectedVariant(null);
        }}
        onConfirm={handleDeleteVariant}
        title="Delete Variant"
        message={`Are you sure you want to delete the variant "${selectedVariant?.sku}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteVariantMutation.isPending}
      />
    </div>
  );
};

export default ProductDetail;