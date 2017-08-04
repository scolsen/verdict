/**
 * Created by scottolsen on 7/29/17.
 * verdict.js
 */

const presets = require('./presets');

//Criteria//

/** Returns a truth mapping of all the items in an array.
* Based on the return of some arbitrary function  which should contain a test.
* Non truth values are wrapped in Boolean to convert to truth values.
* Fn should be of form (x)=>{return x == 'string'} or some other test.
 */
function criterion(array, fn){
    return deep_map(array,(x, index, array)=>{return Boolean(fn(x, index, array));});
}
/** Specify multiple criterion array elements must match.
 * Specify a mode to combine the truth array results of each criterion.
 * Combine values of each truth array using the specified modeCallback (and || or)
 * Functions should be provided as an array of criterion. (anonymous or named)
 * Note, due to argument shadowing because of function returns(?) more than one function
 * must be wrapped in an array. The function also supports passing a single function outside of the array
 * However subsequent arguments will be ignored.
 * If wrap is true, return an object
 */
function criteria(array, functions, wrap){
    if(!Array.isArray(functions)) functions = arrize(arguments, 1);
    let res = [];
    functions.forEach((x)=>{res.push(criterion(array, x));});
    if(wrap === true) {
        let obj = {};
        functions.map((x, index)=>{
            obj[index] = {};
            obj[index].criterion = x;
            obj[index].result = res[index];
        });
        return obj;
    }
    return res;
}

//Deep//

/**
 * deep_map. Apply designated function to all members
 * Of an array of arrays of any size.
 * Supplied function should have signature:
 * func(x, index, array)
 */
function deep_map(array, func){
    return array.map((x, index, array)=>{
        if(Array.isArray(x)) return deep_map(x, func);
        return func(x, index, array);
    });
}

/**
 * Deep_map but only runs the specified function if
 * the element matches the provided pattern which is
 * a function that returns a Boolean and is passed as
 * func[1]
 * @param array
 * @param func
 * @returns {*|Array|{}}
 */
function pattern_map(array, func){
    return array.map((x, index, array)=>{
        if(func[1](x)) func[0](x, index, array);
        if(Array.isArray(x)) return pattern_map(x, func);
        return null;
    });
}

/**
 * Filter contents and retain structure
 * @param array
 * @param filterFunction
 */
function deep_filter(array, filterFunction){
    array.map((x, index, array)=>{
        if(Array.isArray(x)) array[index] = deep_filter(x, filterFunction);
    });
    return array.filter(filterFunction);
}

/**
 * Locate indexes and retain structure
 * @param array
 * @param criteriaFunctions
 * @returns {Array.<T>|*}
 */
function deep_locate(array, criteriaFunctions){
    function mapper (x, index, array){
            if(x) return index;
    }
    return deep_filter(deep_map(criteria(array, criteriaFunctions), mapper), (x)=>{return x !== undefined});
}

function deep_flatten(locateIndexes){
    let flat = [];
    locateIndexes.forEach((x)=>{return x.map((x)=>{if (!flat.includes(x)) flat.push(x)})});
    return flat;
}

/**
 * Retrieve deeply--also returns the members of nested
 * arrays that satisfy the given criteria
 */
function deep_retrieve(array, criteriaFunctions, fulfillmentMethod){
let fulfillment = fulfillmentMethod(array, criteriaFunctions);
    return filter_out(array.map((x, index)=>{
        if (fulfillment.includes(index)) return x;
    }), (x)=>{return x === undefined});
}


/**
 * Convert arguments to an array, starting from the specified position
 */
function arrize(args, startPos){
    return Array.from(args).slice(startPos);
}

/** Expects an array of truth values.
 * Returns an array containing the opposite value of each.
 * Optionally first generates the array of T values with a criterion.
 */
function not(){
    return (x)=>{return !x};
}

/** Reduce the contents of a truth array by applying or
 * To each value successively
 */
function or_fold(array){
    return array.reduce((x, y)=>{return x || y});
}

/**
/* Collapse an array of truth arrays into a single array
/* of the specified truth values.
/* Returns the result of subsequently resolving each truth value
/* using the specified combination method.
/* e.g [[t,f],[t,f],[,f,f], or_map]
/* => [[t,f],[f,f]]
/* => [t,f]
/* using the method provided as combinatorMethod.
/* method must be a map (and_map, or_map)
 */
function collapse(arrays, combinatorMethod){
    let res = [];
    arrays.reverse();
    for(let i = arrays.length; i > 0; i--){
        res.push(combinatorMethod(arrays.pop(), arrays.pop()));
    }
    if(filter_out(res, is_undefined()).length > 1) {
        return collapse(filter_out(res, is_undefined()), combinatorMethod);
    } else {
        return filter_out(res, is_undefined())[0];
    }
}

/**
 * filter out all elements matching a given filter.
 * Return the resulting array.
 */
function filter_out(array, criterionFn){
    let res = [];
    let indexes = flatten(locate(array, criterionFn));
    array.map((x, index)=>{if(!indexes.includes(index)) res.push(x);});
    return res;
}

/**
 * Given two arrays map their values using OR.
 * Arrays must have the same cardinality.
 * note we cannot use lambda here as we need to make use of this.
 * In the case a second Array is not provided, return x.
 */
function or_map(arrayOne, arrayTwo){
   if(arrayOne === undefined) return;
    return arrayOne.map(function (x, index){
       if(this[index] !== undefined){
           return x || this[index]
       }
       return x;
   }, arrayTwo);
}

// And map. Given two arrays, map their values using AND
function and_map(arrayOne, arrayTwo){
    if(arrayOne === undefined) return;
    return arrayOne.map(function(x, index){
        if(this[index] !== undefined){
            return x && this[index];
        }
        return x;
    }, arrayTwo);
}

/** Reduce the contents of a truth array by applying and
 * To each value successively
 */
function and_fold(array){
    return array.reduce((x, y)=>{return x && y});
}



/** Checks to see if each array element matches a given regex
 * returns an array of truth values indicating whether or not the element matched.
 */
function matches(array, regex){
    return array.filter(type_check_each('string')).map((x)=>{return x.match(regex);});
}

/** Check that each element of an array matches some criterion.
 * If so, gather the indexes of each matching element.
 * Returns an array containing the index of each element that matches the check.
 */
//function locate(array, criteriaFunctions){
//    return criteria(array, criteriaFunctions).map((x)=>{
//        return x.map((x, index)=>{
//            if(x)return index
//        }).filter((x)=>{
//            return x !== undefined
//        })});
//}

/** find the items that match both criteria
 * using locate and flatten
 */
function fulfills_all(array, criteriaFunction){
    let indexes = deep_locate(array, criteriaFunction); //[[0,1,2,[3,4]],[2,1]]
    return deep_map(indexes, (i)=>{
       let check = criterion(indexes, (x)=>{if(Array.isArray(x)) return x.includes(i)});
    });
    indexes.map((y)=>{
        let check = criterion(indexes, (x)=>{return x.includes(y)});
        if(and_fold(check)) return y;
    }).filter((x)=>{
        return x !== undefined;
    });
}

/** Retrieve the elements from a source array that satisfy the given
 * locate method.
 */
function retrieve(array, criteriaFunctions, fulfillmentMethod){
    let res = deep_locate(array, criteriaFunctions);
    let fulfillment = fulfillmentMethod(res, clean(res));
    return deep_filter(deep_map(array, (x, index)=>{
        if(fulfillment.includes(index)) return x;
    }), (x)=>{return x !== undefined});
}

/** After locating, reduce the result to a one dimension array
 * Unique items only. Does not duplicate indexes.
 */
function flatten(locateIndexes){
    let flat = [];
    locateIndexes.forEach((x)=>{return x.map((x)=>{if (!flat.includes(x)) flat.push(x)})});
    return flat;
}

/** Based on some criteria, split an array into two arrays.
 * If the values match the given criteria, they are stored in res[0].
 * If the values do not match they are stored in res[1];
 */
function split(array, criterionFn){
   let res = [[],[]];
   array.map((x, index)=>{
       if(locate(array, criterionFn).includes(index)){
           res[0].push(x)
       } else {
           res[1].push(x)
       }});
   return res;
}

/** Given an array of arbitrary dimensions
 * bundle all values matching the criterion
 * into a single array
 */
function converge(array, criterionFn){
    return 1;
}

// Pop out some number of array elements into another array.
function pop_to(array, number){
    return array.map((x, index)=>{if (index < number) return array.pop();});
}

function is_not_array(){
    return (x)=>{return !Array.isArray(x)}
}

//Ignore nested arrays in a criteria result
function surface(array){
   return array.map((x)=>{return deep_filter(x, is_not_array())});
}

/**
 * Shallow locate is just a deep locate filtering out nested arrays beyond the top level
 * Since the top level contains some number of arrays based on the number of
 * Criteria provided.
 * @param array
 * @param criteriaFunctions
 * @returns {Array}
 */
function locate(array, criteriaFunctions){
    return deep_locate(array, criteriaFunctions).map((x)=>{return deep_filter(x, is_not_array())});
}

/**
 * Bundle an arrays contents into an object.
 * Where a specified set of indicies serves as keys
 * @param keyIndexes
 * @param contents
 * @returns {*|{}|Array}
 */
function bundle(keyIndexes, contents){
    let bundle = {};
    return contents.map((x, index)=>{
        let ks = Object.keys(bundle);
        if(keyIndexes.includes(index)) bundle[x] = [];
        if(!keyIndexes.includes(index)) bundle[ks[0]].push(x);
    });
}

function extract(array){
    let res = [];
    deep_map(array, (x)=>{res.push(x)});
    return res;
}

// Pull out nested arrays
// Stores each array of an array as an induvidual element
// in a result array.
function extract_arrays(array){
    let res = [];
    pattern_map(array, [(x)=>{res.push(x)}, (x)=>{return Array.isArray(x)}]);
    return res;
}

function clean(array){
    let res = [];
    deep_map(array, (x)=>{
        if(!res.includes(x)) res.push(x);
    });
    return res;
}


function all_include(array, values){
    return values.map((i)=>{
        let res = extract_arrays(array).map((x)=>{
           return x.includes(i);
       });
        if(and_fold(res)) return i;
        return null;
    });
}

exports.criteria = criteria;
exports.locate = locate;
exports.pop_to = pop_to;
exports.matches = matches;
exports.split = split;
exports.not = not;
exports.or_map = or_map;
exports.and_map = and_map;
exports.filter_out = filter_out;
exports.flatten = flatten;
exports.fulfills_all = fulfills_all;
exports.retrieve = retrieve;
exports.collapse = collapse;

let vals = ['dog', 'brain', 5, ['throat', 'phenomena'], 0, ['fish', 'google', ['doctor', 'rainbow']]];
let depth = deep_locate(vals, [presets.type_check_each('string')]);
let crit = criteria(vals, [presets.type_check_each('string'), presets.type_check_each('number')], true);
console.log(criteria(['dog', 'big', 4, 'sun', ['frog', 'cat']], [presets.type_check_each('string'), presets.type_check_each('number')]));
console.log(deep_locate(['dog', 'big', 4, 'sun', ['frog', 'cat']], [presets.type_check_each('string'), presets.type_check_each('number')]));
console.log(vals);
console.log(depth);
console.log(surface(depth));
console.log(crit[0].result);
console.log(extract_arrays(depth));
console.log(all_include(depth, clean(depth)));
console.log(retrieve(vals, [presets.type_check_each('string'), (x)=>{return x.length > 3}], all_include));
