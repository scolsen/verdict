// Apply designated function to all members of an array of arrays of any size.
function deepMap(array, func){
    return array.map((x, index, array)=>{
        if(Array.isArray(x)) return deep_map(x, func);
        return func.call(this, x, index, array);
    });
}

// DeepMap but only runs the specified function if the element matches the provided pattern 
// Pattern should be a function that returns a Boolean and is passed as func[1]
function patternMap(array, func, pattern){
    if(typeof (pattern) !== 'function') throw new TypeError();
    return array.map((x, index, array)=>{
        if(pattern(x)) return func(x, index, array);
        if(Array.isArray(x)) return pattern_map(x, func, pattern);
        return null;
    });
}
// Apply functions to every memeber of @array from left to right. Applications are subsequent.
// Function 2 is applied to the map resulting from the application of function 1.
function sequenceMap(array, functions){
    if(Array.isArray(functions)) functions = arrize(arguments, 1);
    if (functions.length !== 0){
        let func = functions[0];
        sink(functions);
        return sequence_map(deep_map(array, func), functions);
    }
    return array;
}

/**
 * Return an array thar contains the resultant maps of
 * Applying each function in @functions to @array
 * separately and not sequentially.
 * @param array
 * @param functions
 * @returns {Array}
 */
function delimitMap(array, functions){
    let res = [];
    if(!Array.isArray(functions)) functions = arrize(arguments, 1);
    functions.forEach((x)=>{
        res.push(deep_map(array, x));
    });
    return res;
}
