import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Package, Star, DollarSign, Archive } from 'lucide-react';
import { productService } from '../services/product';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProduct(id!),
    enabled: !!id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getPrimaryImage = () => {
    if (!product?.image.length) return null;
    const primary = product.image.find(img => img.isPrimary);
    return primary || product.image[0];
  };

  const getSecondaryImages = () => {
    if (!product?.image.length) return [];
    return product.image.filter(img => !img.isPrimary);
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

  const stockStatus = getStockStatus(product.stock);
  const primaryImage = getPrimaryImage();
  const secondaryImages = getSecondaryImages();

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 font-mono text-sm">{product.slug}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/products/${product.id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Product
        </button>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {/* Primary Image */}
          {primaryImage ? (
            <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square">
              <img
                src={primaryImage.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {primaryImage.isPrimary && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white rounded-full p-2">
                  <Star className="w-4 h-4 fill-current" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Secondary Images */}
          {secondaryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {secondaryImages.map((image, index) => (
                <div key={image.id || index} className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Brand</span>
                <span className="font-medium text-gray-900">{product.brand.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Product Type</span>
                <span className="font-medium text-gray-900">{product.productType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-xl text-gray-900">{formatPrice(product.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stock</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{product.stock}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Price</p>
              <p className="text-lg font-bold text-blue-900">{formatPrice(product.price)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Archive className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Stock</p>
              <p className="text-lg font-bold text-green-900">{product.stock}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Images</p>
              <p className="text-lg font-bold text-purple-900">{product.image.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specificationGroup.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Specifications</h2>
          <div className="space-y-6">
            {product.specificationGroup.map((group, groupIndex) => (
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

      {/* Image Gallery */}
      {product.image.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Image Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.image.map((image, index) => (
              <div key={image.id || index} className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={image.imageUrl}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;