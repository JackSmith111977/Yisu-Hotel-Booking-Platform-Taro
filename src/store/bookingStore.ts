import { create } from 'zustand'

export interface BookingItem {
  roomTypeId: number
  roomName: string
  price: number
  count: number
  images: string[]
  adultCount: number
  childCount: number
}

interface BookingStore {
  hotelId: number | null
  checkInDate: string
  checkOutDate: string
  nights: number
  items: BookingItem[]

  setContext: (hotelId: number, checkIn: string, checkOut: string, nights: number) => void
  setItems: (items: BookingItem[]) => void
  updateCount: (item: BookingItem, count: number) => void
  clearItems: () => void
  totalPrice: () => number
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  hotelId: null,
  checkInDate: '',
  checkOutDate: '',
  nights: 1,
  items: [],

  setContext: (hotelId, checkInDate, checkOutDate, nights) =>
    set({ hotelId, checkInDate, checkOutDate, nights }),

  setItems: (items) => set({ items }),

  updateCount: (item: BookingItem, count: number) =>
    set((state) => {
      const exists = state.items.find(i => i.roomTypeId === item.roomTypeId)
      if (count === 0) return { items: state.items.filter(i => i.roomTypeId !== item.roomTypeId) }
      if (exists) return { items: state.items.map(i => i.roomTypeId === item.roomTypeId ? { ...i, count } : i) }
      return { items: [...state.items, { ...item, count }] }
    }),

  clearItems: () => set({ items: [] }),

  totalPrice: () => {
    const { items, nights } = get()
    return items.reduce((sum, i) => sum + i.price * i.count * nights, 0)
  },
}))