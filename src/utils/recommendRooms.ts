import { callSupabase } from "./supabase";

export interface RoomType {
    id: number;
    hotel_id: number;
    name: string;
    price: number;
    max_guests: number;
    description: string;
    size: number;
    beds: { type: string; count: number }[];
  }
  
export interface AvailableRoom extends RoomType {
available_count: number;
}

export interface RecommendResult {
rooms: { room: AvailableRoom; count: number }[];
total_price: number;
is_fallback: boolean; // 是否是备选方案（非用户指定间数）
fallback_reason?: string; // 备选原因说明
}
  
export async function recommendRooms(
    hotelId: number,
    userRooms: number,   // 用户指定间数
    adults: number,
    children: number,
    checkIn: string,
    checkOut: string,
    nights: number = 1
): Promise<RecommendResult | null> {
const totalGuests = adults + children;
const guestsPerRoom = Math.ceil(totalGuests / userRooms); // 每间至少要住几人

// 1. 获取该酒店所有有效房型
const { data: roomTypes, error: e1 } = await callSupabase({
    action: "table",
    table: "room_types",
    method: "select",
    query: "*",
    params: {
        eq: { hotel_id: hotelId },
        gt: { max_guests: 0 },
    },
    });
if (e1 || !roomTypes) throw e1;

const roomIds: number[] = roomTypes.map((r: RoomType) => r.id);

// 2. 获取日期区间内可用库存
const { data: availability, error: e2 } = await callSupabase({
    action: "table",
    table: "room_availability",
    method: "select",
    query: "room_type_id,total_count,booked_count,date",
    params: {
        in: { room_type_id: `(${roomIds.join(",")})` },
        gte: { date: checkIn },
        lt: { date: checkOut },
    },
    });
if (e2) throw e2;

// 3. 计算每个房型整个入住区间的最小可用数
const availMap: Record<number, number> = {};
if (availability) {
    const grouped: Record<number, number[]> = {};
    for (const row of availability) {
    if (!grouped[row.room_type_id]) grouped[row.room_type_id] = [];
    grouped[row.room_type_id].push(row.total_count - row.booked_count);
    }
    for (const [rtId, counts] of Object.entries(grouped)) {
    availMap[Number(rtId)] = Math.min(...(counts as number[]));
    }
}

// 4. 组合可用房型，按价格升序
const availableRooms: AvailableRoom[] = roomTypes
    .map((r: RoomType) => ({ ...r, available_count: availMap[r.id] ?? 0 }))
    .filter((r: AvailableRoom) => r.available_count > 0)
    .sort((a: AvailableRoom, b: AvailableRoom) => a.price - b.price);

if (!availableRooms.length) return null;

// ── 策略一：严格按用户间数，每间能住 guestsPerRoom 人，找最便宜房型 ──
const exactMatch = availableRooms.find(
    (r) => r.max_guests >= guestsPerRoom && r.available_count >= userRooms
);

if (exactMatch) {
    return {
    rooms: [{ room: exactMatch, count: userRooms }],
    total_price: exactMatch.price * userRooms * nights,
    is_fallback: false,
    };
}

// ── 策略二：用户指定间数找不到，给出算法最优备选 ──
// 尝试用最少间数住下所有人，每间至少1成人
const fallback = findFallback(availableRooms, totalGuests, adults, nights);

if (!fallback) return null; // 完全住不下

const fallbackRoomCount = fallback.rooms.reduce((s, r) => s + r.count, 0);
const fallbackDesc = fallback.rooms
    .map(({ room, count }) => `${room.name} x${count}`)
    .join(" + ");

return {
    ...fallback,
    is_fallback: true,
    fallback_reason: `当前没有 ${userRooms} 间可满足人数的房型，为您推荐 ${fallbackRoomCount} 间：${fallbackDesc}`,
};
}

function findFallback(
rooms: AvailableRoom[],
totalGuests: number,
adults: number,
nights: number
): Omit<RecommendResult, "is_fallback" | "fallback_reason"> | null {
let remaining = totalGuests;
let remainingAdults = adults;
const chosen: { room: AvailableRoom; count: number }[] = [];
let totalPrice = 0;

for (const room of rooms) {
    if (remaining <= 0) break;
    if (room.available_count <= 0) continue;

    const needed = Math.min(
    Math.ceil(remaining / room.max_guests),
    remainingAdults,
    room.available_count
    );
    if (needed <= 0) continue;

    chosen.push({ room, count: needed });
    totalPrice += room.price * needed * nights;
    remaining -= room.max_guests * needed;
    remainingAdults -= needed;
}

if (remaining > 0) return null;
return { rooms: chosen, total_price: totalPrice };
}