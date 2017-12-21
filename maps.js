const PS = require('./predicates');

function and(...predicates) {
 return predicates.reduce((acc, curr) => return acc && curr) 
}

// Apply designated function to all members of an array of arrays of any size.
function deepMap(array, fn, {pattern}) {
    return array.map(function mapper(member, ...rest) {
        if(guard(pattern(member, ...rest))) return;
        if(PS.arrayP(member)) return array.map(mapper(member, ...rest));
        return fn(member, ...rest);
    });
}

// DeepMap but only runs the specified function if the element matches the provided pattern 
// Pattern should be a predicate

function patternMap(array, fn, pattern) {
  return deepMap(array, fn, {pattern: pattern})  
}

function patternMap(array, func, pattern) { 
    return array.map((x, index, array) => {
        if(pattern(x)) return func.call(this, x, index, array);
        if(Array.isArray(x)) return patternMap(x, func, pattern);
        return null;
    });
}

// Apply functions to every memeber of @array from left to right. Applications are subsequent.
// Function 2 is applied to the map resulting from the application of function 1.
function sequenceMap(array, functions) {
    if (functions.length !== 0) {
        let func = functions[0];
        return sequenceMap(deepMap(array, func), functions.slice(1));
    }
    return array;
}

// Return an array thar contains the resultant maps of
// applying each function in @functions to @array separately and not sequentially.
function delimitMap(array, functions) {
    let res = [];
    functions.forEach((x)=>{
        res.push(deepMap(array, x));
    });
    return res;
}
