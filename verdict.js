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
function criterion (f){
    return (x, index, array)=>{return Boolean(f(x, index, array));};
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
    let res = delimit_map(array, functions.map((x)=>{return criterion(x)}));
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

/**
 * Apply functions to every memeber of @array from
 * lef to right. Applications are subsequent.
 * function 2 is applied to the map resulting from
 * the application of function 1.
 * @param array
 * @param functions
 * @returns {*}
 */
function sequence_map(array, functions){
    if(!Array.isArray(functions)) functions = arrize(arguments, 1);
    if (functions.length !== 0){
        let func = functions[0];
        functions.reverse();
        functions.pop();
        functions.reverse();
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
function delimit_map(array, functions){
    let res = [];
    if(!Array.isArray(functions)) functions = arrize(arguments, 1);
    functions.forEach((x)=>{
        res.push(deep_map(array, x));
    });
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
        return func.call(this, x, index, array);
    });
}

/**
 * Deep_map but only runs the specified function if
 * the element matches the provided pattern which is
 * a function that returns a Boolean and is passed as
 * func[1]
 * @param array
 * @param func
 * @param pattern
 * @returns {*|Array|{}}
 */
function pattern_map(array, func, pattern){
    return array.map((x, index, array)=>{
        if(pattern(x)) func(x, index, array);
        if(Array.isArray(x)) return pattern_map(x, func, pattern);
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

function is_not_array(){
    return (x)=>{return !Array.isArray(x)}
}

/**
 * Grab only the surface of an array--top level elements.
 * Filter out all nested arrays and their members.
 * @param array
 * @returns {*|{}|Array}
 */
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

/**
 * Extract all members (non-array) from an array.
 * Does not ignore duplicates.
 * @param array
 * @returns {Array}
 */
function extract(array){
    let res = [];
    deep_map(array, (x)=>{res.push(x)});
    return res;
}

/**
 * pull each array out of a nested array and push
 * to a new array as individual elements.
 * @param array
 * @returns {Array}
 */
function extract_arrays(array){
    let res = [];
    pattern_map(array, (x)=>{res.push(x)}, (x)=>{return Array.isArray(x)});
    return res;
}

/**
 * Extract unique non-array members from an array.
 * @param array
 * @returns {Array}
 */
function clean(array){
    let res = [];
    deep_map(array, (x)=>{
        if(!res.includes(x)) res.push(x);
    });
    return res;
}

/**
 * If given two arrays, the content holding array
 * and a subset of items to match against
 * return only the values that appear in every nested array
 * of the content holding array.
 * If a value is not included in every nest, null is returned.
 * @param array
 * @param values
 * @returns {*|Array|{}}
 */
function all_include(array, values){
    return values.map((i)=>{
        let res = extract_arrays(array).map((x)=>{
           return x.includes(i);
       });
        if(and_fold(res)) return i;
        return null;
    });
}

/**
 * Many functions here rely on a structure
 * by which there is an outer array:
 * [[member, member]] at minimum.
 * Wrap will add this wrapper array if a basic array ia passed.
 * @param array
 */
function wrap(array){
    let casing = [];
    if(!and_fold(deep_map(array, criterion(presets.type_check_each('Object'))))) casing.push(array);
    if(casing.length > 0) return casing;
    return array;
}

/**
 * Returns only the values not found in
 * Any member or nest of the array
 * @param array
 * @param values
 */
function none_include(array, values){
    return values.map((i)=>{
        let res = extract_arrays(wrap(array)).map((x)=>{
            return x.includes(i);
        });
        console.log(i, res);
        if(!or_fold(res)) return i;
        return null;
    });
}

exports.criteria = criteria;
exports.locate = locate;
exports.matches = matches;
exports.split = split;
exports.not = not;
exports.or_map = or_map;
exports.and_map = and_map;
exports.filter_out = filter_out;
exports.flatten = flatten;
exports.retrieve = retrieve;
exports.collapse = collapse;
exports.extract = extract;
exports.sequence_map = sequence_map;

let vals = ['dog', 'brain', 5, ['throat', 'phenomena'], 0, ['fish', 'google', ['doctor', 'rainbow']]];
let depth = deep_locate(vals, [presets.type_check_each('number')]);
let crit = criteria(vals, [presets.type_check_each('string'), presets.type_check_each('number')]);
console.log(surface(depth));
console.log(crit);
console.log(retrieve(vals, [presets.type_check_each('string'), (x)=>{return x.length > 3}], all_include));
console.log(all_include(['post', 'bear', ['dog', 'post', ['iron', 'post']]], ['post', 'rabinow']));
console.log(none_include([['post', 'bear', ['dog', 'post', ['iron', 'post']]]], ['post', 'rabinow', 'bear', 'fulcrum']));
console.log(sequence_map([1,2,3, [2,4]], [(x)=>{return x + 3}, (x)=>{return x + 2}]));
console.log(delimit_map([1,2,3, [2,4]], [(x)=>{return x + 3}, (x)=>{return x + 2}]));
console.log(collapse(criteria([1,2,3], [(x)=>{return x + 3}, (x)=>{return 0}]), or_map));
