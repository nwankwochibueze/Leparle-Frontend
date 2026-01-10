// src/components/PromoAndNotes.tsx
import React, { useState } from "react";
import { FaTag, FaStickyNote } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  applyPromoCode,
  removePromoCode,
  setOrderNote,
} from "../store/CartSlice";

// Mock promo codes - Replace with backend API call later
const VALID_PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1, // 10% off
  SAVE20: 0.2, // 20% off
  WELCOME: 0.15, // 15% off
  FREESHIP: 0.05, // 5% off 
};

const PromoAndNotes: React.FC = () => {
  const dispatch = useAppDispatch();
  const { promoCode, discount, orderNote, totalPrice } = useAppSelector(
    (state) => state.cart
  );

  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [noteInput, setNoteInput] = useState(orderNote || "");
  const [promoError, setPromoError] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const handleApplyPromo = () => {
    const code = promoInput.toUpperCase().trim();

    if (!code) {
      setPromoError("Please enter a promo code");
      return;
    }

    const discountPercent = VALID_PROMO_CODES[code];

    if (discountPercent) {
      const discountAmount = totalPrice * discountPercent;
      dispatch(applyPromoCode({ code, discount: discountAmount }));
      setPromoError("");
      setPromoInput("");
    } else {
      setPromoError("Invalid promo code");
    }
  };

  const handleRemovePromo = () => {
    dispatch(removePromoCode());
    setPromoInput("");
    setPromoError("");
  };

  const handleSaveNote = () => {
    dispatch(setOrderNote(noteInput));
    setNoteSaved(true);

    // Hide the "saved" message after 2 seconds
    setTimeout(() => {
      setNoteSaved(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Promo Code Section */}
      <div>
        <button
          onClick={() => setShowPromoInput(!showPromoInput)}
          className="flex items-center text-md text-gray-700 hover:text-gray-900"
        >
          <FaTag className="mr-2" />
          {promoCode ? `Promo: ${promoCode} applied` : "Enter a promo code"}
        </button>

        {showPromoInput && (
          <div className="mt-3">
            {!promoCode ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleApplyPromo();
                      }
                    }}
                    placeholder="Enter promo code"
                    className="border border-gray-300 px-3 py-2 w-full sm:w-auto uppercase"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white transition"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-600 text-sm mt-2">{promoError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Try: SAVE10, SAVE20, WELCOME, or FREESHIP
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded">
                <div>
                  <p className="text-green-700 font-medium text-sm">
                    ✓ {promoCode} applied
                  </p>
                  <p className="text-green-600 text-xs">
                    You saved ${discount.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/*  Add a Note Section */}
      <div>
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="flex items-center text-md text-gray-700 hover:text-gray-900"
        >
          <FaStickyNote className="mr-2" />
          {orderNote ? "Edit order note" : "Add a note to your order"}
        </button>
        {showNoteInput && (
          <div className="mt-3">
            <textarea
              value={noteInput}
              onChange={(e) => {
                setNoteInput(e.target.value);
                setNoteSaved(false); // Reset saved state when typing
              }}
              placeholder="Add special instructions (e.g., gift wrap, delivery instructions)..."
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 transition"
              >
                Save Note
              </button>
              {noteSaved && (
                <p className="text-green-600 text-sm">✓ Note saved</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoAndNotes;
