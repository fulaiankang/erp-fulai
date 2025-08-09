import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload, X, ShirtIcon, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [variants, setVariants] = useState([])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm()

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42']
  const commonColors = ['黑色', '白色', '灰色', '海军蓝', '蓝色', '红色', '绿色', '黄色', '紫色', '粉色', '棕色', '米色']

  useEffect(() => {
    if (isEditing) {
      fetchProduct()
    }
  }, [id, isEditing])

  useEffect(() => {
    // 当颜色或尺码选择变化时，重新生成变体组合
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      generateVariants()
    } else {
      setVariants([])
    }
  }, [selectedColors, selectedSizes])

  const fetchProduct = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/api/products/${id}`)
      const product = response.data.product
      
      // Set form values
      setValue('serial_number', product.serial_number)
      setValue('price', product.price)
      setValue('composition', product.composition || '')
      
      // Set image preview
      if (product.image_url) {
        setImagePreview(`/api${product.image_url}`)
      }

      // Set variants and extract colors/sizes
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants)
        const colors = [...new Set(product.variants.map(v => v.color))]
        const sizes = [...new Set(product.variants.map(v => v.size))]
        setSelectedColors(colors)
        setSelectedSizes(sizes)
      }
    } catch (error) {
      toast.error('加载商品失败')
      navigate('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const generateVariants = () => {
    const newVariants = []
    selectedColors.forEach(color => {
      selectedSizes.forEach(size => {
        // 检查是否已存在该组合
        const existingVariant = variants.find(v => v.color === color && v.size === size)
        newVariants.push({
          color,
          size,
          quantity: existingVariant ? existingVariant.quantity : 0
        })
      })
    })
    setVariants(newVariants)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleColorChange = (color, checked) => {
    if (checked) {
      setSelectedColors([...selectedColors, color])
    } else {
      setSelectedColors(selectedColors.filter(c => c !== color))
    }
  }

  const handleSizeChange = (size, checked) => {
    if (checked) {
      setSelectedSizes([...selectedSizes, size])
    } else {
      setSelectedSizes(selectedSizes.filter(s => s !== size))
    }
  }

  const updateVariantQuantity = (color, size, quantity) => {
    setVariants(variants.map(variant => 
      variant.color === color && variant.size === size 
        ? { ...variant, quantity: parseInt(quantity) || 0 }
        : variant
    ))
  }

  const onSubmit = async (data) => {
    if (variants.length === 0) {
      toast.error('请至少选择一个颜色和尺码组合')
      return
    }

    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('serial_number', data.serial_number)
      formData.append('price', data.price)
      formData.append('composition', data.composition || '')
      formData.append('variants', JSON.stringify(variants))
      
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      if (isEditing) {
        await axios.put(`/api/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('商品更新成功！')
      } else {
        await axios.post('/api/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('商品创建成功！')
      }
      
      navigate('/products')
    } catch (error) {
      const message = error.response?.data?.error || '操作失败'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? '编辑商品' : '新增商品'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? '更新商品信息' : '添加新的服装商品，支持多颜色多尺码'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
          
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品图片
            </label>
            
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">上传商品图片</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="btn-secondary cursor-pointer"
                >
                  选择文件
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品货号 *
              </label>
              <input
                type="text"
                {...register('serial_number', { required: '商品货号为必填项' })}
                className="input-field"
                placeholder="请输入商品货号"
              />
              {errors.serial_number && (
                <p className="text-red-500 text-sm mt-1">{errors.serial_number.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格 (¥) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { 
                  required: '价格为必填项',
                  min: { value: 0, message: '价格必须大于等于0' }
                })}
                className="input-field"
                placeholder="请输入价格"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            {/* Composition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面料成分
              </label>
              <input
                type="text"
                {...register('composition')}
                className="input-field"
                placeholder="例如：100%棉"
              />
            </div>
          </div>
        </div>

        {/* Colors Selection Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">选择颜色</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {commonColors.map(color => (
              <label key={color} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={(e) => handleColorChange(color, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{color}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sizes Selection Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">选择尺码</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {commonSizes.map(size => (
              <label key={size} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={(e) => handleSizeChange(size, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Variants Card */}
        {variants.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              设置每个变体的库存数量 ({variants.length}个变体)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">颜色</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">尺码</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">库存数量</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={`${variant.color}-${variant.size}`} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{variant.color}</td>
                      <td className="py-3 px-4 text-gray-900">{variant.size}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={variant.quantity}
                          onChange={(e) => updateVariantQuantity(variant.color, variant.size, e.target.value)}
                          className="input-field w-24"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>总库存：</strong> {variants.reduce((sum, v) => sum + (v.quantity || 0), 0)} 件
              </p>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn-secondary"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading || variants.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{isEditing ? '更新商品' : '保存商品'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
