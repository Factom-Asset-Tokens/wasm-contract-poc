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

module.exports = {
    getDefaultImports
};