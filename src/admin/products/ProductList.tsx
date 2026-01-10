// src/admin/products/ProductList.tsx - ENHANCED WITH COLOR-CODED STOCK AND ON SALE
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  ImageField,
  FunctionField,
} from "react-admin";

export const ProductList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <ImageField source="images[0]" label="Image" />
      <TextField source="name" />
      
      {/* ✅ ENHANCED: Show both original price and sale price if on sale */}
      <FunctionField<{ price?: number; salePrice?: number; onSale?: boolean }>
        label="Price"
        render={(record) => {
          const price = record?.price || 0;
          const salePrice = record?.salePrice || 0;
          const onSale = record?.onSale || false;
          
          if (onSale && salePrice) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  textDecoration: 'line-through', 
                  color: '#999',
                  fontSize: '0.875rem'
                }}>
                  ₦{price.toLocaleString()}
                </span>
                <span style={{ 
                  color: '#dc2626', 
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  ₦{salePrice.toLocaleString()}
                </span>
              </div>
            );
          }
          
          return <span>₦{price.toLocaleString()}</span>;
        }}
      />
      
      <TextField source="category" />
      
      {/* ✅ ENHANCED: Color-coded stock display */}
      <FunctionField<{ stock?: number }>
        label="Stock"
        render={(record) => {
          const stock = record?.stock || 0;
          
          // Determine color based on stock level
          let textColor = "text-green-600";
          let bgColor = "bg-green-50";
          let statusText = "";
          
          if (stock === 0) {
            textColor = "text-red-600";
            bgColor = "bg-red-50";
            statusText = " (Out of Stock)";
          } else if (stock < 10) {
            textColor = "text-orange-600";
            bgColor = "bg-orange-50";
            statusText = " (Low Stock)";
          }
          
          return (
            <span 
              className={`${textColor} ${bgColor} px-3 py-1 rounded-md font-semibold text-sm`}
              style={{
                display: 'inline-block',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              {stock}{statusText}
            </span>
          );
        }}
      />
      
      <BooleanField source="featured" label="Featured" />
      
      {/* ✅ NEW: On Sale column with visual badge */}
      <FunctionField<{ onSale?: boolean }>
        label="On Sale"
        render={(record) => {
          const onSale = record?.onSale || false;
          
          if (onSale) {
            return (
              <span 
                className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-xs"
                style={{
                  display: 'inline-block',
                  textAlign: 'center'
                }}
              >
                SALE
              </span>
            );
          }
          
          return (
            <span 
              className="text-gray-400 text-xs"
              style={{
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              —
            </span>
          );
        }}
      />
    </Datagrid>
  </List>
);