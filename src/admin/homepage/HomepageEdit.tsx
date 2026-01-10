import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "../../config/api";
import {
  Edit,
  SimpleForm,
  TextInput,
  useRecordContext,
  useNotify,
  useRedirect,
  required,
} from "react-admin";
import { useFormContext, Controller } from "react-hook-form";
import { ColorVariantManager } from "./ColorVariantManager";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  stock: number;
  category: string;
  sizes: string[];
  colors?: string[];
  defaultColor?: string;
  defaultColorCode?: string;
  colorVariants?: ColorVariant[];
}

interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  altText: string;
}

interface SelectedProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  category: string;
  sizes: string[];
  defaultColor?: string;
  defaultColorCode?: string;
  colorVariants?: ColorVariant[];
}

interface RecordData {
  productImages?: SelectedProduct[];
  heroImage?: Array<{ src?: string; altText?: string }>;
}

const PRESET_COLORS = [
  { name: "Black", code: "#000000" },
  { name: "White", code: "#FFFFFF" },
  { name: "Brown", code: "#8B4513" },
  { name: "Tan", code: "#D2B48C" },
  { name: "Navy", code: "#000080" },
  { name: "Blue", code: "#0000FF" },
  { name: "Red", code: "#FF0000" },
  { name: "Green", code: "#008000" },
  { name: "Gray", code: "#808080" },
  { name: "Beige", code: "#F5F5DC" },
];

const HeroImageSection = () => {
  const record = useRecordContext<RecordData>();
  const { setValue } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const notify = useNotify();

  useEffect(() => {
    if (record?.heroImage?.[0]?.src && !preview) {
      setPreview(record.heroImage[0].src);
      setValue('heroImageUrl', record.heroImage[0].src, { shouldValidate: false });
    }
  }, [record, preview, setValue]);

  const handleImageSelect = async (file: File) => {
  const tempPreview = URL.createObjectURL(file);
  setPreview(tempPreview);
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axiosInstance.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setPreview(response.data.src);
    
    setValue('heroImageUrl', response.data.src, { 
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true 
    });
    
    notify("Hero image uploaded!", { type: "success" });
  } catch {
    notify("Failed to upload hero image", { type: "error" });
    setPreview(record?.heroImage?.[0]?.src || "");
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Hero preview"
            className="w-full max-w-2xl h-64 object-cover rounded border-2 border-gray-300"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-lg font-semibold">Uploading...</div>
            </div>
          )}
          {!uploading && (
            <label className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-medium cursor-pointer">
              Replace Image
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </label>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload hero image</span>
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageSelect(file);
            }}
          />
        </label>
      )}
    </div>
  );
};

const ProductSelector = () => {
  const record = useRecordContext<RecordData>();
  const { setValue } = useFormContext();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const [defaultColor, setDefaultColor] = useState(PRESET_COLORS[0]);
  const [customDefaultColorName, setCustomDefaultColorName] = useState("");
  const [customDefaultColorCode, setCustomDefaultColorCode] = useState("#808080");
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  
  const notify = useNotify();

  // Initialize with existing products from record
  const initializeProducts = useCallback(() => {
    if (!hasInitialized && record?.productImages && Array.isArray(record.productImages)) {
      setSelectedProducts(record.productImages);
      setValue('productImagesData', JSON.stringify(record.productImages), { shouldDirty: false });
      setHasInitialized(true);
    }
  }, [record, hasInitialized, setValue]);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  // Fetch all available products
  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/products");
      const products = response.data.data || response.data || [];
      setAvailableProducts(products);
    } catch {
      notify("Failed to load products", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [notify]);

  // Update form field when products change
  useEffect(() => {
    if (hasInitialized) {
      const jsonString = JSON.stringify(selectedProducts);
      setValue('productImagesData', jsonString, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    }
  }, [selectedProducts, setValue, hasInitialized]);

  const handleAddProduct = () => {
    if (!selectedProductId) {
      notify("Please select a product", { type: "warning" });
      return;
    }

    if (selectedProducts.length >= 6) {
      notify("Maximum 6 products allowed", { type: "error" });
      return;
    }

    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (selectedProducts.some((p) => p.id === selectedProductId)) {
      notify("Product already added", { type: "warning" });
      return;
    }

    const finalDefaultColorName = product.defaultColor || customDefaultColorName.trim() || defaultColor.name;
    const finalDefaultColorCode = product.defaultColorCode || (customDefaultColorName.trim() ? customDefaultColorCode : defaultColor.code);

    const allColorVariants = [
      ...(product.colorVariants || []),
      ...colorVariants,
    ];

    const newProduct: SelectedProduct = {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      description: product.description,
      category: product.category,
      sizes: product.sizes,
      defaultColor: finalDefaultColorName,
      defaultColorCode: finalDefaultColorCode,
      colorVariants: allColorVariants,
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setSelectedProductId("");
    setColorVariants([]);
    setCustomDefaultColorName("");
    setDefaultColor(PRESET_COLORS[0]);
    
    const totalVariants = allColorVariants.length;
    const fromProduct = product.defaultColor ? ' from product' : '';
    
    notify(
      `Added "${product.name}" (${finalDefaultColorName}${fromProduct})${totalVariants > 0 ? ` with ${totalVariants} variant${totalVariants !== 1 ? 's' : ''}` : ''}`,
      { type: "success" }
    );
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
    notify("Product removed", { type: "info" });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to remove all products?")) {
      setSelectedProducts([]);
      notify("All products cleared", { type: "info" });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Current Featured Products ({selectedProducts.length}/6)
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProducts.map((product) => {
              const currentProduct = availableProducts.find(p => p.id === product.id);
              const currentStock = currentProduct?.stock ?? 0;
              
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md border-2 border-blue-300"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-800 truncate">{product.name}</h4>
                    <p className="text-green-600 font-bold text-lg">${product.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Default: {product.defaultColor || "N/A"}
                    </p>
                    {product.colorVariants && product.colorVariants.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {product.colorVariants.slice(0, 4).map((variant, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: variant.colorCode }}
                            title={variant.color}
                          />
                        ))}
                        {product.colorVariants.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow flex items-center justify-center text-xs font-bold">
                            +{product.colorVariants.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      Stock: {currentStock}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="mt-3 w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedProducts.length < 6 && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Add Product {selectedProducts.length + 1} of 6
          </h3>

          {availableProducts.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">
                No products available. Please create products first.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a product --</option>
                  {availableProducts
                    .filter((p) => !selectedProducts.some((sp) => sp.id === p.id))
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price} (Stock: {product.stock || 0})
                      </option>
                    ))}
                </select>
              </div>

              {selectedProductId && (
                <>
                  {(() => {
                    const product = availableProducts.find((p) => p.id === selectedProductId);
                    const hasExistingColors = product && (product.defaultColor || (product.colorVariants?.length || 0) > 0);
                    
                    return hasExistingColors ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-green-900 mb-2">✅ Product Already Has Colors</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          This product will automatically include:
                        </p>
                        <div className="flex gap-2 items-center mb-2">
                          {product.defaultColor && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border-2 border-gray-300" 
                                style={{ backgroundColor: product.defaultColorCode || '#000' }}
                              />
                              <span className="text-sm font-medium">{product.defaultColor} (default)</span>
                            </div>
                          )}
                          {product.colorVariants?.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border-2 border-gray-300" 
                                style={{ backgroundColor: v.colorCode }}
                              />
                              <span className="text-sm font-medium">{v.color}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 italic">
                          No need to select colors below - they're already set. You can add MORE variants if needed.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                          <h4 className="font-semibold text-amber-900 mb-3">Default Color</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            ⚠️ This product doesn't have a default color yet. Please set one:
                          </p>
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {PRESET_COLORS.map((color) => (
                              <button
                                key={color.name}
                                type="button"
                                onClick={() => {
                                  setDefaultColor(color);
                                  setCustomDefaultColorName("");
                                }}
                                className={`flex flex-col items-center p-2 rounded border-2 ${
                                  defaultColor.name === color.name && !customDefaultColorName
                                    ? "border-amber-500 bg-amber-100"
                                    : "border-gray-300"
                                }`}
                              >
                                <div className="w-8 h-8 rounded mb-1 border" style={{ backgroundColor: color.code }} />
                                <span className="text-xs">{color.name}</span>
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customDefaultColorName}
                              onChange={(e) => setCustomDefaultColorName(e.target.value)}
                              placeholder="Custom color name"
                              className="flex-1 px-3 py-2 border rounded"
                            />
                            <input
                              type="color"
                              value={customDefaultColorCode}
                              onChange={(e) => setCustomDefaultColorCode(e.target.value)}
                              className="w-16 border rounded"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-3">Additional Color Variants (Optional)</h4>
                    <ColorVariantManager
                      onVariantsChange={setColorVariants}
                      existingVariants={colorVariants}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    ✓ Add This Product to Homepage
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const transform = async (data: {
  headline: string;
  subtext?: string;
  heroImage?: Array<{ rawFile?: File; src?: string; title?: string }>;
  heroImageUrl?: string;
  productImagesData?: string;
}) => {
  let productImages: SelectedProduct[] = [];
  try {
    if (data.productImagesData) {
      productImages = JSON.parse(data.productImagesData);
    }
  } catch {
    // Invalid JSON, will be caught by validation below
  }

  if (!productImages || productImages.length === 0) {
    throw new Error("Please add at least one featured product");
  }

  let finalHeroImage = data.heroImage || [];

  if (data.heroImageUrl) {
    finalHeroImage = [{ src: data.heroImageUrl }];
  } else if (data.heroImage && Array.isArray(data.heroImage) && data.heroImage[0]?.rawFile) {
    const formData = new FormData();
    formData.append("image", data.heroImage[0].rawFile);

    try {
      const response = await axiosInstance.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      finalHeroImage = [{ src: response.data.src }];
    } catch (error) {
      throw new Error(`Failed to upload hero image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  const finalData = {
    headline: data.headline,
    subtext: data.subtext || "",
    heroImage: finalHeroImage,
    productImages: productImages.map((p) => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      price: p.price,
      images: p.images,
      altText: p.name,
      description: p.description,
      sizes: p.sizes || [],
      category: p.category,
      defaultColor: p.defaultColor,
      defaultColorCode: p.defaultColorCode,
      colorVariants: p.colorVariants || [],
    })),
  };

  return finalData;
};

export const HomepageEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Edit
      redirect="list"
      mutationMode="pessimistic"
      transform={transform}
      mutationOptions={{
        onSuccess: () => {
          notify("Homepage updated successfully!", { type: "success" });
          redirect("/admin/homepage");
        },
        onError: (error: Error) => {
          notify(`Error: ${error.message}`, { type: "error" });
        },
      }}
    >
      <SimpleForm validate={() => ({})}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit Homepage</h2>
        <p className="text-gray-600 mb-6">
          Update hero section and manage featured products with color variants.
        </p>

        <div className="space-y-6">
          <TextInput
            source="headline"
            fullWidth
            label="Headline"
            validate={required()}
          />

          <TextInput
            source="subtext"
            fullWidth
            label="Subtext"
            multiline
            rows={2}
          />

          <Controller
            name="heroImageUrl"
            defaultValue=""
            render={({ field }) => <input type="hidden" {...field} />}
          />
          
          <Controller
            name="productImagesData"
            defaultValue="[]"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hero Image
            </label>
            <HeroImageSection />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Featured Products
            </h3>
            <ProductSelector />
          </div>
        </div>
      </SimpleForm>
    </Edit>
  );
};