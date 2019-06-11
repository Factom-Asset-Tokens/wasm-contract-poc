function getDefaultImports() {
    const memory = new WebAssembly.Memory({initial: 256, maximum: 256});
    return {
        env: {
            abortStackOverflow: () => {
                throw new Error('overflow');
            },
            table: new WebAssembly.Table({initial: 0, maximum: 0, element: 'anyfunc'}),
            __table_base: 0,
            memory: memory,
            __memory_base: 1024,
            STACKTOP: 0,
            STACK_MAX: memory.buffer.byteLength,
            abort: function (a) {
                if (a) console.error('ABORT:', a);
                else console.log('ABORT');
            }
        }
    }
}

function bufferEqual(buf0, buf1) {
    if (buf0.byteLength !== buf1.byteLength) return false;
    const dv1 = new Int8Array(buf0);
    const dv2 = new Int8Array(buf1);
    for (let i = 0; i !== buf0.byteLength; i++) {
        if (dv1[i] !== dv2[i]) return false;
    }
    return true;
}

//read a string from memory given a pointer
function readString(mem, ptr) {
    let s = "";
    for (let i = ptr; mem[i]; i++) {
        s += String.fromCharCode(mem[i]);
    }
    return s;
}

//write a string into memory given a pointer
function writeString(mem, str, ptr) {
    const strBuf = Buffer.from(str);
    const outBuf = new Uint8Array(mem.buffer, ptr, strBuf.length);
    for (let i = 0; i < strBuf.length; i++) {
        outBuf[i] = strBuf[i];
    }
}

module.exports = {
    getDefaultImports,
    bufferEqual,
    readString,
    writeString
};