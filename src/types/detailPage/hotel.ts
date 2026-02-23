export interface HotelType {
    id: number;
    name_zh: string;
    name_en: string;
    address: string;
    star_rating: number;
    opening_date: string;
    contact_phone: string;
    image: string;
    status: string;
    merchant_id: string;
    updated_at: string;
    rejected_reason: string;
    region: string;
    album: string[];
    tags: string[];
}