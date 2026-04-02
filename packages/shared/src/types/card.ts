export enum CardType {
  DUKE = "DUKE",
  ASSASSIN = "ASSASSIN",
  CAPTAIN = "CAPTAIN",
  AMBASSADOR = "AMBASSADOR",
  CONTESSA = "CONTESSA",
}

export interface Card {
  type: CardType
  revealed: boolean
}
