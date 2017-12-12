
function getLanguages(){
	$.ajax({
  		url: "https://sanat.csc.fi/smsxml/listLanguages/",
		success: setLanguages,
		error: handleError
	});
}
$( document ).ready(function() {
    getLanguages();
});

function searchWord(event){
	event.preventDefault();
	var language = selectedLanguage;
	var word = $("#searchField").val();
	localStorage.setItem("lastUsedLanguage", language);
	showLoading(true);
	$.ajax({
  		url: "https://sanat.csc.fi/smsxml/search/",
  		data: {"language": language, "word": word},
		success: showResults,
		error: handleError
	});
}

function showLanguagesButton(event){
	event.preventDefault();
	event.stopPropagation();
	showLanguages(true);
}

function showLanguages(show){
	if(show){
		$("#language-radios").css("display", 'block');
		$("#show-languages").css("display", 'none');
	}else{
		$("#show-languages").html(_(selectedLanguage) + " <button class='btn btn-info' onclick='showLanguagesButton(event)'>Näytä kielivalinta</button>")
		$("#language-radios").css("display", 'none');
		$("#show-languages").css("display", 'block');
	}
}

function showResults(data){
	showLoading(false);
	currentResults = data;
	showLanguages(false);
	if($.isEmptyObject(data["exact_match"])){
		$("#visibleResult").html("<p>Sanaa ei löytynyt</p>");
		if(data["lemmatized"].length == 1){
			displayJson(data["lemmatized"][0]);
		}else{
			var other_ls = Object.keys(data["other_languages"]);
			if (other_ls.length == 1){
				displayJson(data["other_languages"][other_ls[0]][0]);
			}
		}
	}else{
		displayMatch();
	}
	showForms(data);
	showOtherLanguages(data);
}

function showOtherLanguages(data){
	var html = "";
	var other_languages = data["other_languages"];
	if(Object.keys(other_languages).length > 0){
		html = html + "<p>Hakuosuma muilla kielillä ";
		for(var lang in other_languages){
			var translations = other_languages[lang];
			for (var i = 0; i < translations.length; i++) {
				var translation = translations[i];
				html = html + "<span class='link' onclick='displayTranslation(\""+lang+"\", \""+translation["lemma"]+"\")'>"+lang+":"+data["query"]+" - " + translation["lemma"] +"</span>, ";
				
			}
		}
		html = html + "</p>"
	}
	$("#resultOtherLanguages").html(html);
}

function showForms(data){
	var html = "";
	if (data["lemmatized"].length >0){
			var html = html + "<p>" + data["query"] + " on taivutusmuoto sanoille ";
			for (var i = 0; i < data["lemmatized"].length; i++) {
				var  wordForm = data["lemmatized"][i];
				html = html + "<span class=\"link\" onclick=\"displayForm('"+wordForm["lemma"]+"')\">"+wordForm["lemma"]+"</span>, ";
			}
			html = html + "</p>";
	}
	$("#resultForms").html(html);
}

function parseMG(mgdata){
	return_array = {"defNative": [], "examples": []}
	for (var i = 0; i < mgdata.length; i++) {
		mg_item = mgdata[i];
		if( mg_item["element"] == "defNative" && mg_item["text"] != null){
			return_array["defNative"].push(mg_item["text"]);
		}else if( mg_item["element"] == "xg" && mg_item["text"] != null){
			return_array["examples"].push(mg_item["text"]);
		}
	}
	return return_array;
}

function displayJson(data){
	var html = "<h3>"+ data["lemma"]+ "</h3>";
	console.log(data);
	var homonyms = data["homonyms"];
	for (var i = 0; i < homonyms.length; i++) {
		var homonym = homonyms[i];
		var translations = homonym["translations"];
		var languages = Object.keys(translations);
		languages.sort();
		for (var a = 0; a < languages.length; a++) {
			var language = languages[a];
			html = html + "<h5>"+_(language)+"</h5><ul>";
			var tr_words = translations[language];
			for (var u = 0; u < tr_words.length; u++) {
				var tr_word = tr_words[u];
				html = html + "<li>"+tr_word["word"] + " - " + _(tr_word["pos"])+"</li>";
			}
			html = html + "</ul>";
		}
		var other_data = parseMG(homonym["mg_data"]);
		if(other_data["defNative"].length >0 ){
			html = html + "<h4>Määritelmät</h4><ul>";
			for (var q = 0; q < other_data["defNative"].length; q++) {
				var definition = other_data["defNative"][q];
				html = html + "<li>" + definition + "</li>";
			}
			html = html + "</ul>";
		}
		if (other_data["examples"].length >0 ){
			html = html + "<h4>Esimerkit</h4><ul>";
			for (var q = 0; q < other_data["examples"].length; q++) {
				var example = other_data["examples"][q];
				html = html + "<li>" + example.replace("<xt", "<span class='text-italic'").replace("<x", "<span").replace("</x", "</span") + "</li>";
			}
			html = html + "</ul>";
		}
		html = html + "<p><a target='_blank' href='http://sanat.csc.fi/wiki/"+currentResults["language"]+ ":" + data["lemma"] +"'>Muokkaa wikissä...</a></p>"
	}
	$("#visibleResult").html(html);
}

function displayForm(word){
	for (var i = 0; i < currentResults["lemmatized"].length; i++) {
		var form = currentResults["lemmatized"][i];
		if (form["lemma"] == word){
			displayJson(form);
			break;
		}
	}
}

function displayTranslation(language, word){
	var words = currentResults["other_languages"][language];
	for (var i = 0; i < words.length; i++) {
		var w = words[i];
		if(w["lemma"] == word){
			displayJson(w);
			break;

		}
	}
}

function displayMatch(){
	displayJson(currentResults["exact_match"]);
}

var currentResults = null;

function handleError(e){
	showLoading(false);
	console.log(e);
    // Get the snackbar DIV
    var x = document.getElementById("snackbar")

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function setLanguages(data){
	showLoading(false);
	var languages = data["languages"];
	var html = "";
	for (var i = 0; i < languages.length; i++) {
		var lang = languages[i];
		html = html + "<a href='#' onclick='selectLanguage(event)' class='list-group-item language-list' value=\""+ lang +"\">";
		html = html +  _(lang) + "</a>";
	}
	$("#language-radios").html(html);

	var lastLang = localStorage.getItem("lastUsedLanguage");
	if (lastLang == null){
		lastLang = "sms";
	}
	selectedLanguage = lastLang;
	$('.language-list').removeClass('active');
	$(".language-list[value=" + lastLang + "]").addClass("active");

}
function showLoading(show){
	if (show){
		$('.loader').css("display", 'block');
	}else{
		$('.loader').css("display", 'none');
	}
}
var selectedLanguage = "sms";

function selectLanguage(event){
	$('.language-list').removeClass('active');
	selectedLanguage = $(event.target).attr("value")
	$(event.target).addClass("active");
}
function _(text){
	if (text in translations){
		return translations[text];
	}
	return text;
}

var translations = {"fin": "suomi", "eng": "englanti", "rus": "venäjä", "deu": "saksa", "nob": "norja (bokmål)", "sme": "pohjoissaame", "mdf": "moksha", "olo": "aunuksenkarjala", "myv": "ersä", "yrk": "nenetsi", "koi" : "komipermjaki","sms": "koltansaame", "izh": "inkeroinen", "udm": "udmurtti", "mhr": "niittymari", "mrj": "vuorimari", "vot": "vatja"}


