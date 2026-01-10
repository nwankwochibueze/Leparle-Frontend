import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Create,
  SimpleForm,
  TextInput,
  useNotify,
  useRedirect,
  required,
} from "react-admin";
import { axiosInstance } from "../../config/api";

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

const HeroImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const notify = useNotify();
  const { setValue } = useFormContext();

  const handleImageSelect = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axiosInstance.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setValue("heroImageUrl", response.data.src, { shouldValidate: true, shouldDirty: true });
      notify("Hero image uploaded successfully!", { type: "success" });
    } catch {
      notify("Failed to upload hero image", { type: "error" });
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Hero preview"
            className="w-full max-h-96 object-cover rounded-lg border-2 border-gray-300"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-lg font-semibold">Uploading...</div>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => {
                setPreview("");
                setValue("heroImageUrl", "", { shouldValidate: true, shouldDirty: true });
              }}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg hover:bg-red-700 font-medium"
            >
              Remove Image
            </button>
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

const ColorVariantManager = ({ 
  onVariantsChange,
  existingVariants = []
}: {
  onVariantsChange: (variants: ColorVariant[]) => void;
  existingVariants?: ColorVariant[];
}) => {
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(existingVariants);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorCode, setCustomColorCode] = useState("#808080");
  const [variantImages, setVariantImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    onVariantsChange(colorVariants);
  }, [colorVariants, onVariantsChange]);

  const handleImagesSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentTotal = variantImages.length + fileArray.length;

    if (currentTotal > 5) {
      notify(`Maximum 5 images per variant. You can add ${5 - variantImages.length} more.`, {
        type: "warning",
      });
      return;
    }

    setVariantImages([...variantImages, ...fileArray]);
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setVariantImages(variantImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleAddVariant = async () => {
    if (variantImages.length === 0) {
      notify("Please add at least one image for this color variant", { type: "error" });
      return;
    }

    const finalColorName = customColorName.trim() || selectedColor.name;
    const finalColorCode = customColorName.trim() ? customColorCode : selectedColor.code;

    if (colorVariants.some(v => v.color.toLowerCase() === finalColorName.toLowerCase())) {
      notify(`Color variant "${finalColorName}" already exists`, { type: "error" });
      return;
    }

    setUploading(true);

    try {
      const uploadedImages: string[] = [];

      for (const image of variantImages) {
        const formData = new FormData();
        formData.append("image", image);

        const response = await axiosInstance.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedImages.push(response.data.src);
      }

      const newVariant: ColorVariant = {
        color: finalColorName,
        colorCode: finalColorCode,
        images: uploadedImages,
        altText: finalColorName,
      };

      setColorVariants([...colorVariants, newVariant]);
      notify(`Added ${finalColorName} variant with ${uploadedImages.length} images`, { type: "success" });

      setVariantImages([]);
      setImagePreviews([]);
      setCustomColorName("");
      setCustomColorCode("#808080");
      setSelectedColor(PRESET_COLORS[0]);
    } catch {
      notify("Failed to upload variant images", { type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVariant = (index: number) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
    notify("Color variant removed", { type: "info" });
  };

  return (
    <div className="space-y-4">
      {colorVariants.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-3">
            Added Color Variants ({colorVariants.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {colorVariants.map((variant, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-green-300 flex gap-3">
                <div className="flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded border-2"
                    style={{ backgroundColor: variant.colorCode }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{variant.color}</p>
                  <p className="text-sm text-gray-600">{variant.images.length} images</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3">Add Color Variant</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  setSelectedColor(color);
                  setCustomColorName("");
                }}
                className={`flex flex-col items-center p-2 rounded border-2 transition ${
                  selectedColor.name === color.name && !customColorName
                    ? "border-purple-500 bg-purple-100"
                    : "border-gray-300 hover:border-purple-300"
                }`}
              >
                <div
                  className="w-8 h-8 rounded mb-1 border"
                  style={{ backgroundColor: color.code }}
                />
                <span className="text-xs text-gray-700">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 border-t border-purple-200 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Custom Color
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customColorName}
              onChange={(e) => setCustomColorName(e.target.value)}
              placeholder="e.g., Burgundy"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="color"
              value={customColorCode}
              onChange={(e) => setCustomColorCode(e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images for this Color (up to 5)
          </label>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {imagePreviews.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center">
                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">
                  {imagePreviews.length === 0 ? "Upload images" : "Add more images"} ({imagePreviews.length}/5)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) handleImagesSelect(files);
                }}
              />
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddVariant}
          disabled={uploading || variantImages.length === 0}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : `Add ${customColorName || selectedColor.name} Variant`}
        </button>
      </div>
    </div>
  );
};

const ProductSelector = () => {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  
  const [defaultColor, setDefaultColor] = useState(PRESET_COLORS[0]);
  const [customDefaultColorName, setCustomDefaultColorName] = useState("");
  const [customDefaultColorCode, setCustomDefaultColorCode] = useState("#808080");
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  
  const notify = useNotify();
  const { setValue } = useFormContext();

  // Fetch all available products on mount
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

  // Update form field whenever selected products change
  useEffect(() => {
    setValue("selectedProductIds", JSON.stringify(selectedProducts), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [selectedProducts, setValue]);

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
    const newVariants = colorVariants.length;
    const existingVariants = (product.colorVariants?.length || 0);
    
    notify(
      `Added "${product.name}" with ${totalVariants} color variant${totalVariants !== 1 ? 's' : ''} ` +
      `(${existingVariants} from product${newVariants > 0 ? ` + ${newVariants} new` : ''})`,
      { type: "success" }
    );
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
    notify("Product removed", { type: "info" });
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Selected Products ({selectedProducts.length}/6)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProducts.map((product) => (
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
                  <p className="text-xs text-gray-600 mt-1">Default: {product.defaultColor}</p>
                  {product.colorVariants && product.colorVariants.length > 0 && (
                    <p className="text-xs text-purple-600 font-medium">
                      +{product.colorVariants.length} color variants
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="mt-3 w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
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
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-3">Default Color</h4>
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

const transform = async (data: Record<string, unknown>) => {
  const heroImageUrl = data.heroImageUrl as string | undefined;
  if (!heroImageUrl) {
    throw new Error("Please upload a hero image first");
  }

  const selectedProductIds = data.selectedProductIds as string | undefined;
  if (!selectedProductIds || selectedProductIds === "[]") {
    throw new Error("Please select at least one product");
  }

  let products: SelectedProduct[] = [];
  try {
    products = JSON.parse(selectedProductIds);
    if (products.length === 0) {
      throw new Error("Please select at least one product");
    }
  } catch {
    throw new Error("Invalid product data");
  }

  const finalData = {
    headline: data.headline as string,
    subtext: (data.subtext as string) || "",
    heroImage: [{ src: heroImageUrl }],
    productImages: products.map((p) => ({
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

export const HomepageCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Create
      redirect="list"
      transform={transform}
      mutationOptions={{
        onSuccess: () => {
          notify("Homepage created successfully!", { type: "success" });
          redirect("/admin/homepage");
        },
        onError: (error: Error) => {
          notify(`Error: ${error.message}`, { type: "error" });
        },
      }}
    >
      <SimpleForm
        defaultValues={{
          selectedProductIds: "[]",
          heroImageUrl: "",
          headline: "",
          subtext: "",
        }}
        validate={() => ({})}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Homepage</h2>
        <p className="text-gray-600 mb-6">
          Select up to 6 products and add color variants with custom images for each.
        </p>

        <div className="space-y-6">
          <TextInput source="headline" fullWidth label="Headline" validate={required()} />
          <TextInput source="subtext" fullWidth label="Subtext" multiline rows={2} />

          <Controller
            name="heroImageUrl"
            defaultValue=""
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            name="selectedProductIds"
            defaultValue="[]"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Hero Image *</label>
            <HeroImageUploader />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Featured Products</h3>
            <ProductSelector />
          </div>
        </div>
      </SimpleForm>
    </Create>
  );
};