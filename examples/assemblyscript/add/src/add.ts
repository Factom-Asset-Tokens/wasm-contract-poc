/*
Here you can declare variables and set up your contract
*/

export function add(x: i32, y: i32): i32 {
    return x + y;
}

let running: i32;

export function addRunning(x: i32): i32 {
    running += x;
    return running;
}