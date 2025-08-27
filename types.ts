export type RoomState = {
  hopeByPlayer: Record<string, number>;
  fear: number;
  log: { t: number; by: string; text: string }[];
  cards: Card[];
  tokenCards?: Record<string, string[]>; // itemId -> cardIds
};

export type Card = {
  id: string;
  title: string;
  text: string;
  tags?: string[];
};
