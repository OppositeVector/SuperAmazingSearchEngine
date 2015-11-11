
function Swap(a, i, j, dt) {
	var t = a[i];
	a[i] = a[j];
	a[j] = t;
}

var QuickSort = exports.QuickSort = function(array, evaluator) {

	if(evaluator == null) {
		evaluator = function(a, b) {
			return b - a;
		}
	}

	var duplicatesPresent = false;

	function Partition(a, l, h) { // Array, Low, High

		var pivot = a[h];
		i = l;
		for(var j = l; j < h; ++j) {
			var val = evaluator(a[j], pivot);
			duplicatesPresent |= (val == 0);
			if(val >= 0) {
				Swap(a, i, j);
				++i;
			}
		}
		Swap(a, i, h);
		return i;

	}

	function RecursiveQuickSort(a, l, h) { // Array, Low, High

		if(l < h) {
			var p = Partition(a, l, h);
			RecursiveQuickSort(a, l, p - 1);
			RecursiveQuickSort(a, p + 1, h);
			console.log(l + " " + h + " " + p + " " + a);
		}

	}

	RecursiveQuickSort(array, 0, array.length - 1);

	return duplicatesPresent;

}