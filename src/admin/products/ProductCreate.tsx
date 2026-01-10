import { useState } from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  useNotify,
  useRedirect,
  Toolbar,
  SaveButton,
} from "react-admin";
import { FieldValues } from "react-hook-form";
import { Button } from "@mui/material";
import { ColorVariantManager } from "../homepage/ColorVariantManager";
import { axiosInstance } from "../../config/api";

type ImagePreview = {
  url: string;
  file: File;
  altText: string;
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

const ProductCreateToolbar = () => {
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

export const ProductCreate = () => {
  const [defaultImages, setDefaultImages] = useState<ImagePreview[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isOnSale, setIsOnSale] = useState(false);
  
  const [defaultColor, setDefaultColor] = useState(PRESET_COLORS[0]);
  const [customDefaultColorName, setCustomDefaultColorName] = useState("");
  const [customDefaultColorCode, setCustomDefaultColorCode] = useState("#808080");
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  
  const notify = useNotify();
  const redirect = useRedirect();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvailableSizes = (): string[] => {
    if (!selectedCategory) return [];
    const sizeType = CATEGORY_SIZE_MAP[selectedCategory];
    return sizeType ? SIZE_OPTIONS[sizeType] : [];
  };

  const availableSizes = getAvailableSizes();

  const handleDefaultImageAdd = (file: File) => {
    const preview: ImagePreview = {
      url: URL.createObjectURL(file),
      file,
      altText: "",
    };
    setDefaultImages((prev) => [...prev, preview]);
  };

  const handleDefaultImageRemove = (index: number) => {
    setDefaultImages((prev) => prev.filter((_, i) => i !== index));
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
    setSelectedCategory(newCategory);
    setSelectedSizes([]);
  };

  const handleSubmit = async (data: FieldValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Upload all default color images
      const uploadedDefaultImages: string[] = [];
      for (const preview of defaultImages) {
        const formData = new FormData();
        formData.append("image", preview.file);
        
        const res = await axiosInstance.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        uploadedDefaultImages.push(res.data.src);
      }

      // Determine final default color
      const finalDefaultColorName = customDefaultColorName.trim() || defaultColor.name;
      const finalDefaultColorCode = customDefaultColorName.trim() ? customDefaultColorCode : defaultColor.code;

      // Build product data
      const productData = {
        name: data.name?.trim(),
        description: data.description?.trim() || "",
        price: Number(data.price),
        salePrice: data.onSale && data.salePrice ? Number(data.salePrice) : undefined,
        stock: Number(data.stock) || 0,
        category: data.category?.trim() || "",
        featured: Boolean(data.featured),
        onSale: Boolean(data.onSale),
        images: uploadedDefaultImages,
        sizes: selectedSizes,
        colors: selectedColors,
        defaultColor: finalDefaultColorName,
        defaultColorCode: finalDefaultColorCode,
        colorVariants: colorVariants,
      };

      await axiosInstance.post("/products", productData);

      notify("✅ Product created successfully with color variants!", { type: "info" });
      setTimeout(() => redirect("/admin/products"), 100);
    } catch (err: unknown) {
      const error = err as Error;
      notify(`❌ ${error.message || "An error occurred"}`, { type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Create redirect="/admin/products">
      <SimpleForm onSubmit={handleSubmit} toolbar={<ProductCreateToolbar />}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Product</h2>
        <p className="text-gray-600 mb-6">
          Create a product with multiple color variants and images for each color.
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
        
        <NumberInput source="stock" defaultValue={0} />
        
        <SelectInput
          source="category"
          choices={PRODUCT_CATEGORIES.map((cat) => ({ id: cat, name: cat }))}
          onChange={(e) => handleCategoryChange(e.target.value)}
          helperText="Category determines available size options"
        />

        <div style={{ display: "flex", gap: "30px", marginTop: "10px" }}>
          <BooleanInput source="featured" label="Featured Product" defaultValue={false} />
          <BooleanInput 
            source="onSale" 
            label="On Sale" 
            defaultValue={false}
            onChange={(e) => setIsOnSale(e.target.checked)}
          />
        </div>

        {isOnSale && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: "#fef2f2", 
            border: "1px solid #fecaca",
            borderRadius: "4px",
            marginTop: "10px"
          }}>
            <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>
              ⚠️ When marking as "On Sale", make sure to enter a Sale Price above. The original price will be shown with a strikethrough.
            </p>
          </div>
        )}

        <div className="w-full mb-6 p-4 border rounded bg-amber-50">
          <h3 className="font-bold text-lg mb-3 text-amber-900">Default Product Color</h3>
          <p className="text-sm text-gray-700 mb-3">
            This color will use the images you upload below. Additional colors can be added with their own images.
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
            Upload at least 2 images for the default color. First image is main, second shows on hover.
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
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
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
          <h3 className="font-bold text-lg mb-3 text-purple-900">Additional Color Variants (Optional)</h3>
          <p className="text-sm text-gray-700 mb-4">
            Add more colors with their own images. Customers can switch between colors on the product page.
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
              Please select a category first to see available size options
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
            Select colors for filtering. This is separate from color variants above.
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
      </SimpleForm>
    </Create>
  );
};