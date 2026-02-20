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

export interface RoomAvailability {
  room_type_id: number;
  date: string;
  total_count: number;
  booked_count: number;
}

export interface RoomGuest {
  rooms: number
  adults: number
  children: number
}