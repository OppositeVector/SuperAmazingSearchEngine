
function And() {

}

function Or() {

}

function Not() {

}

exports.Parser = function(str, openers, closers, unary, nary) {

	var stack = [];
	var sStack = BreakDown(str);

}

function OrderStack(stack) {

	var newStack

}

function BreakDown(str) {

	var stringStack = [];
	var i = 0;
	var input = "";

	function PushI() {
		if(input.length > 0) {
			stringStack.push(input);
			input = "";
		}
	}

	function PushIPlus(s) {
		PushI();
		stringStack.push(s);
	}

	while(i < str.length) {

		var c = str[i];

		if(c == "(") {
			PushIPlus("(";)
		} else if(c == ")") {
			PushIPlus(")");
		} else {

			if(c == " ") {
				PushI();
			} else {
				input += c;
			}

		}

		++i;

	}

	return stringStack;

}

function RecursiveDecent()