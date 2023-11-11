
export class CustomIterableIterator<T, Parent, CacheType> implements IterableIterator<T> {
    index = 0;

    constructor(
        public parent: Parent,
        public nextF: (index: number, p: Parent, ito: CustomIterableIterator<T, Parent, CacheType>) => IteratorResult<T>,
        public cache: CacheType,
    ) {
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    next(...args: [] | [undefined]): IteratorResult<T> {
        const r = this.nextF(
            this.index,
            this.parent,
            this
        );
        ++this.index;
        return r;
    }
}

export abstract class CustomReadonlyMapHelper<K, V> implements ReadonlyMap<K, V> {

    abstract get size(): number;

    abstract get(key: K): V | undefined;

    abstract has(key: K): boolean;

    /**
     * this impl must be O(1) , never more than O(n)
     */
    abstract entries(): IterableIterator<[K, V]>;

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    }

    forEach(callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void {
        for (const nn of this.entries()) {
            callback(this.get(nn[0])!, nn[0], this);
        }
    }

    keys(): IterableIterator<K> {
        return new CustomIterableIterator<K, typeof this, [K, V][]>(
            this,
            (index, p, ito) => {
                return {
                    done: index >= this.size,
                    value: ito.cache[index]?.[0],
                };
            },
            Array.from(this.entries()),
        );
    }

    values(): IterableIterator<V> {
        return new CustomIterableIterator<V, typeof this, [K, V][]>(
            this,
            (index, p, ito) => {
                return {
                    done: index >= this.size,
                    value: ito.cache[index]?.[1],
                };
            },
            Array.from(this.entries()),
        );
    }

}
