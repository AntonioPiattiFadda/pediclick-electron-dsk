/* eslint-disable @typescript-eslint/no-explicit-any */
import { adaptProductForDb } from "@/adapters/products";
import { createProduct, getProductsByName } from "@/service/products";
import type { Product } from "@/types/products";
import { sliceLongNames } from "@/utils";
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
import { emptyProduct } from "../emptyFormData";

const ProductSelector = ({
  disabled,
  value,
  onChange,
  withLots = false,
  focusRef
}: {
  value: Partial<Product>;
  disabled?: boolean;
  onChange: (value: Partial<Product>) => void;
  withLots?: boolean;
  focusRef?: React.RefObject<HTMLInputElement>;
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value.product_name || "");
  const [shortCode, setShortCode] = useState<number | null>(value.short_code || null);
  const [options, setOptions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Evitar disparar si ya estamos escribiendo en un input
  //     const target = e.target as HTMLElement;
  //     if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

  //     if (e.key === "+") {
  //       e.preventDefault();

  //       if (disabled) return;
  //       console.log("Abrir selector de producto", shortCodeInputRef.current);
  //       requestAnimationFrame(() => {
  //         console.log("FOCUS REF:", shortCodeInputRef.current);
  //         shortCodeInputRef.current?.focus();
  //         shortCodeInputRef.current?.select();
  //       });


  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, []);

  const fetchProducts = useCallback(
    async (searchValue: string) => {
      if (!searchValue) {
        setOptions([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await getProductsByName(searchValue, withLots);

        setOptions(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [withLots]
  );

  const fetchProductsByCode = useCallback(
    async (shortCode: number) => {
      if (!shortCode) {
        setOptions([]);
        return;
      }
      setIsSearching(true);
      setError(null);
      try {
        const data = await getProductsByName(shortCode.toString(), withLots);

        if (data.products.length === 1) {
          onChange(data.products[0]);
          setIsOpen(false);
          setInputValue("");
          setIsSearching(false);
          return;
        } else {
          setIsSearching(false);
          toast("No se encontró ningún producto con el código: " + shortCode, { icon: "⚠️" });
        }

        setOptions(data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
        // setError(err.message || "Failed to fetch products.");
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [withLots]
  );

  const debouncedFetchProducts = useMemo(
    () => debounce(fetchProducts, 300),
    [fetchProducts]
  );

  const debouncedFetchProductsByCode = useMemo(
    () => debounce(fetchProductsByCode, 300),
    [fetchProductsByCode]
  );

  useEffect(() => {
    if (shortCode) {
      debouncedFetchProductsByCode(shortCode);
    } else {
      setOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode, debouncedFetchProducts]);

  useEffect(() => {
    if (inputValue) {
      debouncedFetchProducts(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetchProducts]);

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
      return await createProduct(data.completedInformation);
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

  // const isSearchExactMatch = options.some(
  //   (option) =>
  //     option.product_name.toLowerCase() === inputValue.trim().toLowerCase()
  // );

  const productValue = value.short_code ? `${value.short_code} - ${value.product_name}` : value.product_name;

  const formattedProductName = sliceLongNames(27, productValue);


  return (
    <div className="relative w-full  inline-flex  border border-gray-200 rounded-md h-9 " ref={comboboxRef}>

      <input
        className={`border-none h-9 w-14 rounded-lg px-3 text-sm text-center`}
        type="number"
        value={shortCode ?? undefined}
        ref={focusRef}
        placeholder="--"
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          setShortCode(val === '' ? null : Number(val));
          // handleCodeMatch(Number(val));
        }}
      />
      <button
        onClick={handleComboboxToggle}
        disabled={createProductMutation.isPending || disabled}
        className={`flex items-center justify-between border-none w-full  px-3 text-sm text-left border-2 border-newDsBorder  text-newDsForeground rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors duration-200  ${disabled ? 'cursor-not-allowed' : ''} `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-black">
          {isSearching ? "Buscando..." : formattedProductName || "Seleccionar producto"}

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  // Si hay resultados, seleccionamos el primero
                  if (options.length > 0) {
                    handleSelectProduct(options[0]);
                  } else if (!isSearchValueNumeric && inputValue.trim()) {
                    // Si no hay resultados y no es un valor numérico, creamos el producto
                    handleCreateProduct(inputValue.trim());
                  } else {
                    toast("No se encontró ningún producto con ese nombre o código.");
                  }
                }
              }}
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
                  className={` ${(inputValue && !isSearchValueNumeric && !isSearching) ? "flex" : "hidden"
                    } relative px-3 py-2 text-muted-foreground select-none hover:bg-muted focus:bg-muted`}
                >
                  <button
                    onClick={() => {
                      handleCreateProduct(inputValue);
                    }}
                    disabled={!inputValue || createProductMutation.isPending}
                    className={` flex
                     cursor-pointer  gap-2 items-center `}
                  >
                    {createProductMutation.isPending ? (
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
                <>
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
                    <span className="block truncate">{`${option.short_code ?? ''} ${option.short_code ? '-' : ''} ${option.product_name}`}</span>
                    {value === option && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-newDsForeground">
                        <Check className="w-5 h-5" />
                      </span>
                    )}
                  </li>

                </>
              ))



            )}

            {/* <li
              className={` ${(!isSearchExactMatch && !isSearchValueNumeric && inputValue) ? "flex" : "hidden"
                } relative px-3 py-2 text-muted-foreground select-none hover:bg-muted focus:bg-muted`}
            >
              <button
                onClick={() => {
                  handleCreateProduct(inputValue);
                }}
                disabled={!inputValue || createProductMutation.isPending}
                className={` flex
                     cursor-pointer  gap-2 items-center `}
              >
                {createProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Agregando {inputValue}</span>
                  </>
                ) : (
                  `Agregar "${inputValue}" como nombre de un nuevo producto`
                )}
              </button>
            </li> */}

          </ul>
        </div>
      )
      }
    </div >
  );
};

export default ProductSelector;
