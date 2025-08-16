import React from 'react';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';

const Inventory: React.FC = () => {
  const inventoryItems = [
    { id: 1, name: 'Wireless Headphones', sku: 'WH-001', stock: 45, minStock: 10, status: 'In Stock' },
    { id: 2, name: 'Smart Watch', sku: 'SW-002', stock: 5, minStock: 10, status: 'Low Stock' },
    { id: 3, name: 'Coffee Mug', sku: 'CM-003', stock: 0, minStock: 5, status: 'Out of Stock' },
    { id: 4, name: 'Laptop Stand', sku: 'LS-004', stock: 23, minStock: 15, status: 'In Stock' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Low Stock':
        return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case 'Out of Stock':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-green-600" />;
    }
  };

  const lowStockItems = inventoryItems.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Monitor and manage your product inventory levels</p>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Inventory Alerts</h3>
          </div>
          <p className="text-sm text-yellow-700">
            {lowStockItems.length} item(s) need attention. Check stock levels below.
          </p>
        </div>
      )}

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{inventoryItems.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {inventoryItems.filter(item => item.status === 'Low Stock').length}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {inventoryItems.filter(item => item.status === 'Out of Stock').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Product</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">SKU</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Current Stock</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Min Stock</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className="ml-3 font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{item.sku}</td>
                  <td className="py-4 px-6">
                    <span className={`font-medium ${
                      item.stock === 0 ? 'text-red-600' : 
                      item.stock <= item.minStock ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{item.minStock}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;