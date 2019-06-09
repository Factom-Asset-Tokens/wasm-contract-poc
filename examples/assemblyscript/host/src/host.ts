//declare the namespace from our host exported functionality constants
declare const count: i32;

declare function add(x: i32, y: i32): i32;

declare function message(): string;

//return a count constant from the host
export function getHostCount(): i32 {
    return count;
}

//do some addition on the host
export function getHostAdd(x: i32, y: i32): i32 {
    return add(x, y);
}

//get a message from the host
export function getHostMessage(): string {
    return message();
}
