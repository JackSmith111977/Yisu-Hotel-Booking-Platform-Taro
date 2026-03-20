export interface BedInfo {
  type: string;
  count: number;
}

export interface RoomType {
  id: number;
  hotel_id: number;
  name: string;
  price: number;
  quantity: number;
  size: number;
  description: string;
  max_guests: number;
  beds: BedInfo[];
  images: string[];
  facilities: string[];
}

export interface RoomGuest {
  rooms: number
  adults: number
  children: number
}