module.exports = function intersect(arrayA, arrayB, intersector){
    var results = [];

    function innerCheck(aItem){
        for (var i = 0; i < arrayB.length; i++) {
            if(
                (intersector && intersector(aItem, arrayB[i])) ||
                (!intersector && aItem === arrayB[i])
            ){
                results.push(aItem);
            }
        }
    }

    for (var i = 0; i < arrayA.length; i++) {
        innerCheck(arrayA[i]);
    }

    return results;
};