/**
 * Created by scottolsen on 7/29/17.
 * verdict.js
 */

// Returns a truth mapping of all the items in an array.
// Based on the return of some arbitrary function  which should contain a test.
// Non truth values are wrapped in Boolean to convert to truth values.
// Fn should be of form (x)=>{return x == 'string'} or some other test.
function criterion(array, fn){
    return array.map((x, index, array)=>{return Boolean(fn(x, index, array));});
}

// Specify multiple criterion array elements must match.
// Specify a mode to combine the truth array results of each criterion.
// Combine values of each truth array using the specified modeCallback (and || or)
// Functions should be provided as an array of criterion. (anonymous or named)
function criteria(array, functions){
    let res = [];
    functions.forEach((x)=>{res.push(criterion(array, x));});
    return res;
}

// Given the results of criteria, an array, of criterion arrays
// reduce to a single array of truth values using the specified mode.
function reduce_criteria(criteriaArray, modeFunction){
   // needs or map and and map.
}

// Expects an array of truth values.
// Returns an array containing the opposite value of each.
// Optionally first generates the array of T values with a criterion.
function not(array, criterionFn){
    if(criterionFn) return criterion(array, criterionFn).map((x)=>{return !x});
    return array.map((x)=>{return !x});
}

// Reduce the contents of a truth array by applying or
// To each value successively
function or_fold(array){
    return array.reduce((x, y)=>{return x || y});
}

// Given an arbitrary number of arrays of truth values.
// Combine each value using OR-- each array must have the same cardinality:
// If an array does not have the same number of elements, fail.
// Expect an arry of arrays as input -- if not, convert arguments to an array.
function or_collapse(arrays){
    let res = [];
    arrays.reverse();
    for (let i = arrays.length; i > 0; i--){
        res.push(or_map(arrays.pop(), arrays.pop()));
    }
    return filter_out(res, is_undefined());
}

// filter out all elements matching a given filter.
// Return the resulting array.
function filter_out(array, criterionFn){
    let res = [];
    let indexes = flatten(locate(array, criterionFn));
    array.map((x, index)=>{if(!indexes.includes(index)) res.push(x);});
    return res;
}

function reverse_pop(array){
    return array.reverse().pop();
}

// Given two arrays map their values using OR.
// Arrays must have the same cardinality.
// note we cannot use lambda here as we need to make use of this.
// In the case a second Array is not provided, return x.
function or_map(arrayOne, arrayTwo){
   if(arrayOne === undefined) return;
    return arrayOne.map(function (x, index){
       if(this[index] !== undefined){
           return x || this[index]
       }
       return x;
   }, arrayTwo);
}

// Reduce the contents of a truth array by applying and
// To each value successively
function and_fold(array){
    return array.reduce((x, y)=>{return x && y});
}

// Reduce an array to a single truth value based on the general contents
// Using an AND or an OR logical combination.
// Or simply using sheer count.
// default to OR
function generalize(array, mode){
    return array.reduce((x, y)=>{return x || y});
}

// Returns true or false indicating whether an array
// contains all elements matching the specified type.
function type_check_all(array, type){
    return array.every((x)=>{return typeof(x) === type});
}

function type_check_each(type){
    return (x)=>{return typeof(x) === type};
}

// Criterion to confirm elements are not null
function not_null(){
    return (x)=>{return x !== null}
}

// Criterion to confirm elements are not undefined
function is_undefined(){
    return [(x)=>{return x === undefined}];
}

function is_included(m){
    return (m, index, array)=>{return array.includes(m);}
}

// Checks to see if each array element matches a given regex
// returns an array of truth values indicating whether or not the element matched.
function matches(array, regex){
    return array.filter(type_check_each('string')).map((x)=>{return x.match(regex);});
}

// Check that each element of an array matches some criterion.
// If so, gather the indexes of each matching element.
// Returns an array containing the index of each element that matches the check.
function locate(array, criteriaFunctions){
    return criteria(array, criteriaFunctions).map((x)=>{
        return x.map((x, index)=>{
            if(x)return index
        }).filter((x)=>{
            return x !== undefined
        })});
}

// find the items that match both criteria
// using locate and flatten
function fullfills_all(array, criteriaFunction){
    let indexes = locate(array, criteriaFunction);
    return flatten(indexes).map((y)=>{
        let check = criterion(indexes, (x)=>{return x.includes(y);});
        if(and_fold(check)) return y;
    }).filter((x)=>{
        return x !== undefined;
    });
}

// Retrieve the elements from a source array that satisfy the given
// locate method.
function retrieve(array, criteriaFunctions, fullfillmentMethod){
    let fullfilllments = fullfillmentMethod(array, criteriaFunctions);
    return filter_out(array.map((x, index)=>{
        if (fullfilllments.includes(index)) return x;
    }), is_undefined());
}

// After locating, reduce the result to a one dimension array
// Unique items only. Does not duplicate indexes.
function flatten(locateIndexes){
    let flat = [];
    locateIndexes.forEach((x)=>{return x.map((x)=>{if (!flat.includes(x)) flat.push(x)})});
    return flat;
}

// Based on some criteria, split an array into two arrays.
// If the values match the given criteria, they are stored in res[0].
// If the values do not match they are stored in res[1];
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

// Given an array of arbitrary dimensions
// bundle all values matching the criterion
// into a single array
function converge(array, criterionFn){
    return 1;
}

// Pop out some number of array elements into another array.
function pop_to(array, number){
    return array.map((x, index)=>{if (index < number) return array.pop();});
}

exports.criterion = criterion;
exports.criteria = criteria;
exports.locate = locate;
exports.pop_to = pop_to;
exports.type_check_all = type_check_all;
exports.matches = matches;
exports.split = split;
exports.type_check_each = type_check_each;
exports.not_null = not_null;
exports.is_undefined = is_undefined;
exports.not = not;
exports.or_map = or_map;
exports.or_collapse = or_collapse;
exports.generalize = generalize;
exports.filter_out = filter_out;
exports.flatten = flatten;
exports.fullfills_all = fullfills_all;
exports.retrieve = retrieve;

locate(['dog', 'big', 4, 'sun'], [type_check_each('string')]);
