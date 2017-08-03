/**
 * Created by scolsen on 8/3/2017.
 * Contains preset cirteria anon functions.
 */

function type_check_each(type){
    return (x)=>{return typeof(x) === type};
}

// Criterion to confirm elements are not null
function not_null(){
    return (x)=>{return x !== null}
}

// Criterion to confirm elements are not undefined
function is_undefined(){
    return (x)=>{return x === undefined};
}

function is_included(m){
    return (m, index, array)=>{return array.includes(m);}
}

exports.type_check_each = type_check_each;
exports.is_undefined = is_undefined;
exports.not_null = not_null;
exports.is_included = is_included;
