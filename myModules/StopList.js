
var hash = require("./Hash");

var list = exports.stopList = [
	hash.HashString("a"),
	hash.HashString("as"),
	hash.HashString("be"),
	hash.HashString("but"),
	hash.HashString("did"),
	hash.HashString("about"),
	hash.HashString("above"),
	hash.HashString("after"),
	hash.HashString("again"),
	hash.HashString("all"),
	hash.HashString("am"),
	hash.HashString("an"),
	hash.HashString("and"),
	hash.HashString("any"),
	hash.HashString("are"),
	hash.HashString("aren't"),
	hash.HashString("as"),
	hash.HashString("at"),
	hash.HashString("be"),
	hash.HashString("because"),
	hash.HashString("been"),
	hash.HashString("before"),
	hash.HashString("being"),
	hash.HashString("below"),
	hash.HashString("between"),
	hash.HashString("both"),
	hash.HashString("but"),
	hash.HashString("by"),
	hash.HashString("can't"),
	hash.HashString("cannot"),
	hash.HashString("could"),
	hash.HashString("couldn't"),
	hash.HashString("did"),
	hash.HashString("didn't"),
	hash.HashString("do"),
	hash.HashString("does"),
	hash.HashString("doesn't"),
	hash.HashString("doing"),
	hash.HashString("don't"),
	hash.HashString("down"),
	hash.HashString("during"),
	hash.HashString("each"),
	hash.HashString("few"),
	hash.HashString("for"),
	hash.HashString("from"),
	hash.HashString("further"),
	hash.HashString("had"),
	hash.HashString("hadn't"),
	hash.HashString("has"),
	hash.HashString("hasn't"),
	hash.HashString("have"),
	hash.HashString("haven't"),
	hash.HashString("having"),
	hash.HashString("he"),
	hash.HashString("he'd"),
	hash.HashString("he'll"),
	hash.HashString("he's"),
	hash.HashString("her"),
	hash.HashString("here"),
	hash.HashString("here's"),
	hash.HashString("hers"),
	hash.HashString("herself"),
	hash.HashString("him"),
	hash.HashString("himself"),
	hash.HashString("his"),
	hash.HashString("how"),
	hash.HashString("how's"),
	hash.HashString("i"),
	hash.HashString("i'd"),
	hash.HashString("i'll"),
	hash.HashString("i'm"),
	hash.HashString("i've"),
	hash.HashString("if"),
	hash.HashString("in"),
	hash.HashString("into"),
	hash.HashString("is"),
	hash.HashString("isn't"),
	hash.HashString("it"),
	hash.HashString("it's"),
	hash.HashString("its"),
	hash.HashString("itself"),
	hash.HashString("let's"),
	hash.HashString("me"),
	hash.HashString("more"),
	hash.HashString("most"),
	hash.HashString("mustn't"),
	hash.HashString("my"),
	hash.HashString("myself"),
	hash.HashString("no"),
	hash.HashString("nor"),
	hash.HashString("not"),
	hash.HashString("of"),
	hash.HashString("off"),
	hash.HashString("on"),
	hash.HashString("once"),
	hash.HashString("only"),
	hash.HashString("or"),
	hash.HashString("other"),
	hash.HashString("ought"),
	hash.HashString("our"),
	hash.HashString("ours"),
	hash.HashString("ourselves"),
	hash.HashString("out"),
	hash.HashString("over"),
	hash.HashString("own"),
	hash.HashString("same"),
	hash.HashString("shan't"),
	hash.HashString("she"),
	hash.HashString("she'd"),
	hash.HashString("she'll"),
	hash.HashString("she's"),
	hash.HashString("should"),
	hash.HashString("shouldn't"),
	hash.HashString("so"),
	hash.HashString("some"),
	hash.HashString("such"),
	hash.HashString("than"),
	hash.HashString("that"),
	hash.HashString("that's"),
	hash.HashString("the"),
	hash.HashString("their"),
	hash.HashString("theirs"),
	hash.HashString("them"),
	hash.HashString("themselves"),
	hash.HashString("then"),
	hash.HashString("there"),
	hash.HashString("there's"),
	hash.HashString("these"),
	hash.HashString("they"),
	hash.HashString("they'd"),
	hash.HashString("they'll"),
	hash.HashString("they're"),
	hash.HashString("they've"),
	hash.HashString("this"),
	hash.HashString("those"),
	hash.HashString("through"),
	hash.HashString("to"),
	hash.HashString("too"),
	hash.HashString("under"),
	hash.HashString("until"),
	hash.HashString("up"),
	hash.HashString("very"),
	hash.HashString("was"),
	hash.HashString("wasn't"),
	hash.HashString("we"),
	hash.HashString("we'd"),
	hash.HashString("we'll"),
	hash.HashString("we're"),
	hash.HashString("we've"),
	hash.HashString("were"),
	hash.HashString("weren't"),
	hash.HashString("what"),
	hash.HashString("what's"),
	hash.HashString("when"),
	hash.HashString("when's"),
	hash.HashString("where"),
	hash.HashString("where's"),
	hash.HashString("which"),
	hash.HashString("while"),
	hash.HashString("who"),
	hash.HashString("who's"),
	hash.HashString("whom"),
	hash.HashString("why"),
	hash.HashString("why's"),
	hash.HashString("with"),
	hash.HashString("won't"),
	hash.HashString("would"),
	hash.HashString("wouldn't"),
	hash.HashString("you"),
	hash.HashString("you'd"),
	hash.HashString("you'll"),
	hash.HashString("you're"),
	hash.HashString("you've"),
	hash.HashString("your"),
	hash.HashString("yours"),
	hash.HashString("yourself"),
	hash.HashString("yourselves")
]

exports.check = function(str) {

	var h = hash.HashString(str);

	for(var i = 0; i < list.length; ++i) {
		if(h == list[i]) {
			return true;
		}
	}

	return false;

}