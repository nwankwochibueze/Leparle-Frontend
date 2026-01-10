// src/components/CartModal.tsx
import { FaLock, FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { updateQuantity, removeFromCart } from "../store/CartSlice";
import type { CartProduct } from "../store/type";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type CartModalProps = {
  product: CartProduct;
  onClose: () => void;
};

const CartModal = ({ product, onClose }: CartModalProps) => {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const dispatch = useDispatch();
  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  ) as CartProduct[];

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed top-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 h-full overflow-y-auto">
      {/*  Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-regular text-gray-500">
          CART ({totalItems} item{totalItems !== 1 ? "s" : ""})
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-600 transition-colors"
        >
          <IoMdClose size={24} />
        </button>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {product && showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="px-6 py-4 bg-yellow-50 border-l-4 border-gray-400 mb-4"
          >
            <p className="text-sm text-gray-800">
              You just added: <strong>{product.title}</strong>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Items */}
      {cartItems.length > 0 ? (
        <>
          <div className="p-6 border-b overflow-x-auto">
            <div className="flex flex-col gap-6">
              {cartItems.map((item, index) => {
                const itemCount = item.quantity || 1;
                const subtotal = (item.price * itemCount).toFixed(2);

                return (
                  <div
                    key={index}
                    className="min-w-[260px] flex-shrink-0 border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.title}
                        className="w-20 h-24 object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                          ${item.price.toFixed(2)}
                        </p>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-500">
                            Size: {item.selectedSize}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300">
                        <button
                          className="p-2 hover:bg-gray-50"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                _id: item._id,
                                selectedSize: item.selectedSize || "",
                                quantity: Math.max(1, itemCount - 1),
                              })
                            )
                          }
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">
                          {itemCount}
                        </span>
                        <button
                          className="p-2 hover:bg-gray-50"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                _id: item._id,
                                selectedSize: item.selectedSize || "",
                                quantity: itemCount + 1,
                              })
                            )
                          }
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              _id: item._id,
                              selectedSize: item.selectedSize || "",
                            })
                          )
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>

                    <div className="text-right text-sm font-semibold text-gray-700 mt-2">
                      ${subtotal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/*  Summary Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-gray-500">
                Subtotal
              </span>
              <span className="text-lg font-medium text-gray-500">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Taxes and shipping are calculated at checkout.
            </p>
          </div>

          {/*  Action Buttons */}
          <div className="p-6 space-y-3">
            {/* ✅ Fixed: Added Link wrapper */}
            <Link to="/checkout" onClick={onClose}>
              <button className="w-full bg-gray-800 text-white py-3 px-4 hover:bg-gray-900 transition-colors font-medium">
                Checkout
              </button>
            </Link>
            <Link to="/cart" onClick={onClose}>
              <button className="w-full border border-gray-300 text-gray-800 py-3 px-4 hover:bg-gray-50 transition-colors font-medium">
                View Cart
              </button>
            </Link>
            <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
              <FaLock className="mr-2" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-32 px-6 text-center text-gray-500">
          <p className="text-lg font-medium">Your cart is empty</p>
        </div>
      )}
    </div>
  );
};

export default CartModal;
