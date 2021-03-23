import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productStock = await api.get(`/stock/${productId}`)
      
      const productInCart = cart.find((product) => product.id === productId);
      
      if (!productInCart) {
        if (productStock.data.amount > 0) {
          const productInformation = await api.get(`/products/${productId}`);
          const newProductOnCart = {...productInformation.data, amount: 1};
          const newCart = [...cart, newProductOnCart];

          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          toast.success('Adicionado');
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

      if (productInCart) {
        if (productStock.data.amount > productInCart.amount) {
          const updatedCart = cart.map(item => item.id === productInCart.id ? {
            ...item,
            amount: item.amount + 1
          } : item);
          
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
          toast.success('Adicionado');
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);

      if (!productInCart) {
        toast.error('Erro na remoção do produto');
      }

      if (productInCart) {
        if (productInCart.amount === 1) {
          const newCart = cart.filter((product) => product.id !== productInCart.id)
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = await api.get(`/stock/${productId}`);


      if (amount < 0) {
        toast.error('Erro na alteração de quantidade do produto');
      }

      if (amount > productStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }
      
      if (amount > 0 && amount < productStock.data.amount) {
        const productInCart = cart.find((product) => product.id === productId);
        
        if (!productInCart) {
          toast.error('Erro na alteração de quantidade do produto')
        }
  
        if (productInCart) {
          const updatedCart = cart.map(item => item.id === productInCart.id ? {
            ...item,
            amount: amount
          } : item);
  
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        }
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
