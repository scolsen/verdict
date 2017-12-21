//core functions.

const unit = (function getUnit() {
  return Symbol('unit');  
}())

function guard(predicates, fns, bottom = unit, ...rest) { 
  let resultfn = bottom;
  for(let indx = 0; indx < predicates.length; indx++) {
      if(predicates[indx](...rest)) {
          resultfn = fns[indx];
          break;
        }
    }
  return resultfn();
}

function pushto(item, array, at = 0) {
  array.splice(at, 0, item)  
}

function endof(array) {
  return array.length;
}

//given an array of N dimensions, construct a flat list of its elements.
function list(...members){
  let lis = [];
  deepMap(members, (item) => pushto(item, lis));
  return lis;
}

function intersperse(items, inArray, {at}) {
  
}
