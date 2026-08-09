import { create } from 'zustand';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { useAuthStore } from './useAuthStore';

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!;
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!;

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8;

interface BillingState {
  paddle: Paddle | null;
  isInitializing: boolean;
  upgradeStatus: 'idle' | 'processing' | 'confirmed' | 'timed_out';
  initPaddle: () => void;
  openUpgradeCheckout: (userId: number) => void;
  resetUpgradeStatus: () => void;
  _handleCheckoutCompleted: () => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  paddle: null,
  isInitializing: false,
  upgradeStatus: 'idle',

  initPaddle: () => {
    if (get().paddle || get().isInitializing) return;
    set({ isInitializing: true });
    initializePaddle({
      environment: 'sandbox',
      token: CLIENT_TOKEN,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          get()._handleCheckoutCompleted();
        }
      },
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
    if (useAuthStore.getState().user?.tier === 'PRO') {
      console.warn('User is already Pro — refusing to open checkout again');
      return;
    }
    set({ upgradeStatus: 'idle' });
    paddle.Checkout.open({
      items: [{ priceId: PRO_PRICE_ID, quantity: 1 }],
      customData: { userId: String(userId) },
    });
  },

  resetUpgradeStatus: () => set({ upgradeStatus: 'idle' }),

  _handleCheckoutCompleted: async () => {
    set({ upgradeStatus: 'processing' });
    const checkAuth = useAuthStore.getState().checkAuth;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      await checkAuth();
      if (useAuthStore.getState().user?.tier === 'PRO') {
        set({ upgradeStatus: 'confirmed' });
        return;
      }
    }

    set({ upgradeStatus: 'timed_out' });
  },
}));
