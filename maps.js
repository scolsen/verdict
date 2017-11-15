function deepMap(array, func) {
    var _this = this;
    return array.map(function (x, index, array) {
        if (Array.isArray(x))
            return deepMap(x, func);
        return func.call(_this, x, index, array);
    });
}
function patternMap(array, func, pattern) {
    var _this = this;
    return array.map(function (x, index, array) {
        if (pattern(x))
            return func.call(_this, x, index, array);
        if (Array.isArray(x))
            return patternMap(x, func, pattern);
        return x;
    });
}
function sequenceMap(array, func) {
    if (!Array.isArray(func))
        return deepMap(array, func);
    if (func.length !== 0) {
        var f = func[0];
        sink(func);
        return sequenceMap(deepMap(array, func), func);
    }
    return array;
}
function delimitMap(array, func) {
    var res = [];
    if (!Array.isArray(func))
        return deepMap(array, func);
    func.forEach(function (x) {
        res.push(deepMap(array, x));
    });
    return res;
}
