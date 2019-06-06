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
        }
    }
}

function bufferEqual(buf1, buf2) {
    if (buf1.byteLength !== buf2.byteLength) return false;
    const dv1 = new Int8Array(buf1);
    const dv2 = new Int8Array(buf2);
    for (var i = 0; i !== buf1.byteLength; i++) {
        if (dv1[i] !== dv2[i]) return false;
    }
    return true;
}

module.exports = {
    getDefaultImports,
    bufferEqual
};