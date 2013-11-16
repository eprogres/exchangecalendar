var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
var Cr = Components.results;
var components = Components;

function STACK(aDepth, aSkip) {
    let depth = aDepth || 10;
    let skip = aSkip || 0;
    let stack = "";
    let frame = components.stack.caller;
    for (let i = 1; i <= depth + skip && frame; i++) {
        if (i > skip) {
            stack += i + ": [" + frame.filename + ":" +
                     frame.lineNumber + "] " + frame.name + "\n";
        }
        frame = frame.caller;
    }
    return stack;
}

function typeString(o) {
	if (typeof o != 'object')
		return typeof o;

	if (o === null)
		return "null";
  //object, array, function, date, regexp, string, number, boolean, error
	var internalClass = Object.prototype.toString.call(o)
                                               .match(/\[object\s(\w+)\]/)[1];
	return internalClass.toLowerCase();
}

function isObject(obj) {
	return (typeString(obj) == "object");
}

function isArray(obj) {
	return (typeString(obj) == "array");
}

function isInList(inArray, inStr)
{
	return (inArray[inStr] !== undefined);
}

const specialChars1 = {	" ": true, 
			"\n" : true, 
			"\r" : true, 
			"\t" : true };

function findCharacter(aXMLString, aSP, aChar)
{
	if (!aXMLString) return -1;

	var pos = aSP;
	var strLength = aXMLString.length;
	while ((pos < strLength) && (aXMLString[pos] != aChar)) {
		pos++;
	}

	if (pos < strLength) {
		return pos;
	}

	return -1;
}

function findString(aXMLString, aSP, aNeedle)
{
	if (!aXMLString) return -1;

	var pos = aSP;
	var needleLength = aNeedle.length;
	var strLength = aXMLString.length - needleLength + 1;
	while ((pos < strLength) && (aXMLString.substr(pos, needleLength) != aNeedle)) {
		pos++;
	}

	if (pos < strLength) {
		return pos;
	}

	return -1;
}

function splitOnCharacter(aXMLString, aSP, aSplitCharacter)
{
	if (!aXMLString) {
		return null;
	}

	var tmpPos = aSP;
	var result = "";
	var notClosed = true;
	var notQuoteOpen = true;
	var quotesUsed = "";
	var strLen = aXMLString.length;
	var splitCharIsArray = isArray(aSplitCharacter);
	while ((tmpPos < strLen) && (notClosed)) {
		if ((aXMLString[tmpPos] == "'") || (aXMLString[tmpPos] == '"')) {
			// We found quotes. Do they belong to our string.
			if (notQuoteOpen) {
				quotesUsed = aXMLString[tmpPos];
				notQuoteOpen = false;
			}
			else {
				if (aXMLString[tmpPos] == quotesUsed) {
					quotesUsed = "";
					notQuoteOpen = true;
				}
			}
		}

		var hitSplitCharacter = false;
		if (notQuoteOpen) {
			if (splitCharIsArray) {
				for (var index in aSplitCharacter) {
					if (aXMLString.substr(tmpPos,aSplitCharacter[index].length) == aSplitCharacter[index]) {
						hitSplitCharacter = true;
						break;
					}
				}
			}
			else {
				if (aXMLString.substr(tmpPos,aSplitCharacter.length) == aSplitCharacter) {
					hitSplitCharacter = true;
				}
			}
		}

		if (hitSplitCharacter) {
			notClosed = false;
		}
		else {
			result += aXMLString[tmpPos];
		}
		tmpPos++;
	}

	if (!notClosed) {
		return result;
	}
	else {
		return null;
	}
}

var replaceFromXML = function _replaceFromXML(str, r1)
{
	var result = str;
	if (r1[0] == "#") {
		if (r1[1] == "x") {
			// hexadecimal
			result = String.fromCharCode(parseInt(r1.substr(2),16))
		}
		else {
			// Decimal
			result = String.fromCharCode(parseInt(r1.substr(1),10))
		}
	}
	else {
		switch (r1) {
		case "amp": result = "&"; break;
		case "quot": result = '"'; break;
		case "apos": result = "'"; break;
		case "lt": result = "<"; break;
		case "gt": result = ">"; break;
		}
	}
	return result;
}

function convertSpecialCharatersFromXML(aXMLString)
{
	if (!aXMLString) return aXMLString;

	var result = aXMLString;
	// Convert special characters
	result = result.replace(/&(quot|apos|lt|gt|amp|#x[0123456789ancdefABCDEF][0123456789ancdefABCDEF]?[0123456789ancdefABCDEF]?[0123456789ancdefABCDEF]?|#[0123456789][0123456789]?[0123456789]?[0123456789]?);/g, replaceFromXML); 

	return result;
}

var replaceToXML = function _replaceToXML(str, r1)
{
	var result = str;
	switch (r1) {
	case "&": result = "&amp;"; break;
	case '"': result = "&quot;"; break;
	case "'": result = "&apos;"; break;
	case "<": result = "&lt;"; break;
	case ">": result = "&gt;"; break;
	}

	return result;
}

function convertSpecialCharatersToXML(aXMLString)
{
	if ((aXMLString === null) || (aXMLString === undefined)) return aXMLString;

	var result = aXMLString.toString();
	// Convert special characters
	result = result.replace(/(&|\x22|\x27|<|>)/g, replaceToXML);  

	return result;
}

function trim(aValue)
{
	var strLength = aValue.length;
	var leftPos = 0;
	while ((leftPos < strLength) && (aValue[leftPos] == " ")) {
		leftPos++;
	}
	var rightPos = strLength-1;
	while ((rightPos >= 0) && (aValue[rightPos] == " ")) {
		rightPos--;
	}
	return aValue.substr(leftPos, rightPos - leftPos + 1);
}

function hasXMLHeader(aStr, aSP)
{
	if (!aStr) return 0;

	var pos = findCharacter(aStr, aSP, "<");
	var strLength = aStr.length;
	if (pos > -1) {
		pos++;
		var tc = aStr[pos];

		if ( (pos < strLength) && (tc == "?")) {
			pos++;
			if (aStr.substr(pos, 4) == "xml ") {
				var tmpPos = findString(aStr, pos, "?>");
				if (tmpPos == -1) {throw -20;} // Error invalid special tag
				else {
					return (tmpPos+2);						
				}
			}
			else {throw -21;} //ERR_MISSING_SPECIAL_TAG
		}
	}
	return 0;
}

function splitTagName(aTagName) {
	var ns = null;
	var tn = null;
	var sepPos = aTagName.indexOf(tsep);
	if (sepPos > -1) {
		ns = aTagName.substr(0,sepPos);
		tn = aTagName.substr(sepPos+1);
	}
	else {
		tn = aTagName;
	}

	return { tagName: tn, nameSpace: ns };
}

function convertComparisonPart(a, aJSONObject){
	var r = [];
	var tc = a[0];
	if ((tc == "/") || (tc == ".") || (tc == "@")) {
		r = realXPath(aJSONObject, a);
	}
	else {
		r = [];
		if ( (tc == "'") || (tc == '"')) {
			r.push(a.substr(1,a.length-2));
		}
		else {
			if (isNaN(a)) {
				r = realXPath(aJSONObject, a);
			}
			else {
				r.push(Number(a));
			}
		}
	}
	return r;
}


function ifFunction(aCondition, aJSONObject){
	var level = 0;
	var tmpCondition = trim(aCondition);
	var compareList = [];
	while (tmpCondition != "") {
		var startPos = 0;
		var weHaveSubCondition = false;
		if (tmpCondition[0] == "(") {
			var subCondition = splitOnCharacter(tmpCondition.substr(1), 0, ")");
			if (subCondition) {
				startPos = subCondition.length;
				weHaveSubCondition = true;
			}
			else {
				throw "XPath error: Did not find closing round bracket '"+aJSONObject.tagName+"' for condition:"+aCondition;
			}
		}

		var splitPart = splitOnCharacter(tmpCondition.toLowerCase(), startPos, [" and ", " or "]);
		var operator = null;
		var comparison = null;
		if (splitPart) {
			splitPart = tmpCondition.substr(0, splitPart.length);
			tmpCondition = tmpCondition.substr(splitPart.length + 1);

			if (tmpCondition[0] == "a") {
				operator = "and";
				tmpCondition = tmpCondition.substr(4);
			}
			else {
				operator = "or";
				tmpCondition = tmpCondition.substr(3);
			}
		}
		else {
			splitPart = tmpCondition;
			tmpCondition = "";
		}
		if (weHaveSubCondition) {
			compareList.push( { left: subCondition, right: "", operator: operator, comparison: comparison, subCondition: subCondition} );
		}
		else {
			var splitPart2 = splitOnCharacter(splitPart, 0, ["!=", "<=", ">=", "<", "=", ">"]);
			if (splitPart2) {
				// Get comparison type
				var smallerThen = false;
				var equalTo = false;
				var biggerThen = false;
				var splitPos2 = splitPart2.length;
				switch (splitPart[splitPos2]) {
					case "!":comparison = "!=";break;
					case "<":comparison = "<";if (splitPart[splitPos2+1] == "=") comparison = "<=";break;
					case "=":comparison = "=";break;
					case ">":comparison = ">";if (splitPart[splitPos2+1] == "=") comparison = ">=";break;
				}
				compareList.push( { left: trim(splitPart2), right: trim(splitPart.substr(splitPart2.length+comparison.length)), operator: operator, comparison: comparison, subCondition: subCondition} );
			}
			else {
				compareList.push( { left: trim(splitPart), right: "", operator: operator, comparison: comparison, subCondition: subCondition} );
			}
		}
	}
	var totalResult = true;
	var lastOperator = null;
	for (let index in compareList) {
		var tmpResult = false;
		if (compareList[index].subCondition) {tmpResult = ifFunction(compareList[index].left, aJSONObject);}
		else {
			let tmpLeft = convertComparisonPart(compareList[index].left, aJSONObject);
			let tmpRight = convertComparisonPart(compareList[index].right, aJSONObject);
			if (tmpLeft.length > 0) {
				if (compareList[index].comparison) {
					// Filter out ony the valid ones.
					if (tmpRight.length > 0) {
						var x = 0;
						tmpResult = false;
						while ((x < tmpLeft.length) && (!tmpResult)) {
							if ((typeof tmpLeft[x] === "string") || (tmpLeft[x] instanceof String) || (typeof tmpLeft[x] === "number")) {
								var evalConditionLeft = tmpLeft[x].toString();
							}
							else {
								var evalConditionLeft = realGetValue(tmpLeft[x]).toString();
							}
							var y = 0;
							while ((y < tmpRight.length) && (!tmpResult)) {
								if ((typeof tmpRight[y] === "string") || (tmpRight[y] instanceof String) || (typeof tmpRight[y] === "number")) {
									var evalConditionRight = tmpRight[y].toString();
								}
								else {var evalConditionRight = realGetValue(tmpRight[y]).toString();}
								switch (compareList[index].comparison) {
								case "!=":tmpResult = (evalConditionLeft != evalConditionRight);break;
								case "<=":tmpResult = (evalConditionLeft <= evalConditionRight);break;
								case ">=":tmpResult = (evalConditionLeft >= evalConditionRight);break;
								case "<":tmpResult = (evalConditionLeft < evalConditionRight);break;
								case "=":tmpResult = (evalConditionLeft==evalConditionRight);break;
								case ">":tmpResult = (evalConditionLeft > evalConditionRight);break;
								}
								y++;
							}
							x++;
						}
					}
				}
				else {
					tmpResult = true;
				}
			}
			else {tmpResult = false;}
			tmpLeft = null;
			tmpRight = null;
		}
		switch (lastOperator) {
		case "and":totalResult = (totalResult && tmpResult);break;
		case "or":totalResult = (totalResult || tmpResult);break;
		case null:totalResult = tmpResult;break;
		}
		if (compareList[index].operator) {
			if ((compareList[index].operator == "and") && (!totalResult)) {return false;}
			if ((compareList[index].operator == "or") && (totalResult)) {return true;}
		}
		lastOperator = compareList[index].operator;
	}
	return totalResult;
}

function realGetValue(aParent) {
	if (!aParent) throw -60;
	if (!aParent["content"]) return "";

	let result = "";
	let i = 0;
	while (i < aParent.content.length) {
		result = result + aParent.content[i];
		i++;
	}
	return convertSpecialCharatersFromXML(result);
}

function realGetTags(aParent, aTagName) {
	if ((!aParent) || (!aParent["elements"])) throw -54;
	let result = [];

	var tmpTN = splitTagName(aTagName);

	var i = 0;
	while (i < aParent.elements.length) {
//			if ((aParent.elements[i].nameSpace == tmpTN.nameSpace) && (aParent.elements[i].tagName == tmpTN.tagName)) {
		if (aParent.elements[i].tagName == tmpTN.tagName) {  // We ignore the namespace for now.
			result.push(aParent.elements[i]);
		}
		i++;
	}
	return result;
}


function realXPath(aParent, aPath){
	//dump("XPath:"+aPath+"("+STACK(6)+")\n");
	//dump("aParent:"+JSON.stringify(aParent)+"\n");
	//dump("..\n");
	var tmpPath = aPath;
	var result = [];
	if (tmpPath[0] == "/") {
		tmpPath = tmpPath.substr(1);
	}

	switch (tmpPath[0]) {
	case "@" : // Find attribute within this element
		let attrName = tmpPath.substr(1);
		if ((aParent["attributes"]) && (aParent.attributes[attrName])) {
			//dump("XPath:found attribute. value="+String(aParent.attributes[attrName])+"\n");
			result.push(String(aParent.attributes[attrName]));
		}
		//dump("XPath find attribute '"+attrName+"'. result.length='"+result.length+"'\n");
		tmpPath = "";
		break;
	case "*" : // Wildcard. Will parse all children.
		tmpPath = tmpPath.substr(1);
		let i = 0;
		while (i < aParent.elements.length) {
			result.push(aParent.elements[i]);
			i++;
		}
		break;
	case "[" : // Compare/match function
		let index = splitOnCharacter(tmpPath.substr(1), 0, "]");
		if (!index) {throw "XPath error: Did not find closing square bracket. tagName:"+aParent.tagName+", tmpPath:"+tmpPath;}
		tmpPath = tmpPath.substr(index.length+2);
		index = trim(index); 
		if (index != "") {
			if (ifFunction(index, aParent)) {
				result.push(aParent);
			}
			else {
				return result;
			}
		}
		else {
			throw "XPath compare error:No Value between square brackets:"+aParent.tagName+"["+index+"]";
		}
		break;
	default:
		let bracketPos = tmpPath.indexOf("[");
		let forwardSlashPos = tmpPath.indexOf("/");
		let splitPos = tmpPath.length;
		if ((bracketPos < splitPos) && (bracketPos > -1)) {splitPos = bracketPos;}
		if ((forwardSlashPos < splitPos) && (forwardSlashPos > -1)) {splitPos = forwardSlashPos;}
		let tmpPath2 = tmpPath.substr(0, splitPos);
		tmpPath = tmpPath.substr(splitPos);
		let equalTags = [];
		equalTags = realGetTags(aParent,tmpPath2);
		result = equalTags;
	}

	if ((result.length > 0) && (tmpPath != "")) {
		let finalResult = [];
		let i = 0;
		while (i < result.length) {
			var tmpResult = realXPath(result[i], tmpPath);
			if (!isArray(tmpResult)) { // Check if answer is an Array or a String. String is returned on attribute search.
				finalResult = tmpResult;
			}
			else {
				let j = 0;
				while (j < tmpResult.length) {
					finalResult.push(tmpResult[j]);
					j++;
				}
			}
			i++;
		}
		result = finalResult;
	}

	return result;
}

function realElementToString(aElement) {
	if (!aElement.tagName) return "";

	//dump(" @@@@@:"+JSON.stringify(aElement)+"\n");

	var result = "<";
	if (aElement.nameSpace) result = result + aElement.nameSpace + tsep;
	result = result + aElement.tagName;

	if (aElement["attributes"]) {
		for (var attrName in aElement.attributes) {
			result = result + " " + attrName + "="+'"' + aElement.attributes[attrName]+'"';
		}
	}

	if ((aElement["content"]) || (aElement.elements.length > 0)) {
		result = result + ">";
		if ((aElement["content"]) && (aElement.content.length)) {
			let i = 0;
			while (i < aElement.content.length) {
				result = result + aElement.content[i];
				i++;
			}
		}

		let i = 0;
		while (i < aElement.elements.length) {
			result = result + realElementToString(aElement.elements[i]);
			i++;
		}

		result = result + "</";
		if (aElement.nameSpace) result = result + aElement.nameSpace + tsep;
		result = result + aElement.tagName + ">";
		

	}
	else {
		result = result + "/>";
	}

	return result;
}

function realSetAttribute(aParent, aName, aValue) {
	if ((!aParent) || (!aParent["elements"])) throw -51;
	if (!aParent["attributes"]) {
		aParent.attributes = {};
	}
	aParent.attributes[aName] = aValue;
}

function realAddContent(aParent, aString) {
	//dump("addContent: aString="+aString+"\n");
	if ((!aParent) || (!aParent["elements"])) throw -55;
	if (!aParent["content"]) {
		aParent.content = [];
	}
	aParent.content.push(aString);
}

function realClosingTag(aParent, aTagName) {
	//dump("closingTag: aTagName="+aTagName+"\n");
	var tmpTN = splitTagName(aTagName);

	let closingMatchesOpening = false;
	if (tmpTN.tagName == aParent.tagName) {
		if (tmpTN.nameSpace == aParent.nameSpace) {
			closingMatchesOpening = true;
		}
	}

	if (!closingMatchesOpening) {
		throw -5; // Closing element does not match opening element.
	}
	else {
		if (aParent.parent) {
			let result = aParent.parent;
			aParent.parent = null;
			delete aParent['parent'];
			return result;
		}
		else {
			throw -6; // We should never get here. But in case we do. Wee see a closing element for which no opening element was seen.
		}
	}
}

function realOpeningTag(aParent, aTagName) {
	//dump("openingTag: aTagName="+aTagName+"\n");
	var tmpTN = splitTagName(aTagName);
	let tmpElement = { parent: aParent,
				elements: [],
				nameSpace: tmpTN.nameSpace,
				tagName: tmpTN.tagName};
	aParent.elements.push(tmpElement);
	return tmpElement;
}

function realSetAttributeStr(aParent, aString) {
	//dump("setAttributeStr 1: aString="+aString+"\n");
	aString = aString.replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "");
	var sp = aString.indexOf("=");
	if (sp == -1) {
		throw -13; // Equal sign not found.
	}
	var an = trim(aString.substr(0, sp));
	var av = trim(aString.substr(sp+1));
	var tc = av[0];
	if ((tc == "'") || (tc == '"')) {
		let vl = av.length;
		if (tc == av[vl-1]) {
			av = av.substr(1, vl-2);
		}
		else {
			throw -14; // Did not find closing quote
		}
	}

	//dump("setAttributeStr 2: name="+an+", value="+av+"\n");
	realSetAttribute(aParent, an, av);
}

var EXPORTED_SYMBOLS = ["xml2json"];

const tsep = ":";

var xml2json = {

	newJSON: function _newJSON() {
		return { elements: [] };
	},

	addTagObject: function _addTagObject(aParent, aChildObject) {
		if ((!aParent) || (!aParent["elements"])) throw -52;
		aParent.elements.push(aChildObject);

		return aParent.elements[aParent.elements.length-1];
	},

	getTags: function _getTags(aParent, aTagName) {
		return realGetTags(aParent, aTagName);
	},

	getValue: function _getValue(aParent) {
		return realGetValue(aParent);
	},

	getTagValue: function _getTagValue(aParent, aTagName, aDefault) {
		if ((!aParent) || (!aParent["elements"]) || (!aTagName)) throw "-62 aParent:"+aParent+", aTagName="+aTagName;

		let result = null;
		if (aDefault) result = aDefault;
		let i = 0;
		var tmpTN = splitTagName(aTagName);
		while ((!result) && (i < aParent.elements.length)) {
			if (aParent.elements[i].tagName == tmpTN.tagName) {  // We ignore the namespace for now.
				result = realGetValue(aParent.elements[i]);
			}
			i++;
		}
		return result;
	},

	getTag: function _getTag(aParent, aTagName) {
		let result = null;

		var tmpTN = splitTagName(aTagName);

		var i = 0;
		while ((!result) && (i < aParent.elements.length)) {
//			if ((aParent.elements[i].nameSpace == tmpTN.nameSpace) && (aParent.elements[i].tagName == tmpTN.tagName)) {
			if (aParent.elements[i].tagName == tmpTN.tagName) { // Namespace is ignored for now.
				return aParent.elements[i];
			}
			i++;
		}
		return null;
	},

	addTag: function _addTag(aParent, aTagName, aNameSpace, aValue) {
		if ((!aParent) || (!aParent["elements"])) throw -53;
		var tmpJson = {tagName: aTagName,
				nameSpace: aNameSpace,
				elements: []};
		if (aValue) {
			realAddContent(tmpJson, convertSpecialCharatersToXML(aValue));
		}
		aParent.elements.push(tmpJson);

		return aParent.elements[aParent.elements.length-1];
	},

	elementToString: function _elementToString(aElement) {
		return realElementToString(aElement);
	},

	toString: function _toString(aParent) {
		var result = "";
		var i = 0;
		//dump(" !!!!!:"+JSON.stringify(aParent)+"\n");
		if (aParent["tagName"]) {
			result = result + realElementToString(aParent);
		}
		else {
			while (i < aParent.elements.length) {
				result = result + realElementToString(aParent.elements[i]);
				i++;
			}
		}

		return result;
	},

	openingTag: function _openingTag(aParent, aTagName) {
		return realOpeningTag(aParent, aTagName);
	},

	addContent: function _addContent(aParent, aString) {
		realAddContent(aParent, aString);
	},

	closingTag: function _closingTag(aParent, aTagName) {
		return realClosingTag(aParent, aTagName);
	},

	getAttributeByTag: function _getAttributeByTag(aParent, aTagName, aName) {
//dump("getAttributeByTag 1: aParent:"+aParent+", aTagName="+aTagName+", aName="+aName+"\n");
		if ((!aParent) || (!aParent['elements']) || (!aTagName)) throw -80;

		let i = 0;
		var tmpTN = splitTagName(aTagName);

		while (i < aParent.elements.length) {
			if ((tmpTN.tagName == aParent.elements[i].tagName) && (aParent.elements[i]["attributes"])) { // We ignore namespace for now.
				if (aParent.elements[i].attributes[aName]) {
					return aParent.elements[i].attributes[aName];
				}
			}
			i++;
		}
		return null;
	},

	getAttribute: function _getAttribute(aParent, aName, aDefault) {
		if (!aParent) throw -70;

		if ((!aParent["attributes"]) || (!aParent.attributes[aName])) {
			if (aDefault) {
				return aDefault;
			}
			return null;
		}

		return convertSpecialCharatersFromXML(aParent.attributes[aName]);
	},

	setAttribute: function _setAttribute(aParent, aName, aValue) {
		realSetAttribute(aParent, aName, convertSpecialCharatersToXML(aValue));
	},

	setAttributeStr: function _setAttributeStr(aParent, aString) {
		realSetAttributeStr(aParent, aString);
	},

	parseXML: function _parseXML(aJSONObject, aXMLString) {

		var currentjson = aJSONObject;

		if (!aXMLString) return;

	try{
		var pos = 0;
		var xmlHeaderPos = hasXMLHeader(aXMLString, pos);
		if (xmlHeaderPos > 0) {
			//dump("We have an XML header. Going to strip it.\n");
			pos = xmlHeaderPos;
		}

		var strLength = aXMLString.length;
		while (pos < strLength) {
			var tmpPos = findCharacter(aXMLString, pos, "<");
			if (tmpPos > -1) {
				// Found openingcharacter of element.
				let skipped = tmpPos - pos;
				if (skipped > 0) {
					// Found data before element.
					realAddContent(currentjson,aXMLString.substr(pos, skipped));
				}
				pos = tmpPos + 1;
			}
			var tc = aXMLString[pos];

			if ( (pos < strLength) && (tc == "/")) {
				// Found character for closing element
				pos++;
				tmpPos = findCharacter(aXMLString, pos, ">");
				if (tmpPos > -1) {
					// found end character of closing element.
					currentjson = realClosingTag(currentjson, aXMLString.substr(pos, tmpPos-pos)); 
				}
				else {
					// Did not find end character of closing element. Error.
					throw -7;
				}
				pos = tmpPos + 1;
			}
			else {
				// Check element name
				if (pos < strLength) {
					let tmpPos = findCharacter(aXMLString, pos, ">");
					if (tmpPos > -1) {
						let elementName = "";
						tc = aXMLString[pos];
						while ((pos < strLength) && (tc != ">") && 
							(tc != "/") && (!(isInList(specialChars1,tc)))) {
							elementName = elementName + tc;
							pos++;
							tc = aXMLString[pos];
						}
						currentjson = realOpeningTag(currentjson, elementName);

						// We have an element name. Let see if it contains data or is closed.
						if ((pos < strLength) && (tc == "/")) {
							// It is closed.
							currentjson = realClosingTag(currentjson, elementName);
							pos++;
						}
						else {
							// Element is not closed. Let see if it contains attributes.
							if ((pos < strLength) && (isInList(specialChars1,tc))) {
								var attribute = "";
								pos++;
								tc = aXMLString[pos];
								var quoteOpen = false;
								var seenAttributeSeparator = false;
								var quoteChar = "";
								while ((pos < strLength) && 
									(((tc != ">") && (tc != "/")) || (quoteOpen)) ) {
									attribute = attribute + tc;
									if ((!seenAttributeSeparator) && (tc == "=") && (!quoteOpen)){seenAttributeSeparator = true;}
									else {
										if (seenAttributeSeparator) {
											if ((tc == '"') || (tc == "'")) {
												if ((!quoteOpen) || ((quoteOpen) && (quoteChar == tc))) {
													quoteOpen = !quoteOpen;
													if (quoteOpen) {quoteChar = tc;}
												}
											}
										}
									}
									pos++;
									tc = aXMLString[pos];
									if ((seenAttributeSeparator) && (pos < strLength) && (isInList(specialChars1,tc)) && (!quoteOpen)) {
										realSetAttributeStr(currentjson, attribute);
										attribute = "";
										seenAttributeSeparator = false;
										pos++;
										tc = aXMLString[pos];
									}
								}
								if ((seenAttributeSeparator) && (!quoteOpen) && (pos < strLength) && (attribute.length > 0)) {
									realSetAttributeStr(currentjson, attribute);
									seenAttributeSeparator = false;
									attribute = "";
								}
								if ((pos < strLength) && (tc == "/")) {
									// Found opening tag with attributes which is also closed.
									currentjson = realClosingTag(currentjson, elementName);
									pos++;
									tc = aXMLString[pos];
								}
							
								if (!((pos < strLength) && (tc == ">"))) {
									throw -8; // Expected closing character of element field
								}
								pos++;
							}
							else {
								if (!((pos < strLength) && (tc == ">"))) {
									throw -9; // Expected closing character of element field
								}
								pos++;
							}
						}
					}
					else {
						throw -10; // Expected closing character of element field but did not find it.
					}
				}
				else {
					throw -11; // No more characters left
				}
			}
		} // While.
	}
	catch(err){ dump(" !! Err:"+err+"("+STACK()+"\n");}

	},

	XPath: function _XPath(aParent, aPath){
		//dump("XPath:"+aPath+"\n");
		//dump("aParent:"+JSON.stringify(aParent)+"\n");
		//dump("..\n");

		return realXPath(aParent, aPath);
	},

}

