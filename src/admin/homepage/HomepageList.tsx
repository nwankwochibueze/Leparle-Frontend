// src/admin/homepage/HomepageList.tsx
import {
  List,
  Datagrid,
  TextField,
  ImageField,
  FunctionField,
} from "react-admin";

type HomepageRecord = {
  id: string;
  headline: string;
  subtext: string;
  heroImage?: { src: string; altText?: string }[];
  productImages?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    altText?: string;
    description?: string;
  }[];
};

export const HomepageList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="headline" />
      <TextField source="subtext" />

      {/* ✅ Product Images in a neat 2-column grid - FIXED to use images array */}
      <FunctionField<HomepageRecord>
        label="Product Images"
        render={(record) =>
          record.productImages && record.productImages.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 60px)",
                gap: "6px",
              }}
            >
              {record.productImages.map((product, index) => {
                // ✅ Get the first image from the product's images array
                const imageUrl = product.images?.[0];
                
                if (!imageUrl) {
                  return (
                    <div
                      key={product.id || index}
                      style={{
                        width: 60,
                        height: 60,
                        backgroundColor: "#e0e0e0",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        color: "#666",
                      }}
                    >
                      No img
                    </div>
                  );
                }

                return (
                  <div
                    key={product.id || index}
                    style={{ position: "relative" }}
                    title={`${product.name} - ${product.price}`}
                  >
                    <img
                      src={imageUrl}
                      alt={product.altText || product.name || `Product ${index + 1}`}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error(`Failed to load image: ${imageUrl}`);
                        target.src = "/placeholder.png";
                      }}
                    />
                    {/* Badge showing number of additional images */}
                    {product.images.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          fontSize: "9px",
                          padding: "2px 4px",
                          borderRadius: "3px",
                          fontWeight: "bold",
                        }}
                      >
                        +{product.images.length - 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span>No images</span>
          )
        }
      />

      {/* ✅ Hero Image Preview */}
      <ImageField source="heroImage[0].src" label="Hero Image" />
    </Datagrid>
  </List>
);