/* eslint-disable @typescript-eslint/no-explicit-any */
import { adaptProductForDb } from "@/adapters/products";
import { useAppSelector } from "@/hooks/useUserData";
import { createProduct, getProductsByName } from "@/service/products";
import type { Product } from "@/types/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { emptyProduct } from "./emptyFormData";

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
  const [error, setError] = useState(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { role } = useAppSelector((state) => state.user);

  const fetchProducts = useCallback(
    async (searchValue: string) => {
      if (!searchValue) {
        setOptions([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await getProductsByName(searchValue, role);

        setOptions(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [role]
  );

  const debouncedFetchMicroOrganisms = useMemo(
    () => debounce(fetchProducts, 300),
    [fetchProducts]
  );

  useEffect(() => {
    if (inputValue) {
      debouncedFetchMicroOrganisms(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetchMicroOrganisms]);

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

  const queryClient = useQueryClient();

  const handleSelectProduct = (newProduct: Product) => {
    onChange(newProduct);
    setIsOpen(false);
    setInputValue("");
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: { completedInformation: any }) => {
      console.log("Creating product with data:", data);
      return await createProduct(data.completedInformation, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      console.log(data);
      handleSelectProduct(data);
      // setIsModalOpen(false);
      // toast("Producto creado exitosamente", {
      //   description: "El producto ha sido creado correctamente.",
      //   action: {
      //     label: "Undo",
      //     onClick: () => console.log("Undo"),
      //   },
      // });
      // setFormData(emptyProduct);
    },
    onError: () => {
      toast("Error al crear el producto", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const handleCreateProduct = (productName: string) => {
    const completedInformation = adaptProductForDb({
      ...emptyProduct,
      lot_control: true,
      product_name: productName,
    });

    createProductMutation.mutate({
      completedInformation,
    });
  };

  const isSearchValueNumeric = /^\d+$/.test(inputValue.trim());

  return (
    <div className="relative w-full  inline-flex" ref={comboboxRef}>
      <button
        onClick={handleComboboxToggle}
        disabled={createProductMutation.isLoading}
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
              disabled={createProductMutation.isPending}
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
            ) : error ? (
              <li className="relative px-3 py-2 text-destructive cursor-default select-none hover:bg-muted focus:bg-muted">
                {error}
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
