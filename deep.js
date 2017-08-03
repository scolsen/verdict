/**
 * Created by scolsen on 8/3/2017.
 */

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

function deep_criterion(array, fn){
    return deep_map(array,(x, index, array)=>{return Boolean(fn(x, index, array));});
}

function deep_criteria(array, functions){
 if(!Array.isArray(functions)) functions = arrize(arguments, 1);
    let res = [];
    functions.forEach((x)=>{res.push(deep_criterion(array, x));});
    return res;
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
    return deep_filter(deep_map(deep_criteria(array, criteriaFunctions), mapper), (x)=>{return x !== undefined});
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

function deep_flatten(locateIndexes){
    let flat = [];
    locateIndexes.forEach((x)=>{return x.map((x)=>{if (!flat.includes(x)) flat.push(x)})});
    return flat;
}

function deep_fulfills_all(array, criteriaFunction){
    let indexes = deep_locate(array, criteriaFunction);
    return flatten(indexes).map((y)=>{
        let check = deep_criterion(indexes, (x)=>{return x.includes(y)});
        if(and_fold(check)) return y;
    }).filter((x)=>{
        return x !== undefined;
    });
}

exports.map = deep_map;
exports.filter = deep_filter;
exports.criterion = deep_criterion;
exports.criteria = deep_criteria;
exports.locate = deep_locate;
exports.retrieve = deep_retrieve;
exports.flatten = deep_flatten;
exports.fullfills_all = deep_fulfills_all;
