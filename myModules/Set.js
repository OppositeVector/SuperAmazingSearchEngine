var Set = exports.Set = function(comparer, orig) {

	if(comparer instanceof Array) {
		orig = comparer;
		comparer = null;
	}

	if(comparer == null) {
		comparer = function(a, b) { return (a - b); }
	}

	this.arr = [];
	this.comparer = comparer;

	if(orig == null) {
		return;
	} else if(orig instanceof Set) {
		this.arr = orig.arr.concat();
	}

	for(var i = 0; i < orig.length; ++i) {
		if(this.arr.indexOf(orig[i]) == -1) {
			this.arr.push(orig[i]);
		}
	}

}

Set.prototype.Union = function(set) {
	
	var arr;

	// console.log("union set:" + JSON.stringify(this.arr));

	if(set instanceof Set) {
		arr = set.arr;
	} else if(set instanceof Array) {
		arr = set;
	} else {
		if(this.IndexOf(set) == -1) {
			this.arr.push(set);
		}
		return;
	}

	// console.log("union arr:" + JSON.stringify(arr));

	for(var i = 0; i < arr.length; ++i) {
		if(this.IndexOf(arr[i]) == -1) {
			this.arr.push(arr[i]);
		}
	}

	// console.log("union finish:" + JSON.stringify(this.arr))

	return this;

};

Set.prototype.Intersection = function(set) {

	var arr;

	if(set instanceof Set) {
		arr = set.arr;
	} else if(set instanceof Array) {
		arr = set;
	} else {
		if(this.IndexOf(set) != -1) {
			this.arr = [ set ];
		} else {
			this.arr = [];
		}
		return;
	}

	var newSet = new Set(this.comparer);

	for(var i = 0; i < arr.length; ++i) {
		if(this.IndexOf(arr[i]) != -1) {
			newSet.Union(arr[i]);
		}
	}

	this.arr = newSet.arr;

	return this;

}

Set.prototype.Subtract = function(set) {

	var arr;

	if(set instanceof Set) {
		arr = set.arr;
	} else if(set instanceof Array) {
		arr = set;
	} else {
		var index = this.IndexOf(set);
		if(index != -1) {
			this.arr.splice(index, 1);
		}
		return;
	}

	for(var i = 0; i < arr.length; ++i) {
		var index = this.IndexOf(arr[i]);
		if(index != -1) {
			this.arr.splice(index, 1);
		}
	}

	return this;

}

Set.prototype.IndexOf = function(element) {

	// console.log("Comparing with:" + this.comparer);

	for(var i = 0; i < this.arr.length; ++i) {
		if(this.comparer(this.arr[i], element) == 0) {
			return i;
		}
	}

	return -1;

}