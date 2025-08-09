import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getImageUrl, handleImageError } from '../utils/imageUtils'
import { 
  Package, 
  ShirtIcon, 
  DollarSign, 
  Palette, 
  Ruler,
  Plus,
  TrendingUp
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    uniqueColors: 0,
    uniqueSizes: 0
  })
  const [recentItems, setRecentItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsResponse, itemsResponse] = await Promise.all([
        axios.get('/api/products/stats/summary'),
        axios.get('/api/products?limit=5')
      ])
      
      setStats({
        totalItems: statsResponse.data.totalProducts,
        totalQuantity: statsResponse.data.totalQuantity,
        totalValue: statsResponse.data.totalValue,
        uniqueColors: statsResponse.data.uniqueColors,
        uniqueSizes: statsResponse.data.uniqueSizes
      })
      setRecentItems(itemsResponse.data.items)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: '商品总数',
      value: stats.totalItems,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: '库存总量',
      value: stats.totalQuantity,
      icon: ShirtIcon,
      color: 'bg-green-500'
    },
    {
      title: '总价值',
      value: `¥${stats.totalValue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      title: '颜色种类',
      value: stats.uniqueColors,
      icon: Palette,
      color: 'bg-purple-500'
    },
    {
      title: '尺码种类',
      value: stats.uniqueSizes,
      icon: Ruler,
      color: 'bg-pink-500'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600 mt-1">服装库存概览</p>
        </div>
        <Link
          to="/products/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>新增商品</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Items */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">最近商品</h2>
          <Link 
            to="/products" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>查看全部</span>
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无库存商品</p>
            <p className="text-gray-400 text-sm">添加您的第一件服装商品开始使用</p>
            <Link
              to="/products/new"
              className="btn-primary mt-4 inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>添加第一个商品</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">图片</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">货号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">颜色</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">尺码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">数量</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">价格</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.serial_number}
                          className="h-10 w-10 rounded-lg object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShirtIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{item.serial_number}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.variants.slice(0, 2).map((variant, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {variant.color}
                            </span>
                          ))}
                          {item.variants.length > 2 && <span className="text-xs text-gray-500">+{item.variants.length - 2}</span>}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.variants.slice(0, 2).map((variant, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {variant.size}
                            </span>
                          ))}
                          {item.variants.length > 2 && <span className="text-xs text-gray-500">+{item.variants.length - 2}</span>}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.total_quantity || 0}</td>
                    <td className="py-3 px-4 text-gray-600">¥{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
