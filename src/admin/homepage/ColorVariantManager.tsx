import { useState, useEffect } from "react";
import { useNotify } from "react-admin";
import { axiosInstance } from "../../config/api";

interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  altText: string;
}

interface ColorVariantManagerProps {
  onVariantsChange: (variants: ColorVariant[]) => void;
  existingVariants?: ColorVariant[];
}

const PRESET_COLORS = [
  { name: "Black", code: "#000000" },
  { name: "Blue", code: "#0066CC" },
  { name: "Brown", code: "#8B4513" },
  { name: "Green", code: "#228B22" },
  { name: "Red", code: "#DC143C" },
  { name: "White", code: "#FFFFFF" },
  { name: "Gray", code: "#808080" },
  { name: "Navy", code: "#000080" },
  { name: "Pink", code: "#FF69B4" },
  { name: "Yellow", code: "#FFD700" },
];

export const ColorVariantManager: React.FC<ColorVariantManagerProps> = ({
  onVariantsChange,
  existingVariants = [],
}) => {
  const [variants, setVariants] = useState<ColorVariant[]>(existingVariants);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorCode, setCustomColorCode] = useState("#000000");
  const [variantImages, setVariantImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variantAltText, setVariantAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const notify = useNotify();

  // Sync with existing variants when they change
  useEffect(() => {
    if (existingVariants && existingVariants.length > 0) {
      setVariants(existingVariants);
    }
  }, [existingVariants]);

  const handleImagesSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    const currentTotal = variantImages.length + fileArray.length;

    if (currentTotal > 5) {
      notify(`Maximum 5 images per color variant. You can add ${5 - variantImages.length} more.`, {
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
    const colorName = customColorName.trim() || selectedColor.name;
    const colorCode = customColorName.trim() ? customColorCode : selectedColor.code;

    if (variantImages.length === 0) {
      notify("Please add at least one image for this color variant", { type: "error" });
      return;
    }

    // Check if color already exists
    if (variants.some(v => v.color.toLowerCase() === colorName.toLowerCase())) {
      notify(`Color "${colorName}" already exists`, { type: "error" });
      return;
    }

    setUploading(true);

    try {
      const uploadedImages: string[] = [];

      // Upload all images to server
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
        color: colorName,
        colorCode: colorCode,
        images: uploadedImages,
        altText: variantAltText || colorName,
      };

      const updatedVariants = [...variants, newVariant];
      setVariants(updatedVariants);
      onVariantsChange(updatedVariants);

      notify(`${colorName} variant with ${uploadedImages.length} images added!`, {
        type: "success",
      });

      // Reset form
      setVariantImages([]);
      setImagePreviews([]);
      setVariantAltText("");
      setCustomColorName("");
      setCustomColorCode("#000000");
    } catch {
      notify("Failed to upload color variant images", { type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVariant = (colorName: string) => {
    const updatedVariants = variants.filter(v => v.color !== colorName);
    setVariants(updatedVariants);
    onVariantsChange(updatedVariants);
    notify(`${colorName} variant removed`, { type: "info" });
  };

  return (
    <div className="space-y-6">
      {variants.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-3">
            Color Variants ({variants.length})
          </h4>
          <div className="space-y-2">
            {variants.map((variant, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 flex items-center justify-between border border-purple-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: variant.colorCode }}
                  />
                  <div>
                    <p className="font-medium text-gray-800">{variant.color}</p>
                    <p className="text-xs text-gray-500">{variant.images.length} images</p>
                  </div>
                  <div className="flex gap-1">
                    {variant.images.slice(0, 3).map((img, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={img}
                        alt={variant.altText}
                        className="w-10 h-10 object-cover rounded border"
                      />
                    ))}
                    {variant.images.length > 3 && (
                      <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center text-xs font-semibold text-gray-600">
                        +{variant.images.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(variant.color)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4">Add Color Variant</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preset Colors
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
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
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

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Custom Color
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="e.g., Burgundy"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={customColorCode}
                  onChange={(e) => setCustomColorCode(e.target.value)}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (Optional)
              </label>
              <input
                type="text"
                value={variantAltText}
                onChange={(e) => setVariantAltText(e.target.value)}
                placeholder="Defaults to color name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Images * (up to 5)
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-xs text-gray-500">{imagePreviews.length}/5 images</p>
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
        </div>

        <button
          type="button"
          onClick={handleAddVariant}
          disabled={uploading}
          className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-medium disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "✓ Add Color Variant"}
        </button>
      </div>
    </div>
  );
};