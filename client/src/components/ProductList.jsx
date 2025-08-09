import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getImageUrl, handleImageError } from '../utils/imageUtils'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ShirtIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react'

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [expandedProducts, setExpandedProducts] = useState(new Set())
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchProducts()
  }, [pagination.page, searchTerm, colorFilter, sizeFilter])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        color: colorFilter,
        size: sizeFilter
      })

      const response = await axios.get(`/api/products?${params}`)
      setProducts(response.data.items)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      toast.error('获取商品列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id, serialNumber) => {
    if (window.confirm(`确定要删除商品"${serialNumber}"吗？此操作将删除所有相关变体。`)) {
      try {
        await axios.delete(`/api/products/${id}`)
        toast.success('商品删除成功')
        fetchProducts()
      } catch (error) {
        toast.error('删除商品失败')
      }
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchProducts()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setColorFilter('')
    setSizeFilter('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const toggleExpanded = (productId) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  // Extract unique colors and sizes from all products
  const uniqueColors = [...new Set(
    products.flatMap(product => 
      product.variants ? product.variants.map(variant => variant.color) : []
    )
  )].sort()
  
  const uniqueSizes = [...new Set(
    products.flatMap(product => 
      product.variants ? product.variants.map(variant => variant.size) : []
    )
  )].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商品管理</h1>
          <p className="text-gray-600 mt-1">管理您的服装商品和变体</p>
        </div>
        <Link
          to="/products/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>新增商品</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="按货号或面料成分搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                颜色
              </label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="input-field min-w-32"
              >
                <option value="">所有颜色</option>
                {uniqueColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                尺码
              </label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="input-field min-w-24"
              >
                <option value="">所有尺码</option>
                {uniqueSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>筛选</span>
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary"
              >
                重置
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Products List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到商品</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || colorFilter || sizeFilter
                ? '尝试调整搜索条件'
                : '添加您的第一个商品开始使用'
              }
            </p>
            <Link to="/products/new" className="btn-primary">
              添加第一个商品
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">展开</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">图片</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">货号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">价格</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">变体</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">总库存</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">面料成分</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleExpanded(product.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedProducts.has(product.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {product.image_url ? (
                            <img
                              src={getImageUrl(product.image_url)}
                              alt={product.serial_number}
                              className="h-12 w-12 rounded-lg object-cover"
                              onError={handleImageError}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <ShirtIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{product.serial_number}</td>
                        <td className="py-3 px-4 text-gray-600">¥{product.price}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.variants && product.variants.slice(0, 3).map((variant, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                              >
                                {variant.color}-{variant.size}
                              </span>
                            ))}
                            {product.variants && product.variants.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{product.variants.length - 3}个
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {product.total_quantity || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-32 truncate">
                          {product.composition || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Link
                              to={`/products/edit/${product.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.serial_number)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Details */}
                      {expandedProducts.has(product.id) && product.variants && (
                        <tr>
                          <td colSpan="8" className="py-4 px-4 bg-gray-50">
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">变体明细</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {product.variants.map((variant, idx) => (
                                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {variant.color} - {variant.size}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          库存: <span className="font-medium">{variant.quantity}</span> 件
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-500">单价</div>
                                        <div className="font-medium text-gray-900">¥{product.price}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg">
                  <div className="p-4">
                    <div className="flex space-x-4">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.serial_number}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShirtIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{product.serial_number}</h3>
                          <button
                            onClick={() => toggleExpanded(product.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedProducts.has(product.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">价格: ¥{product.price}</p>
                        <p className="text-sm text-gray-600">
                          库存: {product.total_quantity || 0} 件 • 
                          {product.variants ? product.variants.length : 0} 个变体
                        </p>
                        {product.composition && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{product.composition}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.variants && product.variants.slice(0, 4).map((variant, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                            >
                              {variant.color}-{variant.size}
                            </span>
                          ))}
                          {product.variants && product.variants.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{product.variants.length - 4}个
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/products/edit/${product.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.serial_number)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Expanded Details */}
                  {expandedProducts.has(product.id) && product.variants && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">变体明细</h4>
                      <div className="space-y-2">
                        {product.variants.map((variant, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {variant.color} - {variant.size}
                                </div>
                                <div className="text-sm text-gray-600">
                                  库存: <span className="font-medium">{variant.quantity}</span> 件
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">单价</div>
                                <div className="font-medium text-gray-900">¥{product.price}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  显示第 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共{' '}
                  {pagination.total} 条记录
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    第 {pagination.page} 页，共 {pagination.totalPages} 页
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProductList
