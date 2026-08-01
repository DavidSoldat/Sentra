import { create } from 'zustand';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!;
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!;

interface BillingState {
  paddle: Paddle | null;
  isInitializing: boolean;
  initPaddle: () => void;
  openUpgradeCheckout: (userId: number) => void;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  paddle: null,
  isInitializing: false,

  initPaddle: () => {
    if (get().paddle || get().isInitializing) return;
    set({ isInitializing: true });
    initializePaddle({
      environment: 'sandbox',
      token: CLIENT_TOKEN,
    }).then((instance) => {
      set({ paddle: instance ?? null, isInitializing: false });
    });
  },

  openUpgradeCheckout: (userId) => {
    const paddle = get().paddle;
    if (!paddle) {
      console.error('Paddle not initialized yet — cannot open checkout');
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: PRO_PRICE_ID, quantity: 1 }],
      customData: { userId: String(userId) },
    });
  },
}));
