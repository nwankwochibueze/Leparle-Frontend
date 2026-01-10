// src/components/Accordion.tsx
import { useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  showBorder?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  showBorder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
  className={`mt-2 ${showBorder ? "border-b border-gray-300" : ""} w-full`}
>
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="flex justify-between items-center w-full text-left py-6"
  >
    <h2 className="text-base font-regular">{title}</h2>
    <span className="text-xl">{isOpen ? <FiMinus /> : <FiPlus />}</span>
  </button>

  {isOpen && (
    <div className="text-gray-700 text-sm pb-4 px-1">
      {children}
    </div>
  )}
</div>

  );
};

export default Accordion;
