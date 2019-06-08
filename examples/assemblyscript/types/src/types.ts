//export the runtime ID of Int32Array, required to pass in Arrays from outside
export const INT32ARRAY = idof<Int32Array>();
/*
*
* Booleans
*
* */
export function getTrue(): bool {
    return true;
}

export function getFalse(): bool {
    return false;
}

export function echoBoolean(x: bool): bool {
    return x;
}

export function negate(x: bool): bool {
    return !x;
}

export function or(x: bool, y: bool): bool {
    return x || y;
}

/*
*
* Integers
*
* */
export function add(x: i32, y: i32): i32 {
    return x + y;
}

/*
*
* Floating Point Numbers
*
* NOTE: the f64 64 Bit floating point number is required as a return to match JS precision
* Otherwise you will get something like 1.0010000467300415 when you are expecting 1.001
*
* */

export function getFloat(): f64 {
    return 1.001
}

export function addFloats(a: f64, b: f64): f64 {
    return a + b
}

/*
*
* Strings
*
* */
export function getString(): string {
    return "It's Alive!!!"
}

export function getExcitingString(message: string): string {
    return message + "!"
}

export function concat(a: string, b: string): string {
    return a + b
}

/*
*
* Arrays
*
* */

export function getIntArray(): Int8Array {
    let arr = new Int8Array(5);
    arr[0] = 1;
    arr[1] = 1;
    arr[2] = 3;
    arr[3] = 5;
    arr[4] = 8;
    return arr;
}

export function getLength(arr: Int32Array): i32 {
    return arr.length;
}