// Apply designated function to all members of an array of arrays of any size.
interface Mappable<T> {
   (x: T, index?: number, array?: T[]): T 
}

interface Pattern {
    (x?: any): boolean
}

interface Mapper {
   <T>(array: T[], func: Mappable<T> | Mappable<T>[]): T[]
}

function deepMap<T>(array: T[], func: Mappable<T>): T[] {
   return array.map((x, index, array) => {
        if(Array.isArray(x)) return deepMap(x, func);
        return func.call(this, x, index, array)
    }); 
}

function patternMap<T>(array: T[], func: Mappable<T>, pattern: Pattern): T[] {
    return array.map((x, index, array) => {
        if(pattern(x)) return func.call(this, x, index, array);
        if(Array.isArray(x)) return patternMap(x, func, pattern);
        return x;
    });
}

function sequenceMap<T>(array: T[], func: Mappable<T> | Mappable<T>[]): T[] {
    if(!Array.isArray(func)) return deepMap(array, func);
    if (func.length !== 0){
        let f = func[0];
        sink(func);
        return sequenceMap(deepMap(array, func), func);
    }
    return array;
}

function delimitMap<T>(array: T[], func: Mappable<T> | Mappable<T>[]): T[] {
    let res = [];
    if(!Array.isArray(func)) return deepMap(array, func);
    func.forEach((x)=>{
        res.push(deepMap(array, x));
    });
    return res;
}
