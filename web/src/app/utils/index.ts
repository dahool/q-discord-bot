function hasKeyWithComparator<Y, Z>(map: Map<Z, Y>, key: Z, compare: ((a: Z, b: Z) => boolean)): boolean {
	for (let k of map.keys()) {
		if (compare(key, k)) return true;
	}
	return false;
}

export function GroupBy<T, K extends keyof T, X>(array: T[], key: K | ((arg: T) => X), comparator?: ((a: X, b: X) => boolean)): Map<T[K] | X, T[]> {
	let map = new Map<T[K] | X, T[]>();

	let keyGetter: Function;
	if (typeof key === 'function') {
		keyGetter = key;
	} else {
		keyGetter = (item: T) => item[key];
	}
	let compare: Function;
	if (comparator == undefined) {
		compare = (a: any, b: any) => a === b;
	} else {
		compare = comparator;
	}
	let hasKey: Function;
	if (comparator == undefined) {
		hasKey = (m: Map<T[K], T[]>, k: any, d: any) => map.has(k);
	} else {
		hasKey = hasKeyWithComparator
	}
	array.forEach(item => {
		let itemKey = keyGetter(item);
		if (!hasKey(map, itemKey, compare)) {
			map.set(itemKey, array.filter(i => compare(keyGetter(i), itemKey)));
		}
	});
	return map;
}


