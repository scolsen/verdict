const presets = require('./presets');
// Maps
const maps = require('./maps');



// Returns a truth mapping of all the items in an array.
// Based on the return value of some arbitrary function which should contain a test.
// Non truth values are wrapped in Boolean to convert to truth values.
// Fn should be of form (x)=>{return x == 'string'} or some other test.

const criterion = function criterion(f) {
    return (x, index, array)=>{return Boolean(f(x, index, array));};
}

const toObj = function toObj(aArray, bArray){
   let obj = {};
   aArray.map((x, index)=>{
       obj[index] = {};
       obj[index].a = x;
       obj[index].b = bArray[index];
   });
   return obj;
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
const criteria = function criteria(array, functions, wrap){
    let res = delimitMap(array, functions.map((x)=>{return criterion(x)}));
    if(wrap === true) return toObj(functions, res);
    return res;
}

// Pop the bottom of the stack
const _sink = function _sink(array){
    array.reverse();
    array.pop();
    array.reverse();
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
 * @returns {Array}
 */
function deep_locate(array, criteriaFunctions){
    function mapper (x, index){
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
        if(!or_fold(res)) return i;
        return null;
    });
}

/**
 * Returns all members that match the given criteria.
 * @param array
 * @param criteriaFunctions
 */
function fulfills_all(array, criteriaFunctions, truthy){
  let res = deep_locate(array, criteriaFunctions);
    let fulfillment = all_include(res, clean(res));
    return deep_filter(deep_map(array, (x, index)=>{
        if(fulfillment.includes(index)) return x;
    }), (x)=>{return x !== undefined});
}

function fulfills_none(array, criteriaFunctions){
    let res = deep_locate(array, criteriaFunctions);
    let fulfillment = none_include(res, clean(res));
    return deep_filter(deep_map(array, (x, index)=>{
        if(fulfillment.includes(index)) return x;
    }), (x)=>{return x !== undefined});
}

exports.criteria = criteria;
exports.locate = locate;
exports.matches = matches;
exports.split = split;
exports.not = not;
exports.or_map = or_map;
exports.and_map = and_map;
exports.flatten = flatten;
exports.retrieve = retrieve;
exports.extract = extract;
exports.sequence_map = sequence_map;

let vals = ['dog', 'brain', 5, ['throat', 'phenomena'], 0, ['fish', 'google', ['doctor', 'rainbow']]];
let depth = deep_locate(vals, [presets.type_check_each('number')]);
let crit = criteria(vals, [presets.type_check_each('string'), presets.type_check_each('number')]);
console.log(surface(depth));
console.log(crit);
console.log(fulfills_all(vals, [presets.type_check_each('string'), (x)=>{return x.length > 3}]));
console.log(fulfills_none(vals, [presets.type_check_each('string'), (x)=>{return x.length > 3}]));
console.log(all_include(['post', 'bear', ['dog', 'post', ['iron', 'post']]], ['post', 'rabinow']));
console.log(none_include([['post', 'bear', ['dog', 'post', ['iron', 'post']]]], ['post', 'rabinow', 'bear', 'fulcrum']));

console.log(sequence_map([1,2,3, [2,4]], [(x)=>{return x + 3}, (x)=>{return x + 2}]));
console.log(delimit_map([1,2,3, [2,4]], [(x)=>{return x + 3}, (x)=>{return x + 2}]));
console.log(criteria([1,2,3], [(x)=>{return x + 3}, (x)=>{return 0}]));
console.log(pattern_map(['hello', 4, 'dog'], (x)=>{return x + 3}, (x)=>{return typeof(x) === 'number'}));
