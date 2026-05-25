export const STAT_TOTAL = 50;
export const STAT_MIN = 5;
export const BASE_HP = 100;

export type Fighter = {
  name: string;
  hp: number;
  maxHp: number;
  a: number;
  b: number;
  s: number;
  t: number;
  baseA: number;
  baseB: number;
  baseS: number;
  ct_strong: number;
  reflecting: number;
  lockedMove: null;
};

export type MoveChoice = any;
export type TurnMessage = { id: string; text: string; kind: string };

export function makeInitialFighter(
  id: string,
  name: string,
  hp: number,
  a: number,
  b: number,
  s: number,
  t: number
): Fighter {
  return {
    name,
    hp: BASE_HP + hp,
    maxHp: BASE_HP + hp,
    a,
    b,
    s,
    t,
    baseA: a,
    baseB: b,
    baseS: s,
    ct_strong: 0,
    reflecting: 0,
    lockedMove: null,
  };
}

export function processTurn() {
  return {
    fighterA: arguments[0],
    fighterB: arguments[1],
    fighterAAfterPhase1: arguments[0],
    fighterBAfterPhase1: arguments[1],
    firstId: "A",
    firstMessages: [],
    secondMessages: [],
    winner: null,
    isDraw: false,
    winnerAfterPhase1: null,
    isDrawAfterPhase1: false,
  };
}