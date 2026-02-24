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
    userRooms: number,
    adults: number,
    children: number,
    checkIn: string,
    checkOut: string,
    nights: number = 1
): Promise<RecommendResult | null> {
    const totalGuests = adults + children;

    // 1. 获取房型
    const { data: roomTypes, error: e1 } = await callSupabase({
        action: "table",
        table: "room_types",
        method: "select",
        query: "*",
        params: { eq: { hotel_id: hotelId }, gt: { max_guests: 0 } },
    });
    if (e1 || !roomTypes) throw e1;

    const roomIds: number[] = roomTypes.map((r: RoomType) => r.id);

    // 2. 获取可用库存
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

    // 3. 计算每个房型在整个入住区间的最小可用数
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

    // 4. 构建可用房型列表
    const availableRooms: AvailableRoom[] = roomTypes
        .map((r: RoomType) => ({ ...r, available_count: availMap[r.id] ?? 0 }))
        .filter((r: AvailableRoom) => r.available_count > 0)
        .sort((a: AvailableRoom, b: AvailableRoom) => a.price - b.price);

    if (!availableRooms.length) return null;

    // ── 阶段一：枚举恰好 userRooms 间的最低价组合 ──
    const exactResult = findCheapestCombination(
        availableRooms,
        userRooms,
        totalGuests,
        nights
    );

    if (exactResult) {
        return { ...exactResult, is_fallback: false };
    }

    // ── 阶段二：放开间数限制，性价比贪心 ──
    const fallback = findFallbackByValue(availableRooms, totalGuests, nights);
    if (!fallback) return null;

    const fallbackRoomCount = fallback.rooms.reduce((s, r) => s + r.count, 0);
    const fallbackDesc = fallback.rooms
        .map(({ room, count }) => `${room.name} x${count}`)
        .join(" + ");

    return {
        ...fallback,
        is_fallback: true,
        fallback_reason: `当前库存无法凑出 ${userRooms} 间满足人数的组合，为您推荐 ${fallbackRoomCount} 间：${fallbackDesc}`,
    };
}


/**
 * 阶段一：DFS 枚举恰好 targetRooms 间的所有组合，返回能住下所有人中总价最低的
 */
function findCheapestCombination(
    rooms: AvailableRoom[],
    targetRooms: number,
    totalGuests: number,
    nights: number
): Omit<RecommendResult, "is_fallback" | "fallback_reason"> | null {
    let best: { rooms: { room: AvailableRoom; count: number }[]; total_price: number } | null = null;

    function dfs(
        index: number,
        roomsLeft: number,
        capacityLeft: number,
        currentRooms: { room: AvailableRoom; count: number }[],
        currentPrice: number
    ) {
        // 剪枝：当前价格已超过最优解
        if (best && currentPrice >= best.total_price) return;

        // 终止：间数已用完
        if (roomsLeft === 0) {
            if (capacityLeft <= 0) {
                // 所有人住得下，记录最优
                best = {
                    rooms: currentRooms.map((r) => ({ ...r })),
                    total_price: currentPrice,
                };
            }
            return;
        }

        // 剪枝：即使剩余所有房型全选最大容量也住不下
        // （这里简单估算：剩余可选房型中最大 max_guests * roomsLeft）
        if (index >= rooms.length) return;

        const maxPossibleCapacity = rooms
            .slice(index)
            .reduce((sum, r) => sum + r.max_guests * Math.min(r.available_count, roomsLeft), 0);
        if (maxPossibleCapacity < capacityLeft) return;

        // 枚举第 index 个房型选 count 间（0 到 min(available, roomsLeft)）
        const room = rooms[index];
        const maxCount = Math.min(room.available_count, roomsLeft);

        for (let count = maxCount; count >= 0; count--) {
            const newRooms =
                count > 0
                    ? [...currentRooms, { room, count }]
                    : currentRooms;

            dfs(
                index + 1,
                roomsLeft - count,
                capacityLeft - room.max_guests * count,
                newRooms,
                currentPrice + room.price * count * nights
            );
        }
    }

    dfs(0, targetRooms, totalGuests, [], 0);
    return best;
}


/**
 * 阶段二：不限间数，按性价比（price/max_guests）贪心，找能住下所有人的最低价组合
 */
function findFallbackByValue(
    rooms: AvailableRoom[],
    totalGuests: number,
    nights: number
): Omit<RecommendResult, "is_fallback" | "fallback_reason"> | null {
    // 按每人均摊价格升序
    const sorted = [...rooms].sort(
        (a, b) => a.price / a.max_guests - b.price / b.max_guests
    );

    let remaining = totalGuests;
    const chosen: { room: AvailableRoom; count: number }[] = [];
    let totalPrice = 0;

    for (const room of sorted) {
        if (remaining <= 0) break;
        const needed = Math.min(
            Math.ceil(remaining / room.max_guests),
            room.available_count
        );
        if (needed <= 0) continue;
        chosen.push({ room, count: needed });
        totalPrice += room.price * needed * nights;
        remaining -= room.max_guests * needed;
    }

    if (remaining > 0) return null;
    return { rooms: chosen, total_price: totalPrice };
}