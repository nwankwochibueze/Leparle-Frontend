import { useState, useEffect } from "react";
import { axiosInstance } from "../../config/api";
import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  useNotify,
  useRecordContext,
  useRedirect,
  Toolbar,
  SaveButton,
} from "react-admin";
import { FieldValues, useFormContext } from "react-hook-form";
import { Button } from "@mui/material";
import { ColorVariantManager } from "../homepage/ColorVariantManager";

type ImagePreview = {
  url: string;
  file?: File;
  altText: string;
  isExisting: boolean;
};

interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  altText: string;
}

const PRODUCT_CATEGORIES = [
  "Shoes",
  "Sneakers",
  "Boots",
  "Bags",
  "Handbags",
  "Backpacks",
  "Crossbody",
  "Totes",
  "Accessories",
];

const SIZE_OPTIONS = {
  footwear: ["35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5", "45", "45.5", "46"],
  bagSingle: ["One Size"],
  bagMulti: ["Small", "Medium", "Large"],
  accessories: ["One Size"],
};

const CATEGORY_SIZE_MAP: Record<string, keyof typeof SIZE_OPTIONS> = {
  Shoes: "footwear",
  Sneakers: "footwear",
  Boots: "footwear",
  Bags: "bagSingle",
  Handbags: "bagMulti",
  Backpacks: "bagMulti",
  Crossbody: "bagMulti",
  Totes: "bagMulti",
  Accessories: "accessories",
};

const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Navy", hex: "#000080" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Green", hex: "#008000" },
  { name: "Gray", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Yellow", hex: "#FFFF00" },
];

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

const ProductEditToolbar = () => {
  const redirect = useRedirect();
  return (
    <Toolbar>
      <SaveButton />
      <Button
        variant="outlined"
        onClick={() => redirect("/admin/products")}
        sx={{ marginLeft: 2 }}
      >
        Cancel
      </Button>
    </Toolbar>
  );
};

const ProductEditFormFields = () => {
  const [defaultImages, setDefaultImages] = useState<ImagePreview[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isOnSale, setIsOnSale] = useState(false);
  
  const [defaultColor, setDefaultColor] = useState(PRESET_COLORS[0]);
  const [customDefaultColorName, setCustomDefaultColorName] = useState("");
  const [customDefaultColorCode, setCustomDefaultColorCode] = useState("#808080");
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  
  const record = useRecordContext();
  const { setValue } = useFormContext();

  const getAvailableSizes = (): string[] => {
    if (!selectedCategory) return [];
    const sizeType = CATEGORY_SIZE_MAP[selectedCategory];
    return sizeType ? SIZE_OPTIONS[sizeType] : [];
  };

  const availableSizes = getAvailableSizes();

  useEffect(() => {
    if (record) {
      if (record.images && Array.isArray(record.images)) {
        const existingImages = record.images.map((url: string) => ({
          url,
          altText: "",
          isExisting: true,
        }));
        setDefaultImages(existingImages);
      }

      if (record.sizes && Array.isArray(record.sizes)) {
        setSelectedSizes(record.sizes);
      }

      if (record.colors && Array.isArray(record.colors)) {
        setSelectedColors(record.colors);
      }

      if (record.category) {
        setSelectedCategory(record.category);
      }

      setIsOnSale(Boolean(record.onSale));

      if (record.defaultColor) {
        const presetColor = PRESET_COLORS.find(c => c.name === record.defaultColor);
        if (presetColor) {
          setDefaultColor(presetColor);
        } else {
          setCustomDefaultColorName(record.defaultColor);
          setCustomDefaultColorCode(record.defaultColorCode || "#808080");
        }
      }

      if (record.colorVariants && Array.isArray(record.colorVariants)) {
        setColorVariants(record.colorVariants);
      }
    }
  }, [record]);

  useEffect(() => {
    if (setValue) {
      setValue('_customImages', JSON.stringify(defaultImages.map(i => i.url)), { shouldDirty: true, shouldValidate: false });
    }
  }, [defaultImages, setValue]);

  useEffect(() => {
    if (setValue) {
      setValue('_customSizes', JSON.stringify(selectedSizes), { shouldDirty: true, shouldValidate: false });
    }
  }, [selectedSizes, setValue]);

  useEffect(() => {
    if (setValue) {
      setValue('_customColors', JSON.stringify(selectedColors), { shouldDirty: true, shouldValidate: false });
    }
  }, [selectedColors, setValue]);

  useEffect(() => {
    if (setValue) {
      setValue('_customColorVariants', JSON.stringify(colorVariants), { shouldDirty: true, shouldValidate: false });
    }
  }, [colorVariants, setValue]);

  useEffect(() => {
    if (setValue) {
      const finalDefaultColorName = customDefaultColorName.trim() || defaultColor.name;
      const finalDefaultColorCode = customDefaultColorName.trim() ? customDefaultColorCode : defaultColor.code;
      setValue('_customDefaultColor', `${finalDefaultColorName}|${finalDefaultColorCode}`, { shouldDirty: true, shouldValidate: false });
    }
  }, [defaultColor, customDefaultColorName, customDefaultColorCode, setValue]);

  const handleDefaultImageAdd = (file: File) => {
    const preview: ImagePreview = {
      url: URL.createObjectURL(file),
      file,
      altText: "",
      isExisting: false,
    };
    const newImages = [...defaultImages, preview];
    setDefaultImages(newImages);
  };

  const handleDefaultImageRemove = (index: number) => {
    const newImages = defaultImages.filter((_, i) => i !== index);
    setDefaultImages(newImages);
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  const handleCategoryChange = (newCategory: string) => {
    const oldCategory = selectedCategory;
    setSelectedCategory(newCategory);
    
    const oldSizeType = oldCategory ? CATEGORY_SIZE_MAP[oldCategory] : null;
    const newSizeType = CATEGORY_SIZE_MAP[newCategory];
    
    if (oldSizeType !== newSizeType) {
      setSelectedSizes([]);
    }
  };

  return (
    <>
      <input type="hidden" name="_customImages" />
      <input type="hidden" name="_customSizes" />
      <input type="hidden" name="_customColors" />
      <input type="hidden" name="_customColorVariants" />
      <input type="hidden" name="_customDefaultColor" />

      <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit Product</h2>
      <p className="text-gray-600 mb-6">
        Update product details and manage color variants.
      </p>

      <TextInput source="name" fullWidth required />
      <TextInput source="description" multiline fullWidth rows={4} />
      
      <div style={{ display: "flex", gap: "20px", width: "100%" }}>
        <NumberInput 
          source="price" 
          label="Original Price (₦)" 
          required 
          style={{ flex: 1 }}
        />
        {isOnSale && (
          <NumberInput 
            source="salePrice" 
            label="Sale Price (₦)" 
            style={{ flex: 1 }}
            helperText="Must be less than original price"
          />
        )}
      </div>
      
      <NumberInput source="stock" />
      
      <SelectInput
        source="category"
        choices={PRODUCT_CATEGORIES.map((cat) => ({ id: cat, name: cat }))}
        onChange={(e) => handleCategoryChange(e.target.value)}
        helperText="Category determines available size options"
      />

      <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
        <BooleanInput source="featured" label="Featured Product" />
        <BooleanInput 
          source="onSale" 
          label="On Sale"
          onChange={(e) => setIsOnSale(e.target.checked)}
        />
      </div>

      {isOnSale && (
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#fef2f2", 
          border: "1px solid #fecaca",
          borderRadius: "4px",
          marginBottom: "16px"
        }}>
          <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>
            ⚠️ When marking as "On Sale", make sure to enter a Sale Price above.
          </p>
        </div>
      )}

      <div className="w-full mb-6 p-4 border rounded bg-amber-50">
        <h3 className="font-bold text-lg mb-3 text-amber-900">Default Product Color</h3>
        <p className="text-sm text-gray-700 mb-3">
          This color uses the images below. Additional colors can have their own images.
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
              className={`flex flex-col items-center p-2 rounded border-2 transition ${
                defaultColor.name === color.name && !customDefaultColorName
                  ? "border-amber-500 bg-amber-100"
                  : "border-gray-300 hover:border-amber-300"
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
            placeholder="Or custom color name"
            className="flex-1 px-3 py-2 border rounded"
          />
          <input
            type="color"
            value={customDefaultColorCode}
            onChange={(e) => setCustomDefaultColorCode(e.target.value)}
            className="w-16 border rounded"
          />
        </div>
        
        {(customDefaultColorName || defaultColor) && (
          <p className="text-sm text-amber-700 mt-2 font-medium">
            Selected: {customDefaultColorName || defaultColor.name}
          </p>
        )}
      </div>

      <div className="w-full mb-6 p-4 border rounded">
        <h3 className="font-bold text-lg mb-3">
          Default Color Images ({customDefaultColorName || defaultColor.name})
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Upload at least 2 images. First image is main, second shows on hover.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach((file) => handleDefaultImageAdd(file));
            e.target.value = "";
          }}
          className="mb-2"
        />

        {defaultImages.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {defaultImages.map((preview, index) => (
              <div key={index} className="border p-2 rounded">
                <div className="relative">
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                  {preview.isExisting && (
                    <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Existing
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDefaultImageRemove(index)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full mb-6 p-4 border rounded bg-purple-50">
        <h3 className="font-bold text-lg mb-3 text-purple-900">Additional Color Variants</h3>
        <p className="text-sm text-gray-700 mb-4">
          Add or remove color variants. Each variant can have its own images.
        </p>
        <ColorVariantManager
          onVariantsChange={setColorVariants}
          existingVariants={colorVariants}
        />
      </div>

      <div className="w-full mb-6 p-4 border rounded">
        <h3 className="font-bold text-lg mb-3">Available Sizes</h3>
        {!selectedCategory ? (
          <p className="text-sm text-gray-500 italic">
            Please select a category first
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Size options for <strong>{selectedCategory}</strong>:
            </p>
            <div className={`grid gap-2 ${
              availableSizes.length > 10 ? 'grid-cols-8' : 'grid-cols-4'
            }`}>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeToggle(size)}
                  className={`px-3 py-2 border rounded text-sm ${
                    selectedSizes.includes(size)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {selectedSizes.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {selectedSizes.length} size(s) selected
              </p>
            )}
          </>
        )}
      </div>

      <div className="w-full mb-6 p-4 border rounded">
        <h3 className="font-bold text-lg mb-3">Available Colors (for filtering)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Select colors for filtering. Separate from color variants above.
        </p>
        <div className="grid grid-cols-6 gap-3">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => handleColorToggle(color.name)}
              className={`relative h-16 rounded-lg border-2 transition-all ${
                selectedColors.includes(color.name)
                  ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "border-gray-300 hover:border-gray-500"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {selectedColors.includes(color.name) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold drop-shadow-lg">
                    ✓
                  </span>
                </div>
              )}
              <span className="absolute -bottom-6 left-0 right-0 text-xs text-center text-gray-700 font-medium">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const ProductEditForm = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const record = useRecordContext();

  const handleSubmit = async (data: FieldValues) => {
  try {
    const customImages = data._customImages ? JSON.parse(data._customImages) : [];
    const selectedSizes = data._customSizes ? JSON.parse(data._customSizes) : [];
    const selectedColors = data._customColors ? JSON.parse(data._customColors) : [];
    const colorVariants = data._customColorVariants ? JSON.parse(data._customColorVariants) : [];
    const [defaultColorName, defaultColorCode] = data._customDefaultColor ? data._customDefaultColor.split('|') : ['Black', '#000000'];

    const finalDefaultImages = customImages;

    const productData = {
      name: data.name,
      price: data.price,
      salePrice: data.onSale && data.salePrice ? Number(data.salePrice) : undefined,
      description: data.description,
      images: finalDefaultImages,
      category: data.category,
      stock: data.stock,
      featured: Boolean(data.featured),
      onSale: Boolean(data.onSale),
      sizes: selectedSizes,
      colors: selectedColors,
      defaultColor: defaultColorName,
      defaultColorCode: defaultColorCode,
      colorVariants: colorVariants,
    };

    await axiosInstance.put(`/products/${record?.id}`, productData);

    notify("✅ Product updated successfully with color variants", { type: "info" });
    redirect("/admin/products");
  } catch (err: unknown) {
    const error = err as Error;
    notify(`❌ Error: ${error.message}`, { type: "error" });
  }
};

  return (
    <SimpleForm onSubmit={handleSubmit} toolbar={<ProductEditToolbar />}>
      <ProductEditFormFields />
    </SimpleForm>
  );
};

export const ProductEdit = () => {
  return (
    <Edit>
      <ProductEditForm />
    </Edit>
  );
};