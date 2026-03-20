import { useForm, useFieldArray } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import type { Product, Category } from "../types/index";
import { X, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id'>) => void;
  isOpen: boolean;
}

const categories: Category[] = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 'Other'];

// Define form structure with mapped images
type FormValues = {
  name: string;
  description: string;
  price: number;
  category: Category;
  material: string;
  stockCount: number;
  imageFiles: { value: string }[];
};

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSubmit, isOpen }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'Other',
      material: '',
      stockCount: 0,
      imageFiles: [{ value: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "imageFiles"
  });

  useEffect(() => {
    if (product) {
        // Map product images string[] to { value: string }[] for field array
        const mappedHelper = product.images && product.images.length > 0
            ? product.images.map(img => ({ value: img }))
            : [{ value: '' }];
            
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        material: product.material,
        stockCount: product.stockCount,
        imageFiles: mappedHelper
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        category: 'Other',
        material: '',
        stockCount: 0,
        imageFiles: [{ value: '' }]
      });
    }
  }, [product, reset, isOpen]);

  const onFormSubmit: SubmitHandler<FormValues> = (data) => {
    // Transform back to simple object
    const finalData: Omit<Product, 'id'> = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        material: data.material,
        stockCount: Number(data.stockCount),
        images: data.imageFiles.map(i => i.value).filter(v => v.trim() !== '')
    };
    
    onSubmit(finalData);
    onClose();
    // No need to reset immediately here as parent might close/reopen or clear
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out translate-x-0 animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 sticky top-0">
          <h2 className="text-xl font-serif text-deep-black tracking-wide">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-deep-black transition-colors rounded-full p-1 hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
            <input 
              {...register("name", { required: "Name is required" })}
              className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all placeholder:text-gray-300"
              placeholder="e.g. Diamond Solitaire Ring"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
            <textarea 
              {...register("description", { required: "Description is required" })}
              className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all h-32 resize-none placeholder:text-gray-300"
              placeholder="Provide detailed product information..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Price */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Price ($)</label>
                <input 
                type="number"
                step="0.01"
                {...register("price", { required: "Price is required", min: { value: 0, message: "Price must be positive" } })}
                className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all"
                />
                 {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>

            {/* Stock */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Stock Count</label>
                <input 
                type="number"
                {...register("stockCount", { required: "Stock is required", min: 0 })}
                className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all"
                />
                 {errors.stockCount && <p className="text-red-500 text-xs mt-1">{errors.stockCount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             {/* Category */}
             <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
                <select 
                {...register("category", { required: "Category is required" })}
                className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all bg-white appearance-none"
                >
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

             {/* Material */}
             <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Material</label>
                <input 
                {...register("material", { required: "Material is required" })}
                className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all"
                placeholder="e.g. 18k Gold"
                />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Images (URLs)</label>
                <button type="button" onClick={() => append({ value: '' })} className="text-xs font-bold text-champagne-gold flex items-center gap-1 hover:text-yellow-600 transition-colors uppercase tracking-wider">
                    <Plus size={14} /> Add Image
                </button>
            </div>
            
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start group">
                        <div className="flex-1">
                            <input
                                {...register(`imageFiles.${index}.value` as const, { required: "Image URL required" })}
                                className="w-full p-3 border border-gray-200 text-sm focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold outline-none transition-all placeholder:text-gray-300"
                                placeholder="https://example.com/image.jpg"
                            />
                            {errors.imageFiles?.[index]?.value && (
                                <p className="text-red-500 text-xs mt-1">URL is required</p>
                            )}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => remove(index)} 
                            className="text-gray-400 hover:text-red-500 p-3 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100"
                            title="Remove image"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end gap-4 bg-white/95 sticky bottom-0 py-4 backdrop-blur-sm -mx-6 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors text-gray-600">
                Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-deep-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductForm;
