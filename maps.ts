interface Mappable<T> {
    (x: T, index?: number, array?: T[]): T,
}

interface Pattern {
    (x?: any): boolean
}

function _sink<T>(array: T[]) {
    array.reverse();
    array.pop();
    array.reverse();
}

// Apply designated function to all members of an array of arrays of any size.
function deepMap<T>(array: T[], func: Mappable<T>): T[] {
   return array.map((x, index, array) => {
        if(Array.isArray(x)) return deepMap(x, func);
        return func.call(this, x, index, array)
    }); 
}

// DeepMap but only runs the specified function if the element matches the provided pattern 
// Pattern should be a function that returns a Boolean and is passed as func[1]
function patternMap<T>(array: T[], func: Mappable<T>, pattern: Pattern): T[] {
    return array.map((x, index, array) => {
        if(pattern(x)) return func.call(this, x, index, array);
        if(Array.isArray(x)) return patternMap(x, func, pattern);
        return x;
    });
}

// Apply functions to every memeber of @array from left to right. Applications are subsequent.
// Function 2 is applied to the map resulting from the application of function 1.
function sequenceMap<T>(array: T[], func: Mappable<T>[] | Mappable<T>): T[] {
    if(!Array.isArray(func)) return deepMap(array, func);
    if (func.length !== 0){
        let f = func[0];
        _sink(func);
        return sequenceMap(deepMap(array, f), func);
    }
    return array;
}

//Return an array thar contains the resultant maps of Applying each function in @functions to @array separately and not sequentially.
function delimitMap<T>(array: T[], func: Mappable<T>[] | Mappable<T>): T[] {
    let res = [];
    if(!Array.isArray(func)) return deepMap(array, func);
    func.forEach((x)=>{
        res.push(deepMap(array, x));
    });
    return res;
}
