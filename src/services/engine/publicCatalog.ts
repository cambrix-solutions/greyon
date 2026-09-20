import { engineAPI } from "@/helpers/api";
import {
  mapEngineHotel,
  mapEngineLocation,
  mapEngineNews,
  mapEngineRatePlan,
  mapEngineRoomType,
  type EngineHotel,
  type EngineLocation,
  type EngineNews,
  type EngineRatePlan,
  type EngineRoomType
} from "@/services/engine/mappers";
import type {
  Hotel,
  Location,
  NewsArticle,
  RatePlan,
  RoomType
} from "@/types/greyon";

export type PublicCatalog = {
  locations: Location[];
  hotels: Hotel[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  news: NewsArticle[];
};

/** Published catalog for the marketing site (no auth). */
export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  const payload = await engineAPI.get<{
    locations: EngineLocation[];
    hotels: EngineHotel[];
    roomTypes: EngineRoomType[];
    ratePlans: EngineRatePlan[];
    news: EngineNews[];
  }>("/catalog");

  return {
    locations: (payload.locations ?? []).map(mapEngineLocation),
    hotels: (payload.hotels ?? []).map(mapEngineHotel),
    roomTypes: (payload.roomTypes ?? []).map(mapEngineRoomType),
    ratePlans: (payload.ratePlans ?? []).map(mapEngineRatePlan),
    news: (payload.news ?? []).map(mapEngineNews)
  };
}
