/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppSelector } from "@/hooks/useUserData";
import { getAllProducts } from "@/service/products";
import type { Product } from "@/types/products";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";

const ProductSelector = ({
  value,
  onChange,
}: {
  value: Product;
  onChange: (value: Product) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value.product_name || "");
  const [options, setOptions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { role } = useAppSelector((state) => state.user);

  const storeId = localStorage.getItem("selectedStore") || "";

  const fetchAllProducts = useCallback(
    async () => {
      setIsSearching(true);

      try {
        const data = await getAllProducts(role);
        setAllProducts(data.products);
        const filteredProductByStore = data?.products?.filter((product) =>
          product?.lots?.filter((lot) => {
            return lot.stock?.some(
              (s) => s.stock_type === "STORE" && s.store_id === Number(storeId)
            )
          })
        );
        console.log("Filtered Products by Store:", filteredProductByStore);
        setOptions(filteredProductByStore);
      } catch (err) {
        console.error("Error fetching products:", err);
        setAllProducts([]);
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [role]
  );

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (inputValue) {
      const isNumeric = /^\d+$/.test(inputValue.trim());
      let filtered: Product[] = [];

      if (isNumeric) {
        const numValue = parseInt(inputValue.trim());
        filtered = allProducts.filter(p => p.short_code === numValue);
      } else {
        filtered = allProducts.filter(p =>
          p.product_name.toLowerCase().includes(inputValue.toLowerCase())
        );
      }
      setOptions(filtered);
    } else {
      setOptions(allProducts);
    }
  }, [inputValue, allProducts]);

  const handleInputChange = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleComboboxToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus the input field when opening the combobox
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };


  return (
    <div className="relative w-full  inline-flex" ref={comboboxRef}>
      <button
        onClick={handleComboboxToggle}
        className={`flex items-center justify-between border-none w-full h-10 px-3 py-2 text-sm text-left border-2 border-newDsBorder  text-newDsForeground rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-200   `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-black">
          {value.product_name || "Codigo corto o nombre..."}
        </span>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border-none rounded-md shadow-lg transition-all duration-200 ease-in-out opacity-100 scale-100 origin-top">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              placeholder="Buscar por codigo o por nombre..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1 text-base" role="listbox">
            {isSearching ? (
              <li className="relative px-3 py-2 text-muted-foreground cursor-default select-none flex items-center hover:bg-muted focus:bg-muted">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </li>
            ) : options.length === 0 ? (
              <>
                <li className="relative px-3 py-2 text-muted-foreground cursor-default select-none hover:bg-muted focus:bg-muted">
                  No se encontraron resultados
                </li>
                {/* <li
                  className={` ${inputValue && !isSearchValueNumeric ? "flex" : "hidden"
                    } relative px-3 py-2 text-muted-foreground select-none hover:bg-muted focus:bg-muted`}
                >
                  <button
                    onClick={() => {
                      handleCreateProduct(inputValue);
                    }}
                    disabled={!inputValue || createProductMutation.isLoading}
                    className={` flex
                     cursor-pointer  gap-2 items-center `}
                  >
                    {createProductMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Agregando {inputValue}</span>
                      </>
                    ) : (
                      `Agregar "${inputValue}" como nombre de un nuevo producto`
                    )}
                  </button>
                </li> */}
              </>
            ) : (
              options.map((option) => (
                <li
                  key={option.product_id}
                  className="relative px-3 py-2 cursor-pointer select-none transition-colors duration-200 hover:bg-muted focus:bg-muted text-popover-foreground"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setInputValue("");
                  }}
                >
                  <span className="block truncate">{option.product_name}</span>
                  {value === option && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-newDsForeground">
                      <Check className="w-5 h-5" />
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
