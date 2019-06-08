/*
*
* Set - Model a mathematical set, no duplicates
*
* */

const set: Set<string> = new Set();

export function setAdd(x: string): void {
    set.add(x);
}

export function setHas(x: string): boolean {
    return set.has(x);
}

export function setSize(): i32 {
    return set.size
}

/*
*
* Map - Map unique keys of a type to values of a type
*
* */

const map = new Map<i32, string>();

export function mapSet(k: i32, v: string): void {
    map.set(k, v);
}

export function mapGet(k: i32): string {
    return map.get(k);
}

export function mapSize(): i32 {
    return map.size
}